package com.muse.social.feed.service;

import com.muse.social.feed.entity.*;
import com.muse.social.feed.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for study groups
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GroupService {

    private final StudyGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;

    /**
     * Create a new study group
     */
    @Transactional
    public StudyGroup createGroup(String creatorId, String name, String description,
            StudyGroup.GroupType groupType, StudyGroup.GroupVisibility visibility,
            List<String> hashtags, List<String> subjects) {
        StudyGroup group = StudyGroup.builder()
                .name(name)
                .description(description)
                .createdBy(creatorId)
                .groupType(groupType)
                .visibility(visibility)
                .hashtags(hashtags)
                .subjects(subjects)
                .memberCount(1)
                .build();

        group = groupRepository.save(group);

        // Add creator as owner
        GroupMember ownerMember = GroupMember.builder()
                .groupId(group.getId())
                .userId(creatorId)
                .role(GroupMember.MemberRole.OWNER)
                .build();
        memberRepository.save(ownerMember);

        log.info("Created group {} by user {}", group.getId(), creatorId);
        return group;
    }

    /**
     * Join a group
     */
    @Transactional
    public void joinGroup(UUID groupId, String userId) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        if (memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new IllegalStateException("Already a member of this group");
        }

        // Check visibility
        if (group.getVisibility() == StudyGroup.GroupVisibility.SECRET) {
            throw new IllegalArgumentException("Cannot join secret group without invite");
        }

        // Check if approval needed
        if (group.getJoinApproval() == StudyGroup.ApprovalType.ADMIN_APPROVAL) {
            // Would create join request here
            log.info("Join request created for group {} by user {}", groupId, userId);
            return;
        }

        // Direct join
        GroupMember member = GroupMember.builder()
                .groupId(groupId)
                .userId(userId)
                .role(GroupMember.MemberRole.MEMBER)
                .build();
        memberRepository.save(member);

        // Update member count
        group.setMemberCount(group.getMemberCount() + 1);
        groupRepository.save(group);

        log.info("User {} joined group {}", userId, groupId);
    }

    /**
     * Leave a group
     */
    @Transactional
    public void leaveGroup(UUID groupId, String userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new IllegalStateException("Not a member of this group");
        }

        memberRepository.deleteByGroupIdAndUserId(groupId, userId);

        groupRepository.findById(groupId).ifPresent(group -> {
            group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
            groupRepository.save(group);
        });

        log.info("User {} left group {}", userId, groupId);
    }

    /**
     * Get user's groups
     */
    public List<StudyGroup> getMyGroups(String userId) {
        return groupRepository.findByMemberId(userId);
    }

    /**
     * Discover public groups
     */
    public List<StudyGroup> discoverGroups() {
        return groupRepository.findPopularPublicGroups();
    }

    /**
     * Search groups
     */
    public List<StudyGroup> searchGroups(String query) {
        return groupRepository.searchGroups(query);
    }

    /**
     * Get group members
     */
    public List<GroupMember> getGroupMembers(UUID groupId) {
        return memberRepository.findByGroupId(groupId);
    }

    /**
     * Check if user is member
     */
    public boolean isMember(UUID groupId, String userId) {
        return memberRepository.existsByGroupIdAndUserId(groupId, userId);
    }

    /**
     * Check if user is admin
     */
    public boolean isAdmin(UUID groupId, String userId) {
        return memberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getRole() == GroupMember.MemberRole.OWNER ||
                        m.getRole() == GroupMember.MemberRole.ADMIN)
                .orElse(false);
    }
}
