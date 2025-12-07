package com.muse.auth.profile;

import com.muse.auth.client.AuthServiceClient;
import com.muse.auth.client.NotesServiceClient;
import com.muse.auth.client.dto.UserDto;
import com.muse.auth.chat.MessageRepository;
import com.muse.auth.chat.DeviceRepository;
// import com.muse.auth.parental.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class UserStatsService {

    private final AuthServiceClient authServiceClient;
    private final NotesServiceClient notesServiceClient;

    @Autowired(required = false)
    private MessageRepository messageRepo;
    @Autowired(required = false)
    private DeviceRepository deviceRepo;
    // @Autowired(required = false)
    // private ActivityLogRepository activityRepo;

    public UserStatsService(AuthServiceClient authServiceClient, NotesServiceClient notesServiceClient) {
        this.authServiceClient = authServiceClient;
        this.notesServiceClient = notesServiceClient;
    }

    public Mono<Map<String, Object>> getUserStats(Long userId, String accessToken) {
        return authServiceClient.getUserById(userId)
                .flatMap(user -> {
                    Map<String, Object> out = new HashMap<>();
                    out.put("userId", userId);
                    out.put("username", user.getUsername());
                    out.put("email", user.getEmail());
                    out.put("createdAt", user.getCreatedAt());
                    out.put("lastLogin", user.getLastLoginAt() != null ? user.getLastLoginAt() : Instant.now());

                    return notesServiceClient.getNoteCountForUser(accessToken)
                            .map(notesCount -> {
                                out.put("notesCount", notesCount);

                                // --- Message Count ---
                                long messages = 0;
                                try {
                                    if (messageRepo != null)
                                        messages = messageRepo.countBySenderUserId(userId);
                                } catch (Exception ignored) {
                                }
                                out.put("messagesSent", messages);

                                // --- Devices ---
                                int deviceCount = 0;
                                try {
                                    if (deviceRepo != null)
                                        deviceCount = deviceRepo.findByUserId(userId).size();
                                } catch (Exception ignored) {
                                }
                                out.put("deviceCount", deviceCount);

                                // --- Parental Activity (if child) ---
                                long parentalEvents = 0;
                                // try {
                                // if (activityRepo != null) {
                                // parentalEvents = activityRepo.findTop50ByChildIdInOrderByTimestampDesc(
                                // java.util.List.of(userId)
                                // ).size();
                                // }
                                // } catch (Exception ignored) {}
                                out.put("activityEvents", parentalEvents);

                                return out;
                            });
                })
                .defaultIfEmpty(Map.of("error", "User not found"));
    }
}
