package com.muse.auth.admin;

import com.muse.auth.client.AuthServiceClient;
import com.muse.auth.client.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AuthServiceClient authServiceClient;

    // Helper to extract admin's access token from Authentication object
    // This is a placeholder; a robust solution would involve a dedicated token management strategy
    private String getAdminAccessToken(Authentication auth) {
        // In a real scenario, the admin's JWT would be extracted from the Authentication object
        // For now, we'll assume a dummy token or a mechanism to get it.
        // This part needs careful implementation based on how admin tokens are handled.
        return "dummy_admin_token"; // Placeholder
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')") // Assuming these roles can access
    public Mono<ResponseEntity<List<UserDto>>> listPending(Authentication auth) {
        String adminAccessToken = getAdminAccessToken(auth);
        return authServiceClient.getPendingUsers(adminAccessToken)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public Mono<ResponseEntity<UserDto>> approve(@PathVariable Long id, Authentication auth) {
        String adminAccessToken = getAdminAccessToken(auth);
        return authServiceClient.approveUser(id, adminAccessToken)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/{id}/block")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public Mono<ResponseEntity<UserDto>> block(@PathVariable Long id, Authentication auth) {
        String adminAccessToken = getAdminAccessToken(auth);
        return authServiceClient.blockUser(id, adminAccessToken)
                .map(ResponseEntity::ok);
    }

    @PostMapping("/{id}/delete")
    @PreAuthorize("hasRole('SUPER_ADMIN') or hasRole('ADMIN')")
    public Mono<ResponseEntity<Map<String, String>>> delete(@PathVariable Long id, Authentication auth) {
        String adminAccessToken = getAdminAccessToken(auth);
        return authServiceClient.deleteUser(id, adminAccessToken)
                .map(ResponseEntity::ok);
    }
}
