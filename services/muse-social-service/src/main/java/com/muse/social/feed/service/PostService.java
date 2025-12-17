package com.muse.social.feed.service;

import com.muse.social.feed.client.AuthServiceClient;
import com.muse.social.feed.dto.PostResponse;
import com.muse.social.feed.dto.UserDto;
import com.muse.social.feed.entity.Post;
import com.muse.social.feed.entity.UserInterest;
import com.muse.social.feed.repository.CommentRepository;
import com.muse.social.feed.repository.PostRepository;
import com.muse.social.feed.repository.ReactionRepository;
import com.muse.social.feed.repository.UserInterestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final EmbeddingService embeddingService;
    private final UserInterestRepository userInterestRepository;
    private final AuthServiceClient authServiceClient;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;

    public Mono<List<PostResponse>> getGlobalFeed(Long currentUserId) {
        return getGlobalFeed(currentUserId, 0, 20);
    }

    public Mono<List<PostResponse>> getGlobalFeed(Long currentUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return Mono.fromCallable(() -> postRepository.findAllByOrderByCreatedAtDesc(pageable).getContent())
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(posts -> enrichPosts(posts, currentUserId));
    }

    public Mono<List<PostResponse>> getPostsForUser(Long userId, Long currentUserId) {
        return Mono.fromCallable(() -> postRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(posts -> enrichPosts(posts, currentUserId));
    }

    public Optional<Post> getPostById(Long postId) {
        return postRepository.findById(postId);
    }

    public Post createPost(Long userId, String content, List<String> tags, List<String> mediaUrls,
            Post.MediaType mediaType, String sourceUrl) {
        Post post = Post.builder()
                .userId(userId)
                .content(content)
                .tags(tags)
                .mediaUrls(mediaUrls)
                .mediaType(mediaType)
                .sourceUrl(sourceUrl)
                .build();
        Post savedPost = postRepository.save(post);
        generateAndSaveEmbedding(savedPost);
        return savedPost;
    }

    public Optional<Post> updatePost(Long postId, Long userId, String content, List<String> tags) {
        return postRepository.findById(postId)
                .filter(post -> post.getUserId().equals(userId))
                .map(post -> {
                    post.setContent(content);
                    post.setTags(tags);
                    Post updatedPost = postRepository.save(post);
                    generateAndSaveEmbedding(updatedPost);
                    return updatedPost;
                });
    }

    public boolean deletePost(Long postId, Long userId) {
        return postRepository.findById(postId)
                .filter(post -> post.getUserId().equals(userId))
                .map(post -> {
                    postRepository.delete(post);
                    return true;
                })
                .orElse(false);
    }

    private void generateAndSaveEmbedding(Post post) {
        embeddingService.getEmbedding(post.getContent())
                .subscribe(
                        embedding -> {
                            post.setEmbedding(embedding);
                            postRepository.save(post);
                        },
                        error -> {
                            log.warn("Failed to generate embedding for post {}: {}", post.getId(), error.getMessage());
                        });
    }

    public Mono<List<PostResponse>> semanticSearch(String query, int limit, Long currentUserId) {
        return embeddingService.getEmbedding(query)
                .flatMap(embedding -> {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < embedding.length; i++) {
                        sb.append(embedding[i]);
                        if (i < embedding.length - 1) {
                            sb.append(",");
                        }
                    }
                    return Mono.fromCallable(() -> postRepository.findNearestByEmbedding(sb.toString(), limit))
                            .subscribeOn(Schedulers.boundedElastic());
                })
                .flatMap(posts -> enrichPosts(posts, currentUserId));
    }

    public Mono<List<PostResponse>> getPersonalizedFeed(Long userId, int limit) {
        List<UserInterest> interests = userInterestRepository.findByUserId(userId);
        if (interests.isEmpty()) {
            return getGlobalFeed(userId);
        }

        UserInterest primaryInterest = interests.get(0);
        String query = primaryInterest.getInterestValue();

        return semanticSearch(query, limit, userId);
    }

    private Mono<List<PostResponse>> enrichPosts(List<Post> posts, Long currentUserId) {
        return Flux.fromIterable(posts)
                .flatMap(post -> {
                    Mono<UserDto> userMono = authServiceClient.getUserById(post.getUserId())
                            .defaultIfEmpty(new UserDto()); // Handle missing user

                    return userMono.map(user -> {
                        int likes = reactionRepository.countByTargetIdAndTargetType(post.getId(), "POST");
                        int comments = commentRepository.countByPostId(post.getId());
                        boolean likedByMe = currentUserId != null && reactionRepository
                                .existsByUserIdAndTargetIdAndTargetType(currentUserId, post.getId(), "POST");

                        return PostResponse.builder()
                                .id(post.getId())
                                .userId(post.getUserId())
                                .authorUsername(user.getUsername() != null ? user.getUsername() : "Unknown")
                                .authorAvatarUrl(user.getAvatarUrl())
                                .content(post.getContent())
                                .tags(post.getTags())
                                .mediaUrls(post.getMediaUrls())
                                .mediaType(post.getMediaType())
                                .createdAt(post.getCreatedAt())
                                .updatedAt(post.getUpdatedAt())
                                .likeCount(likes)
                                .commentCount(comments)
                                .likedByMe(likedByMe)
                                .build();
                    }).subscribeOn(Schedulers.boundedElastic()); // Ensure DB calls in map don't block
                })
                .collectList();
    }
}
