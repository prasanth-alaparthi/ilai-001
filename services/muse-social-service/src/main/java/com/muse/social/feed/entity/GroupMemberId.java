package com.muse.social.feed.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class GroupMemberId implements Serializable {
    private UUID groupId;
    private String userId;

    public GroupMemberId() {
    }

    public GroupMemberId(UUID groupId, String userId) {
        this.groupId = groupId;
        this.userId = userId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        GroupMemberId that = (GroupMemberId) o;
        return Objects.equals(groupId, that.groupId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(groupId, userId);
    }
}
