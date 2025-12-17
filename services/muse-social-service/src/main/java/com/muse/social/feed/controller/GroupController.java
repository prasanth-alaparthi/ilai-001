package com.muse.social.feed.controller;

import com.muse.social.feed.dto.*;
import com.muse.social.feed.entity.*;
import com.muse.social.feed.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Study Groups Controller
 */
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Slf4j
public class GroupController {

    private final GroupService groupService;

    /**
     * POST /api/groups - Create a new study group
     */
    @PostMapping
    public ResponseEntity<StudyGroupDTO> createGroup(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CreateGroupRequest request) {

        String userId = getUserId(jwt);

        StudyGroup group = groupService.createGroup(
                userId,
                request.getName(),
                request.getDescription(),
                request.getGroupType() != null ? request.getGroupType() : StudyGroup.GroupType.TOPIC,
                request.getVisibility() != null ? request.getVisibility() : StudyGroup.GroupVisibility.PUBLIC,
                request.getHashtags(),
                request.getSubjects());

        StudyGroupDTO dto = StudyGroupDTO.fromEntity(group);
        dto.setIsMember(true);
        dto.setIsAdmin(true);

        return ResponseEntity.ok(dto);
    }

    /**
     * GET /api/groups/{id} - Get group details
     */
    @GetMapping("/{groupId}")
    public ResponseEntity<StudyGroupDTO> getGroup(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID groupId) {

        String userId = getUserId(jwt);

        return groupService.getMyGroups(userId).stream()
                .filter(g -> g.getId().equals(groupId))
                .findFirst()
                .or(() -> groupService.discoverGroups().stream()
                        .filter(g -> g.getId().equals(groupId))
                        .findFirst())
                .map(group -> {
                    StudyGroupDTO dto = StudyGroupDTO.fromEntity(group);
                    dto.setIsMember(groupService.isMember(groupId, userId));
                    dto.setIsAdmin(groupService.isAdmin(groupId, userId));
                    return ResponseEntity.ok(dto);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/groups/{id}/join - Join a group
     */
    @PostMapping("/{groupId}/join")
    public ResponseEntity<Map<String, Object>> joinGroup(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID groupId) {

        String userId = getUserId(jwt);
        groupService.joinGroup(groupId, userId);

        return ResponseEntity.ok(Map.of(
                "joined", true,
                "message", "Successfully joined the group"));
    }

    /**
     * POST /api/groups/{id}/leave - Leave a group
     */
    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Map<String, Object>> leaveGroup(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID groupId) {

        String userId = getUserId(jwt);
        groupService.leaveGroup(groupId, userId);

        return ResponseEntity.ok(Map.of(
                "left", true,
                "message", "Left the group"));
    }

    /**
     * GET /api/groups/my - Get my groups
     */
    @GetMapping("/my")
    public ResponseEntity<List<StudyGroupDTO>> getMyGroups(@AuthenticationPrincipal Jwt jwt) {
        String userId = getUserId(jwt);

        List<StudyGroupDTO> groups = groupService.getMyGroups(userId).stream()
                .map(group -> {
                    StudyGroupDTO dto = StudyGroupDTO.fromEntity(group);
                    dto.setIsMember(true);
                    dto.setIsAdmin(groupService.isAdmin(group.getId(), userId));
                    return dto;
                })
                .toList();

        return ResponseEntity.ok(groups);
    }

    /**
     * GET /api/groups/discover - Discover public groups
     */
    @GetMapping("/discover")
    public ResponseEntity<List<StudyGroupDTO>> discoverGroups(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "20") int limit) {

        String userId = getUserId(jwt);

        List<StudyGroupDTO> groups = groupService.discoverGroups().stream()
                .limit(limit)
                .map(group -> {
                    StudyGroupDTO dto = StudyGroupDTO.fromEntity(group);
                    dto.setIsMember(groupService.isMember(group.getId(), userId));
                    return dto;
                })
                .toList();

        return ResponseEntity.ok(groups);
    }

    /**
     * GET /api/groups/search - Search groups
     */
    @GetMapping("/search")
    public ResponseEntity<List<StudyGroupDTO>> searchGroups(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam String q,
            @RequestParam(defaultValue = "20") int limit) {

        String userId = getUserId(jwt);

        List<StudyGroupDTO> groups = groupService.searchGroups(q).stream()
                .limit(limit)
                .map(group -> {
                    StudyGroupDTO dto = StudyGroupDTO.fromEntity(group);
                    dto.setIsMember(groupService.isMember(group.getId(), userId));
                    return dto;
                })
                .toList();

        return ResponseEntity.ok(groups);
    }

    /**
     * GET /api/groups/{id}/members - Get group members
     */
    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMember>> getMembers(@PathVariable UUID groupId) {
        List<GroupMember> members = groupService.getGroupMembers(groupId);
        return ResponseEntity.ok(members);
    }

    // ==================== Helper ====================

    private String getUserId(Jwt jwt) {
        return jwt != null ? jwt.getSubject() : "anonymous";
    }
}
