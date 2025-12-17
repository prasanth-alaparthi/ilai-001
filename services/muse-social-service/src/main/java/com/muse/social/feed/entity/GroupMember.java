package com.muse.social.feed.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Group membership
 */
@Entity
@Table(name = "group_members")
@IdClass(GroupMemberId.class)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMember {

    @Id
    @Column(name = "group_id")
    private UUID groupId;

    @Id
    @Column(name = "user_id")
    private String userId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MemberRole role = MemberRole.MEMBER;

    @Column(name = "joined_at")
    private Instant joinedAt;

    public enum MemberRole {
        OWNER, ADMIN, MODERATOR, MEMBER
    }

    @PrePersist
    protected void onCreate() {
        this.joinedAt = Instant.now();
    }
}
