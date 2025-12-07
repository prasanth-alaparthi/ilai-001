package com.muse.auth.auth.controller;

import com.muse.auth.auth.dto.MeResponse;
import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.service.ParentService;
import com.muse.auth.security.CustomUserDetails;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
public class ParentController {

    private final ParentService parentService;

    public record AddChildRequest(@NotBlank String childIdentifier) {
    }

    @PostMapping("/children")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> addChild(@Valid @RequestBody AddChildRequest req,
            @AuthenticationPrincipal CustomUserDetails cud) {
        try {
            parentService.addChild(cud.getUsername(), req.childIdentifier());
            return ResponseEntity.ok(Map.of("status", "success", "message", "Child added successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/children")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> getChildren(@AuthenticationPrincipal CustomUserDetails cud) {
        Set<User> children = parentService.getChildren(cud.getUsername());
        List<MeResponse> response = children.stream()
                .map(child -> MeResponse.builder()
                        .id(child.getId())
                        .username(child.getUsername())
                        .email(child.getEmail())
                        .role(child.getRole())
                        .status(child.getStatus())
                        .institutionId(child.getInstitution() != null ? child.getInstitution().getId() : null)
                        .institutionName(child.getInstitution() != null ? child.getInstitution().getName() : null)
                        .verificationStatus(child.getVerificationStatus())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/children/{childId}/permissions")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> getChildPermissions(@PathVariable Long childId,
            @AuthenticationPrincipal CustomUserDetails cud) {
        try {
            Map<String, Object> permissions = parentService.getChildPermissions(cud.getUsername(), childId);
            return ResponseEntity.ok(permissions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }
}
