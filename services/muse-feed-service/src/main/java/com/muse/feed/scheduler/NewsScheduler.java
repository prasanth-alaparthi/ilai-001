package com.muse.feed.scheduler;

import com.muse.feed.service.NewsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class NewsScheduler {

    private final NewsService newsService;

    // Run every 4 hours
    @Scheduled(fixedRate = 14400000)
    public void fetchNews() {
        log.info("Scheduled task: Fetching news...");
        newsService.fetchAndProcessNews();
    }

    // Run on startup (after 1 minute)
    @Scheduled(initialDelay = 60000, fixedRate = Long.MAX_VALUE)
    public void fetchNewsOnStartup() {
        log.info("Startup task: Fetching news...");
        newsService.fetchAndProcessNews();
    }
}
