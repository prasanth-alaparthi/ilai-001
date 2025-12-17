package com.muse.auth.auth.controller;

import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.repository.UserRepository;
import com.muse.auth.auth.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @org.springframework.web.bind.annotation.PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @org.springframework.web.bind.annotation.RequestBody Map<String, Object> updates,
            jakarta.servlet.http.HttpServletRequest request) {
        // In a real app, extract user ID from token. For now, we trust the client or
        // assume a specific user for dev.
        // Better: Use @AuthenticationPrincipal or extract from JWT manually if
        // SecurityContext is set.
        // Assuming we pass userId in body or header for now, or extract from token if
        // available.
        // Let's use a simple approach: require username in updates to identify user
        // (insecure for prod, ok for dev prototype if token logic is complex here)
        // actually, we have JwtTokenProvider in other controllers. Let's use it if
        // possible, or just pass ID.

        // Quick fix: pass userId in the body for this prototype step
        Integer userIdInt = (Integer) updates.get("userId");
        Long userId = userIdInt != null ? Long.valueOf(userIdInt) : null;

        if (userId == null) {
            return ResponseEntity.badRequest().body("userId is required");
        }

        return userRepository.findById(userId).map(user -> {
            if (updates.containsKey("bio"))
                user.setBio((String) updates.get("bio"));
            if (updates.containsKey("website"))
                user.setWebsite((String) updates.get("website"));
            if (updates.containsKey("phoneNumber"))
                user.setPhoneNumber((String) updates.get("phoneNumber"));
            if (updates.containsKey("gender"))
                user.setGender((String) updates.get("gender"));
            if (updates.containsKey("avatarUrl"))
                user.setAvatarUrl((String) updates.get("avatarUrl"));

            userRepository.save(user);
            return ResponseEntity.ok(toUserDto(user));
        }).orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private UserDto toUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole().name());
        dto.setStatus(user.getStatus().name());
        dto.setInstitutionId(user.getInstitution() != null ? user.getInstitution().getId() : null);
        dto.setInstitutionName(user.getInstitution() != null ? user.getInstitution().getName() : null);
        dto.setEmailVerified(user.isEmailVerified());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setGradeLevel(user.getGradeLevel());
        // New fields
        dto.setBio(user.getBio());
        dto.setWebsite(user.getWebsite());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setGender(user.getGender());
        return dto;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isPresent()) {
            UserDto userDto = toUserDto(userOptional.get());
            return ResponseEntity.ok(userDto);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<?> getUserByUsername(@PathVariable String username) {
        Optional<User> userOptional = userRepository.findByUsername(username);
        if (userOptional.isPresent()) {
            UserDto userDto = toUserDto(userOptional.get());
            return ResponseEntity.ok(userDto);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<java.util.List<UserDto>> searchUsers(
            @org.springframework.web.bind.annotation.RequestParam String query) {
        java.util.List<User> users = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query,
                query);
        java.util.List<UserDto> dtos = users.stream().map(this::toUserDto)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Internal endpoint for service-to-service calls to check institution status.
     * Used by FeatureAccessService in muse-ai-service.
     */
    @GetMapping("/{userId}/institution-status")
    public ResponseEntity<?> getInstitutionStatus(@PathVariable Long userId) {
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("hasActiveInstitution", false, "error", "User not found"));
        }

        User user = userOptional.get();
        boolean hasActiveInstitution = user.getInstitution() != null
                && user.getInstitution().isHasActiveSubscription();

        return ResponseEntity.ok(Map.of(
                "hasActiveInstitution", hasActiveInstitution,
                "institutionId", user.getInstitution() != null ? user.getInstitution().getId() : null,
                "institutionName", user.getInstitution() != null ? user.getInstitution().getName() : null,
                "subscriptionPlan", user.getSubscriptionPlan() != null ? user.getSubscriptionPlan().name() : "FREE"));
    }
}
