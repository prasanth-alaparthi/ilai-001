package com.muse.auth.feed.service;

import com.muse.auth.feed.dto.ModerationResult;
import com.muse.auth.feed.entity.PostModerationEvent;
import com.muse.auth.feed.entity.*;
import com.muse.auth.feed.repository.*;
import com.muse.auth.feed.MediaStorage;
import com.muse.auth.feed.MediaType;
import com.muse.auth.feed.PostVisibility;
import com.muse.auth.feed.PostStatus;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;
    private final PostMediaRepository mediaRepository;
    private final PostLikeRepository likeRepository;
    private final PostCommentRepository commentRepository;
    private final PostShareRepository shareRepository;
    private final TranslationService translationService;
    private final ContentModerationService moderationService;
    private final PostModerationEventRepository moderationEventRepository;
    private final ModerationNotificationService notificationService;
    private final MediaStorage mediaStorage;

    @Value("${app.media.storage-path:./uploads}")
    private String storagePath;

    // limits
    @Value("${app.feed.max-media-per-post:10}")
    private int maxMediaPerPost;

    @Value("${app.feed.max-file-size-bytes:10485760}") // 10MB default
    private long maxFileSizeBytes;

    @PostConstruct
    public void init() throws IOException {
        // ensure local directory exists for LocalMediaStorage (optional safety)
        Path p = Path.of(storagePath);
        if (!Files.exists(p)) {
            Files.createDirectories(p);
        }
    }

    private MediaType detectMediaType(String mimeType) {
        if (mimeType == null) return MediaType.OTHER;
        if (mimeType.startsWith("image/")) return MediaType.IMAGE;
        if (mimeType.startsWith("video/")) return MediaType.VIDEO;
        if (mimeType.startsWith("audio/")) return MediaType.AUDIO;
        return MediaType.OTHER;
    }

    private void validateFiles(List<MultipartFile> files) {
        if (files == null) return;
        if (files.size() > maxMediaPerPost) {
            throw new IllegalArgumentException("Too many files. Max " + maxMediaPerPost);
        }
        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;
            if (f.getSize() > maxFileSizeBytes) {
                throw new IllegalArgumentException("File too large. Max " + maxFileSizeBytes + " bytes");
            }
            String ct = f.getContentType();
            if (ct == null ||
                    !(ct.startsWith("image/") || ct.startsWith("video/") || ct.startsWith("audio/"))) {
                throw new IllegalArgumentException("Unsupported file type: " + ct);
            }
        }
    }

    @Transactional
    public Post createPost(String authorUsername,
                           String contentText,
                           String language,
                           PostVisibility visibility,
                           List<MultipartFile> files,
                           Long universityId) throws IOException {

        validateFiles(files);

        // run moderation
        ModerationResult moderation = moderationService.moderatePost(
                contentText == null ? "" : contentText
        );

        PostStatus status;
        String reason = null;
        boolean ageFlagged = false;

        if (!moderation.isStudyRelated() || !moderation.isAgeAppropriate()) {
            // not study-related or not age appropriate
            status = moderation.isAgeAppropriate()
                    ? PostStatus.PENDING_REVIEW   // study issue only
                    : PostStatus.BLOCKED;         // age issues -> hard block
            reason = moderation.getReason();
            ageFlagged = !moderation.isAgeAppropriate();
        } else {
            status = PostStatus.VISIBLE;
        }

        Instant now = Instant.now();
        Post post = Post.builder()
                .authorUsername(authorUsername)
                .contentText(contentText)
                .language(language == null || language.isBlank() ? "auto" : language)
                .visibility(visibility == null ? PostVisibility.PUBLIC : visibility)
                .status(status)
                .subjectTag(moderation.getSubjectTag())
                .blockedReason(reason)
                .ageFlagged(ageFlagged)
                .createdAt(now)
                .updatedAt(now)
                .build();

        List<PostMedia> mediaList = new ArrayList<>();

        if (files != null) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;

                String mimeType = file.getContentType();
                MediaType type = detectMediaType(mimeType);
                String url = mediaStorage.store(file, "post_" + authorUsername);

                PostMedia media = PostMedia.builder()
                        .post(post)
                        .type(type)
                        .url(url)
                        .mimeType(mimeType)
                        .sizeBytes(file.getSize())
                        .build();
                mediaList.add(media);
            }
        }

        post.setMediaList(mediaList);
        Post saved = postRepository.save(post);
        mediaRepository.saveAll(mediaList);

        // create moderation record + notify if needed
        if (status != PostStatus.VISIBLE) {
            PostModerationEvent event = PostModerationEvent.builder()
                    .postId(saved.getId())
                    .authorUsername(authorUsername)
                    .eventType(status == PostStatus.BLOCKED ? "AUTO_BLOCK" : "AUTO_PENDING_REVIEW")
                    .reason(reason)
                    .createdAt(Instant.now())
                    .build();
            moderationEventRepository.save(event);

            String msg = "Post " + saved.getId() + " by " + authorUsername +
                    " flagged: " + reason + " (status=" + status + ")";
            if (universityId != null) {
                notificationService.notifyInstitution(universityId, msg);
            } else {
                notificationService.notifyTeacherOrAdmins(authorUsername, msg);
            }
        }

        return saved;
    }

    /* ===== FEED QUERIES WITH VISIBILITY + PAGINATION ===== */

    @Transactional(readOnly = true)
    public Page<Post> listFeedForUser(String username,
                                      Long universityId,
                                      String scope,
                                      Pageable pageable) {
        // scope: "PUBLIC", "UNIVERSITY", "MY", "ALL"
        // default: PUBLIC + UNIVERSITY + MY where status=VISIBLE
        if (scope == null) scope = "DEFAULT";
        scope = scope.toUpperCase(Locale.ROOT);

        return switch (scope) {
            case "MY" -> postRepository.findByAuthorUsernameAndStatusOrderByCreatedAtDesc(
                    username, PostStatus.VISIBLE, pageable
            );
            case "UNIVERSITY" -> {
                // for now just visibility=UNIVERSITY & status=VISIBLE, real implementation should filter by universityId
                yield postRepository.findByVisibilityAndStatusOrderByCreatedAtDesc(
                        PostVisibility.UNIVERSITY, PostStatus.VISIBLE, pageable
                );
            }
            case "PUBLIC" -> postRepository.findByVisibilityAndStatusOrderByCreatedAtDesc(
                    PostVisibility.PUBLIC, PostStatus.VISIBLE, pageable
            );
            case "ALL" -> postRepository.findByStatusOrderByCreatedAtDesc(
                    PostStatus.VISIBLE, pageable
            );
            default -> {
                // default mix: PUBLIC + UNIVERSITY + MY (only include VISIBLE posts)
                yield postRepository.findVisibleMixedForFeed(username, PostStatus.VISIBLE, pageable);
            }
        };
    }

    @Transactional(readOnly = true)
    public Post getPost(Long id) {
        return postRepository.findById(id).orElse(null);
    }

    @Transactional
    public boolean toggleLike(Post post, String username) {
        var existing = likeRepository.findByPostAndUsername(post, username);
        if (existing.isPresent()) {
            likeRepository.delete(existing.get());
            return false;
        } else {
            PostLike like = PostLike.builder()
                    .post(post)
                    .username(username)
                    .createdAt(Instant.now())
                    .build();
            likeRepository.save(like);
            return true;
        }
    }

    @Transactional(readOnly = true)
    public long countLikes(Post post) {
        return likeRepository.countByPost(post);
    }

    @Transactional(readOnly = true)
    public boolean isLikedBy(Post post, String username) {
        return likeRepository.existsByPostAndUsername(post, username);
    }

    @Transactional
    public PostComment addComment(Post post,
                                  String authorUsername,
                                  String text,
                                  String language,
                                  Long parentCommentId) {
        PostComment parent = null;
        if (parentCommentId != null) {
            parent = commentRepository.findById(parentCommentId).orElse(null);
        }
        Instant now = Instant.now();
        PostComment c = PostComment.builder()
                .post(post)
                .parent(parent)
                .authorUsername(authorUsername)
                .text(text)
                .language(language == null || language.isBlank() ? "auto" : language)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return commentRepository.save(c);
    }

    @Transactional(readOnly = true)
    public List<PostComment> listComments(Post post) {
        return commentRepository.findByPostOrderByCreatedAtAsc(post);
    }

    @Transactional
    public PostShare sharePost(Post post, String sharedByUsername, String message) {
        PostShare s = PostShare.builder()
                .post(post)
                .sharedByUsername(sharedByUsername)
                .message(message)
                .createdAt(Instant.now())
                .build();
        return shareRepository.save(s);
    }

    @Transactional(readOnly = true)
    public long countShares(Post post) {
        return shareRepository.countByPost(post);
    }

    public String translatePostText(Post post, String targetLanguage) {
        String src = post.getLanguage();
        return translationService.translateText(post.getContentText(), src, targetLanguage);
    }

    /* ===== Ownership & editing ===== */

    @Transactional
    public boolean deletePost(Post post, String currentUser, boolean isAdmin) {
        if (!isAdmin && !Objects.equals(post.getAuthorUsername(), currentUser)) {
            return false;
        }
        postRepository.delete(post);
        return true;
    }
}
