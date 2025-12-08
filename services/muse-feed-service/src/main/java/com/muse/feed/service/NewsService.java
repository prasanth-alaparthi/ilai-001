package com.muse.feed.service;

import com.muse.feed.entity.Post;
import com.muse.feed.repository.PostRepository;
import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;

import org.jdom2.Element;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URL;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class NewsService {

    private final PostService postService;
    private final AiContentService aiContentService;
    private final PostRepository postRepository;
    private final com.muse.feed.repository.RssFeedSourceRepository rssFeedSourceRepository;

    private static final List<String> BLOCKED_KEYWORDS = List.of(
            "murder", "kill", "death", "war", "crime", "assault", "drug", "sex",
            "terror", "bomb", "attack", "violence", "suicide", "rape", "abuse",
            "politics", "election", "scandal", "gossip", "celebrity");

    public void fetchAndProcessNews() {
        cleanupDuplicates();
        log.info("Starting educational news fetch cycle...");

        // Fetch active RSS feeds from database, ordered by priority
        List<com.muse.feed.entity.RssFeedSource> feedSources = rssFeedSourceRepository
                .findByActiveTrueOrderByPriorityDesc();

        if (feedSources.isEmpty()) {
            log.warn("No active RSS feed sources found in database");
            return;
        }

        log.info("Found {} active RSS feed sources", feedSources.size());

        // Shuffle feeds for variety
        List<com.muse.feed.entity.RssFeedSource> shuffledFeeds = new ArrayList<>(feedSources);
        java.util.Collections.shuffle(shuffledFeeds);

        // Create HTTP client with redirect policy
        try (java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                .followRedirects(java.net.http.HttpClient.Redirect.NORMAL)
                .build()) {
            for (com.muse.feed.entity.RssFeedSource feedSource : shuffledFeeds) {
                String feedUrl = feedSource.getUrl();
                log.info("Fetching feed: {} ({})", feedSource.getName(), feedUrl);
                try {
                    java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                            .uri(java.net.URI.create(feedUrl))
                            .header("User-Agent",
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                            .timeout(java.time.Duration.ofSeconds(10))
                            .build();

                    java.net.http.HttpResponse<String> response = client.send(request,
                            java.net.http.HttpResponse.BodyHandlers.ofString());

                    if (response.statusCode() != 200) {
                        log.error("Failed to fetch feed {} ({}). Status: {}", feedSource.getName(), feedUrl,
                                response.statusCode());
                        // Track error
                        feedSource.setFetchErrorCount(feedSource.getFetchErrorCount() + 1);
                        rssFeedSourceRepository.save(feedSource);
                        continue;
                    }

                    String body = response.body();

                    if (body == null || body.isBlank()) {
                        continue;
                    }

                    SyndFeedInput input = new SyndFeedInput();
                    SyndFeed feed = input.build(new java.io.StringReader(body));

                    log.info("Feed {} ({}) fetched. Entries found: {}", feedSource.getName(), feedUrl,
                            feed.getEntries().size());

                    int count = 0;
                    for (SyndEntry entry : feed.getEntries()) {
                        if (count >= 10) // Limit to 10 per feed for variety
                            break;

                        if (processEntry(entry)) {
                            count++;
                        }
                    }

                    // Update last fetched timestamp and reset error count on success
                    feedSource.setLastFetchedAt(Instant.now());
                    feedSource.setFetchErrorCount(0);
                    rssFeedSourceRepository.save(feedSource);

                } catch (Throwable e) {
                    log.error("Error fetching feed: {} ({})", feedSource.getName(), feedUrl, e);
                    // Track error
                    feedSource.setFetchErrorCount(feedSource.getFetchErrorCount() + 1);
                    rssFeedSourceRepository.save(feedSource);
                }
            }
        } catch (Throwable e) {
            log.error("Critical error in news fetch cycle", e);
            e.printStackTrace();
        }
        log.info("News fetch cycle completed.");
    }

    private boolean processEntry(SyndEntry entry) {
        try {
            String title = entry.getTitle();
            String originalLink = entry.getLink();
            String description = entry.getDescription() != null ? entry.getDescription().getValue() : "";

            String link = normalizeUrl(originalLink);

            // Deduplication check
            if (link != null && postRepository.existsBySourceUrl(link)) {
                log.info("Skipping existing post: {}", title);
                return false;
            }

            // Also check by title hash if link is missing or unreliable (optional, but good
            // safety)
            // For now, relying on link is safer as titles might change slightly.

            if (!isSafeContent(title, description)) {
                return false;
            }

            String contentForAi = (description != null && !description.isBlank()) ? description : title;
            if (contentForAi == null || contentForAi.isBlank()) {
                log.warn("Skipping entry with no content: {}", title);
                return false;
            }

            String summary;
            try {
                summary = aiContentService.generateSummary(title, contentForAi);
            } catch (Exception e) {
                log.error("AI Summary generation failed for {}: {}", title, e.getMessage());
                summary = contentForAi; // Fallback to original content
            }

            String imageUrl = extractImage(entry, description);

            // Determine media type based on whether we have an actual image
            Post.MediaType mediaType;
            List<String> mediaUrls;

            if (imageUrl != null && !imageUrl.isEmpty()) {
                // We have a real image from the RSS feed
                mediaType = Post.MediaType.IMAGE;
                mediaUrls = List.of(imageUrl);
            } else {
                // No image found - create as text post
                mediaType = Post.MediaType.TEXT;
                mediaUrls = List.of(); // Empty list for text posts
            }

            List<String> tags = new ArrayList<>();
            tags.add("Study");
            tags.add("Learn");
            // Add subject tag based on content
            String lowerTitle = title.toLowerCase();
            if (lowerTitle.contains("history"))
                tags.add("History");
            if (lowerTitle.contains("art"))
                tags.add("Art");
            if (lowerTitle.contains("science"))
                tags.add("Science");
            if (lowerTitle.contains("math"))
                tags.add("Math");
            if (lowerTitle.contains("tech"))
                tags.add("Tech");
            if (lowerTitle.contains("space"))
                tags.add("Space");
            if (lowerTitle.contains("bio"))
                tags.add("Biology");

            // Create post with appropriate media type and URLs
            // Source URL is stored in the sourceUrl field, not in content
            postService.createPost(1L, summary, tags, mediaUrls, mediaType, link);
            log.info("Created educational post: {} [Type: {}]", title, mediaType);
            return true;

        } catch (Exception e) {
            log.error("Error processing entry: {}", entry.getTitle(), e);
            return false;
        }
    }

    @Transactional
    public void cleanupDuplicates() {
        // Temporarily disabled - causing query errors
        // try {
        // postRepository.deleteDuplicatePosts();
        // log.info("Cleaned up duplicate posts.");
        // } catch (Exception e) {
        // log.error("Failed to cleanup duplicates", e);
        // }
    }

    private String normalizeUrl(String url) {
        if (url == null)
            return null;
        url = url.trim();
        // Remove trailing slash
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url;
    }

    private boolean isSafeContent(String title, String description) {
        String content = (title + " " + description).toLowerCase();
        for (String keyword : BLOCKED_KEYWORDS) {
            if (content.contains(keyword)) {
                return false;
            }
        }
        return true;
    }

    private String extractImage(SyndEntry entry, String description) {
        if (entry.getEnclosures() != null && !entry.getEnclosures().isEmpty()) {
            return entry.getEnclosures().get(0).getUrl();
        }

        // Regex for img src
        if (description != null) {
            Matcher matcher = Pattern.compile("<img[^>]+src\\s*=\\s*['\"]([^'\"]+)['\"][^>]*>").matcher(description);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }

        // Media modules
        List<Element> foreignMarkup = entry.getForeignMarkup();
        for (Element element : foreignMarkup) {
            if (("content".equals(element.getName()) || "thumbnail".equals(element.getName()))
                    && "media".equals(element.getNamespacePrefix())) {
                String url = element.getAttributeValue("url");
                if (url != null)
                    return url;
            }
        }
        return null;
    }
}
