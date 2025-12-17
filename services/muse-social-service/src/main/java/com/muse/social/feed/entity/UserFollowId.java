package com.muse.social.feed.entity;

import java.io.Serializable;
import java.util.Objects;

public class UserFollowId implements Serializable {
    private String followerId;
    private String followingId;

    public UserFollowId() {
    }

    public UserFollowId(String followerId, String followingId) {
        this.followerId = followerId;
        this.followingId = followingId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        UserFollowId that = (UserFollowId) o;
        return Objects.equals(followerId, that.followerId) && Objects.equals(followingId, that.followingId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(followerId, followingId);
    }
}
