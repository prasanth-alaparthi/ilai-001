package com.muse.academic.academic.controller;

import com.muse.academic.academic.entity.Club;
import com.muse.academic.academic.entity.ClubMember;
import com.muse.academic.academic.entity.ClubPost;
import com.muse.academic.academic.service.ClubService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    // ========== Club CRUD ==========

    @GetMapping
    public ResponseEntity<List<Club>> getAllClubs(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        List<Club> clubs;
        if (search != null && !search.isEmpty()) {
            clubs = clubService.searchClubs(search);
        } else if (category != null && !category.isEmpty()) {
            clubs = clubService.getClubsByCategory(category);
        } else {
            clubs = clubService.getAllClubs();
        }
        return ResponseEntity.ok(clubs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getClubById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return clubService.getClubById(id)
                .map(club -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("club", club);

                    if (jwt != null) {
                        Long userId;
                        if (jwt.hasClaim("userId")) {
                            userId = jwt.getClaim("userId");
                        } else {
                            try {
                                userId = Long.parseLong(jwt.getSubject());
                            } catch (NumberFormatException e) {
                                userId = 0L; // Mock or invalid
                            }
                        }
                        response.put("isMember", clubService.isMember(id, userId));
                    } else {
                        response.put("isMember", false);
                    }

                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Club> createClub(@RequestBody CreateClubRequest request) {
        // Get JWT from SecurityContext (works with custom JWT filter)
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication();

        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(null);
        }

        org.springframework.security.oauth2.jwt.Jwt jwt;
        if (authentication.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt) {
            jwt = (org.springframework.security.oauth2.jwt.Jwt) authentication.getPrincipal();
        } else {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(null);
        }

        Long creatorId;
        if (jwt.hasClaim("userId")) {
            Object userIdClaim = jwt.getClaim("userId");
            if (userIdClaim instanceof Number) {
                creatorId = ((Number) userIdClaim).longValue();
            } else if (userIdClaim instanceof String) {
                try {
                    creatorId = Long.parseLong((String) userIdClaim);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid userId format in JWT");
                }
            } else {
                throw new IllegalArgumentException("Invalid userId type in JWT");
            }
        } else {
            // Fallback or parse if subject happens to be ID (legacy support)
            try {
                creatorId = Long.parseLong(jwt.getSubject());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("JWT does not contain userId claim and subject is not a valid ID");
            }
        }

        Club club = clubService.createClub(
                request.name(),
                request.description(),
                request.category(),
                request.imageUrl(),
                request.isPrivate(),
                creatorId,
                request.institutionId());

        return ResponseEntity.ok(club);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Club> updateClub(
            @PathVariable Long id,
            @RequestBody UpdateClubRequest request) {
        Club club = clubService.updateClub(
                id,
                request.name(),
                request.description(),
                request.category(),
                request.imageUrl(),
                request.isPrivate());
        return ResponseEntity.ok(club);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClub(@PathVariable Long id) {
        clubService.deleteClub(id);
        return ResponseEntity.noContent().build();
    }

    // ========== Membership ==========

    @GetMapping("/{id}/members")
    public ResponseEntity<List<ClubMember>> getClubMembers(@PathVariable Long id) {
        return ResponseEntity.ok(clubService.getClubMembers(id));
    }

    @GetMapping("/my-clubs")
    public ResponseEntity<List<Club>> getMyClubs(@AuthenticationPrincipal Jwt jwt) {
        Long userId;
        if (jwt.hasClaim("userId")) {
            userId = jwt.getClaim("userId");
        } else {
            try {
                userId = Long.parseLong(jwt.getSubject());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("JWT does not contain userId claim");
            }
        }
        return ResponseEntity.ok(clubService.getClubsByUser(userId));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ClubMember> joinClub(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId;
        if (jwt.hasClaim("userId")) {
            userId = jwt.getClaim("userId");
        } else {
            try {
                userId = Long.parseLong(jwt.getSubject());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("JWT does not contain userId claim");
            }
        }
        ClubMember member = clubService.joinClub(id, userId);
        return ResponseEntity.ok(member);
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveClub(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId;
        if (jwt.hasClaim("userId")) {
            userId = jwt.getClaim("userId");
        } else {
            try {
                userId = Long.parseLong(jwt.getSubject());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("JWT does not contain userId claim");
            }
        }
        clubService.leaveClub(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ========== Posts ==========

    @GetMapping("/{id}/posts")
    public ResponseEntity<List<ClubPost>> getClubPosts(@PathVariable Long id) {
        return ResponseEntity.ok(clubService.getClubPosts(id));
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<ClubPost> createPost(
            @PathVariable Long id,
            @RequestBody CreatePostRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long authorId;
        if (jwt.hasClaim("userId")) {
            authorId = jwt.getClaim("userId");
        } else {
            try {
                authorId = Long.parseLong(jwt.getSubject());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("JWT does not contain userId claim");
            }
        }
        String authorName = jwt.getClaim("name");
        if (authorName == null)
            authorName = "User";

        ClubPost post = clubService.createPost(
                id,
                authorId,
                authorName,
                request.content(),
                request.imageUrl(),
                request.isAnnouncement());

        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long postId) {
        clubService.deletePost(postId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/posts/{postId}/pin")
    public ResponseEntity<ClubPost> togglePinPost(@PathVariable Long postId) {
        return ResponseEntity.ok(clubService.togglePinPost(postId));
    }

    // ========== Events ==========

    @GetMapping("/{id}/events")
    public ResponseEntity<List<com.muse.academic.academic.entity.ClubEvent>> getClubEvents(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean upcomingOnly) {
        return ResponseEntity.ok(clubService.getClubEvents(id, upcomingOnly));
    }

    @PostMapping("/{id}/events")
    public ResponseEntity<com.muse.academic.academic.entity.ClubEvent> createEvent(
            @PathVariable Long id,
            @RequestBody CreateEventRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long creatorId;
        if (jwt.hasClaim("userId")) {
            creatorId = jwt.getClaim("userId");
        } else {
            try {
                creatorId = Long.parseLong(jwt.getSubject());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("JWT does not contain userId claim");
            }
        }

        var event = clubService.createEvent(
                id,
                creatorId,
                request.title(),
                request.description(),
                request.eventDate(),
                request.location(),
                request.meetingLink(),
                request.eventType());

        return ResponseEntity.ok(event);
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long eventId) {
        clubService.deleteEvent(eventId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/events/{eventId}/rsvp")
    public ResponseEntity<com.muse.academic.academic.entity.ClubEvent> rsvpEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(clubService.rsvpEvent(eventId));
    }

    // ========== DTOs ==========

    public record CreateClubRequest(
            String name,
            String description,
            String category,
            String imageUrl,
            Boolean isPrivate,
            Long institutionId) {
    }

    public record UpdateClubRequest(
            String name,
            String description,
            String category,
            String imageUrl,
            Boolean isPrivate) {
    }

    public record CreatePostRequest(
            String content,
            String imageUrl,
            Boolean isAnnouncement) {
    }

    public record CreateEventRequest(
            String title,
            String description,
            java.time.LocalDateTime eventDate,
            String location,
            String meetingLink,
            String eventType) {
    }
}
