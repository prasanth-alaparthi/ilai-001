package com.muse.auth.feed.controller;



import com.muse.auth.feed.entity.FeedBookmark;
import com.muse.auth.feed.entity.FeedItem;
import com.muse.auth.feed.entity.FeedReaction;
import com.muse.auth.feed.entity.FeedView;
import com.muse.auth.feed.repository.FeedBookmarkRepository;
import com.muse.auth.feed.repository.FeedItemRepository;
import com.muse.auth.feed.repository.FeedReactionRepository;
import com.muse.auth.feed.repository.FeedViewRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/feed")
public class FeedController {

    private final FeedItemRepository itemRepo;
    private final FeedReactionRepository reactionRepo;
    private final FeedBookmarkRepository bookmarkRepo;
    private final FeedViewRepository viewRepo;

    public FeedController(FeedItemRepository itemRepo, FeedReactionRepository reactionRepo,
                          FeedBookmarkRepository bookmarkRepo,FeedViewRepository viewRepo) {
        this.itemRepo = itemRepo;
        this.reactionRepo = reactionRepo;
        this.bookmarkRepo = bookmarkRepo;
        this.viewRepo = viewRepo;
    }

    private String currentUser(Authentication auth) {
        if (auth == null) return "anonymous";
        Object p = auth.getPrincipal();
        if (p instanceof org.springframework.security.core.userdetails.UserDetails) return ((org.springframework.security.core.userdetails.UserDetails)p).getUsername();
        return p.toString();
    }

    // paging: client sends page & size
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size) {
        List<FeedItem> list = itemRepo.findPublicFeed(PageRequest.of(page, size));
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return itemRepo.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/reaction")
    public ResponseEntity<?> react(@PathVariable Long id, @RequestBody Map<String,String> body, Authentication auth) {
        String user = currentUser(auth);
        String type = body.getOrDefault("reaction", "like");
        Optional<FeedReaction> existing = reactionRepo.findByFeedItemIdAndUsername(id, user);
        if (existing.isPresent()) {
            FeedReaction er = existing.get();
            if (er.getReactionType().equals(type)) {
                reactionRepo.delete(er);
                return ResponseEntity.ok(Map.of("status","removed"));
            } else {
                er.setReactionType(type);
                reactionRepo.save(er);
                return ResponseEntity.ok(Map.of("status","updated"));
            }
        } else {
            FeedReaction r = new FeedReaction();
            r.setFeedItemId(id);
            r.setUsername(user);
            r.setReactionType(type);
            reactionRepo.save(r);
            return ResponseEntity.ok(Map.of("status","added"));
        }
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<?> bookmark(@PathVariable Long id, Authentication auth) {
        String user = currentUser(auth);
        Optional<FeedBookmark> b = bookmarkRepo.findByFeedItemIdAndUsername(id, user);
        if (b.isPresent()) {
            bookmarkRepo.delete(b.get());
            return ResponseEntity.ok(Map.of("status","removed"));
        } else {
            FeedBookmark nb = new FeedBookmark();
            nb.setFeedItemId(id); nb.setUsername(user);
            bookmarkRepo.save(nb);
            return ResponseEntity.ok(Map.of("status","added"));
        }
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<?> view(@PathVariable Long id, @RequestBody Map<String,Object> body, Authentication auth, @RequestHeader(value="X-Forwarded-For", required=false) String xff) {
        String user = currentUser(auth);
        Integer duration = body.get("duration") == null ? 0 : ((Number)body.get("duration")).intValue();
        FeedView v = new FeedView();
        v.setFeedItemId(id);
        v.setUsername(user.equals("anonymous") ? null : user);
        v.setIp(xff);
        v.setDurationSeconds(duration);
        viewRepo.save(v);
        return ResponseEntity.ok(Map.of("status","ok"));
    }
}