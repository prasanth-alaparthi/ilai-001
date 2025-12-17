package com.muse.ai.service;

import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.net.URI;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Web Scraping Service - Extract text, images, and videos from web pages
 * Used for text selection automation and research features
 */
@Service
@Slf4j
public class WebScrapingService {

    private static final int TIMEOUT_MS = 10000;
    private static final int MAX_IMAGES = 20;
    private static final int MAX_VIDEOS = 10;
    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

    /**
     * Scrape a URL and extract all content
     */
    public Mono<ScrapedContent> scrape(String url) {
        return Mono.fromCallable(() -> doScrape(url))
                .subscribeOn(Schedulers.boundedElastic())
                .timeout(Duration.ofSeconds(15))
                .onErrorResume(e -> {
                    log.error("Scraping failed for {}: {}", url, e.getMessage());
                    return Mono.just(ScrapedContent.builder()
                            .url(url)
                            .error(e.getMessage())
                            .build());
                });
    }

    /**
     * Scrape multiple URLs in parallel
     */
    public Mono<List<ScrapedContent>> scrapeMultiple(List<String> urls) {
        return Mono.zip(
                urls.stream()
                        .map(this::scrape)
                        .collect(Collectors.toList()),
                results -> Arrays.stream(results)
                        .map(r -> (ScrapedContent) r)
                        .collect(Collectors.toList()));
    }

    /**
     * Search and scrape - uses DuckDuckGo instant answers
     */
    public Mono<SearchScrapedResult> searchAndScrape(String query, int limit) {
        return Mono.fromCallable(() -> {
            // Get DuckDuckGo instant answer
            String ddgUrl = "https://api.duckduckgo.com/?q=" +
                    java.net.URLEncoder.encode(query, "UTF-8") + "&format=json&no_html=1";

            String response = Jsoup.connect(ddgUrl)
                    .ignoreContentType(true)
                    .timeout(TIMEOUT_MS)
                    .execute()
                    .body();

            // Parse DuckDuckGo response
            List<SearchResult> results = parseDuckDuckGoResponse(response, limit);

            // Scrape top results for more details
            List<ScrapedContent> scrapedResults = new ArrayList<>();
            for (SearchResult result : results.stream().limit(3).toList()) {
                try {
                    ScrapedContent scraped = doScrape(result.url);
                    scrapedResults.add(scraped);
                } catch (Exception e) {
                    log.debug("Failed to scrape {}: {}", result.url, e.getMessage());
                }
            }

            return SearchScrapedResult.builder()
                    .query(query)
                    .searchResults(results)
                    .scrapedContent(scrapedResults)
                    .totalResults(results.size())
                    .build();
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private ScrapedContent doScrape(String url) throws Exception {
        log.info("Scraping URL: {}", url);

        Document doc = Jsoup.connect(url)
                .userAgent(USER_AGENT)
                .timeout(TIMEOUT_MS)
                .followRedirects(true)
                .get();

        String baseUri = getBaseUri(url);

        return ScrapedContent.builder()
                .url(url)
                .title(doc.title())
                .description(extractDescription(doc))
                .text(extractMainText(doc))
                .images(extractImages(doc, baseUri))
                .videos(extractVideos(doc, baseUri))
                .metadata(extractMetadata(doc))
                .build();
    }

    private String extractDescription(Document doc) {
        // Try meta description
        Element meta = doc.selectFirst("meta[name=description]");
        if (meta != null) {
            return meta.attr("content");
        }

        // Try og:description
        meta = doc.selectFirst("meta[property=og:description]");
        if (meta != null) {
            return meta.attr("content");
        }

        // Try first paragraph
        Element firstP = doc.selectFirst("p");
        if (firstP != null && firstP.text().length() > 50) {
            return truncate(firstP.text(), 300);
        }

        return "";
    }

    private String extractMainText(Document doc) {
        // Remove script, style, nav, footer elements
        doc.select("script, style, nav, footer, header, aside, .sidebar, .ad, .advertisement").remove();

        // Try to find main content area
        Element main = doc.selectFirst("main, article, .content, .post-content, #content, .entry-content");
        if (main != null) {
            return cleanText(main.text());
        }

        // Fallback to body
        Element body = doc.body();
        if (body != null) {
            return cleanText(body.text());
        }

        return "";
    }

    private List<ImageInfo> extractImages(Document doc, String baseUri) {
        List<ImageInfo> images = new ArrayList<>();

        Elements imgElements = doc.select("img[src]");
        for (Element img : imgElements) {
            if (images.size() >= MAX_IMAGES)
                break;

            String src = img.attr("abs:src");
            if (src.isEmpty()) {
                src = resolveUrl(img.attr("src"), baseUri);
            }

            if (isValidImageUrl(src)) {
                images.add(ImageInfo.builder()
                        .url(src)
                        .alt(img.attr("alt"))
                        .width(parseIntSafe(img.attr("width")))
                        .height(parseIntSafe(img.attr("height")))
                        .build());
            }
        }

        // Also check og:image
        Element ogImage = doc.selectFirst("meta[property=og:image]");
        if (ogImage != null && images.isEmpty()) {
            String ogSrc = ogImage.attr("content");
            if (!ogSrc.isEmpty()) {
                images.add(0, ImageInfo.builder()
                        .url(resolveUrl(ogSrc, baseUri))
                        .alt("Featured image")
                        .build());
            }
        }

        return images;
    }

    private List<VideoInfo> extractVideos(Document doc, String baseUri) {
        List<VideoInfo> videos = new ArrayList<>();

        // YouTube embeds
        Elements iframes = doc.select("iframe[src*=youtube], iframe[src*=youtu.be]");
        for (Element iframe : iframes) {
            if (videos.size() >= MAX_VIDEOS)
                break;

            String src = iframe.attr("src");
            String videoId = extractYouTubeId(src);
            if (videoId != null) {
                videos.add(VideoInfo.builder()
                        .url("https://www.youtube.com/watch?v=" + videoId)
                        .embedUrl(src)
                        .platform("youtube")
                        .thumbnail("https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg")
                        .build());
            }
        }

        // Vimeo embeds
        Elements vimeoIframes = doc.select("iframe[src*=vimeo]");
        for (Element iframe : vimeoIframes) {
            if (videos.size() >= MAX_VIDEOS)
                break;

            String src = iframe.attr("src");
            videos.add(VideoInfo.builder()
                    .url(src)
                    .embedUrl(src)
                    .platform("vimeo")
                    .build());
        }

        // HTML5 video elements
        Elements videoElements = doc.select("video source[src]");
        for (Element video : videoElements) {
            if (videos.size() >= MAX_VIDEOS)
                break;

            String src = video.attr("abs:src");
            if (src.isEmpty()) {
                src = resolveUrl(video.attr("src"), baseUri);
            }
            videos.add(VideoInfo.builder()
                    .url(src)
                    .platform("native")
                    .build());
        }

        return videos;
    }

    private Map<String, String> extractMetadata(Document doc) {
        Map<String, String> metadata = new HashMap<>();

        // Author
        Element author = doc.selectFirst("meta[name=author]");
        if (author != null) {
            metadata.put("author", author.attr("content"));
        }

        // Published date
        Element datePublished = doc.selectFirst("meta[property=article:published_time]");
        if (datePublished != null) {
            metadata.put("publishedDate", datePublished.attr("content"));
        }

        // Site name
        Element siteName = doc.selectFirst("meta[property=og:site_name]");
        if (siteName != null) {
            metadata.put("siteName", siteName.attr("content"));
        }

        // Keywords
        Element keywords = doc.selectFirst("meta[name=keywords]");
        if (keywords != null) {
            metadata.put("keywords", keywords.attr("content"));
        }

        return metadata;
    }

    private List<SearchResult> parseDuckDuckGoResponse(String json, int limit) {
        List<SearchResult> results = new ArrayList<>();

        try {
            // Simple JSON parsing for RelatedTopics
            Pattern topicPattern = Pattern
                    .compile("\"Text\"\\s*:\\s*\"([^\"]+)\"[^}]*\"FirstURL\"\\s*:\\s*\"([^\"]+)\"");
            Matcher matcher = topicPattern.matcher(json);

            while (matcher.find() && results.size() < limit) {
                String text = matcher.group(1);
                String url = matcher.group(2);

                if (url != null && !url.isEmpty()) {
                    results.add(SearchResult.builder()
                            .title(truncate(text, 100))
                            .snippet(text)
                            .url(url)
                            .source("DuckDuckGo")
                            .build());
                }
            }

            // Also get AbstractText and AbstractURL
            Pattern abstractPattern = Pattern.compile("\"AbstractText\"\\s*:\\s*\"([^\"]+)\"");
            Matcher abstractMatcher = abstractPattern.matcher(json);
            if (abstractMatcher.find()) {
                String abstractText = abstractMatcher.group(1);

                Pattern urlPattern = Pattern.compile("\"AbstractURL\"\\s*:\\s*\"([^\"]+)\"");
                Matcher urlMatcher = urlPattern.matcher(json);
                if (urlMatcher.find() && !abstractText.isEmpty()) {
                    results.add(0, SearchResult.builder()
                            .title("Wikipedia")
                            .snippet(truncate(abstractText, 300))
                            .url(urlMatcher.group(1))
                            .source("Wikipedia")
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse DuckDuckGo response: {}", e.getMessage());
        }

        return results;
    }

    // ============== Helper Methods ==============

    private String getBaseUri(String url) {
        try {
            URI uri = new URI(url);
            return uri.getScheme() + "://" + uri.getHost();
        } catch (Exception e) {
            return "";
        }
    }

    private String resolveUrl(String url, String baseUri) {
        if (url == null || url.isEmpty())
            return "";
        if (url.startsWith("http://") || url.startsWith("https://"))
            return url;
        if (url.startsWith("//"))
            return "https:" + url;
        if (url.startsWith("/"))
            return baseUri + url;
        return baseUri + "/" + url;
    }

    private boolean isValidImageUrl(String url) {
        if (url == null || url.isEmpty())
            return false;
        if (url.startsWith("data:"))
            return false;
        if (url.contains("1x1") || url.contains("pixel") || url.contains("spacer"))
            return false;
        String lower = url.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") ||
                lower.endsWith(".png") || lower.endsWith(".gif") ||
                lower.endsWith(".webp") || lower.contains("image");
    }

    private String extractYouTubeId(String url) {
        Pattern pattern = Pattern.compile("(?:embed/|watch\\?v=|youtu\\.be/)([a-zA-Z0-9_-]{11})");
        Matcher matcher = pattern.matcher(url);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String cleanText(String text) {
        if (text == null)
            return "";
        // Remove extra whitespace
        return text.replaceAll("\\s+", " ").trim();
    }

    private String truncate(String text, int maxLen) {
        if (text == null || text.length() <= maxLen)
            return text;
        return text.substring(0, maxLen) + "...";
    }

    private int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s);
        } catch (Exception e) {
            return 0;
        }
    }

    // ============== Data Classes ==============

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ScrapedContent {
        private String url;
        private String title;
        private String description;
        private String text;
        private List<ImageInfo> images;
        private List<VideoInfo> videos;
        private Map<String, String> metadata;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageInfo {
        private String url;
        private String alt;
        private int width;
        private int height;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VideoInfo {
        private String url;
        private String embedUrl;
        private String platform; // youtube, vimeo, native
        private String title;
        private String thumbnail;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResult {
        private String title;
        private String snippet;
        private String url;
        private String source;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchScrapedResult {
        private String query;
        private List<SearchResult> searchResults;
        private List<ScrapedContent> scrapedContent;
        private int totalResults;
    }
}
