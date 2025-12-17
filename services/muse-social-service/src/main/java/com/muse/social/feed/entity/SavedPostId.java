package com.muse.social.feed.entity;

import java.io.Serializable;
import java.util.Objects;

/**
 * Composite key for SavedPost
 */
public class SavedPostId implements Serializable {
    private String userId;
    private Long postId;

    public SavedPostId() {
    }

    public SavedPostId(String userId, Long postId) {
        this.userId = userId;
        this.postId = postId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        SavedPostId that = (SavedPostId) o;
        return Objects.equals(userId, that.userId) && Objects.equals(postId, that.postId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, postId);
    }
}
