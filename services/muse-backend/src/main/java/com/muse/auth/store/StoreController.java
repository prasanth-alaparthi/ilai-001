package com.muse.auth.store;

import com.muse.auth.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/store")
@RequiredArgsConstructor
public class StoreController {

    private final StoreRepository repo;
    private final AuthServiceClient authServiceClient;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    private Mono<Long> resolveUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) return Mono.justOrEmpty(Optional.empty());
        return authServiceClient.getUserByUsername(auth.getName())
                .map(userDto -> userDto.getId());
    }

    @GetMapping("/items")
    public ResponseEntity<?> items() {
        return ResponseEntity.ok(Map.of("items", repo.findAll()));
    }

    @PostMapping("/checkout")
    public Mono<ResponseEntity<?>> checkout(@RequestBody Map<String,Object> body, Authentication auth) {
        return resolveUserId(auth).flatMap(userId -> {
            if (userId == null) return Mono.just(ResponseEntity.status(401).body(Map.of("error","unauthenticated")));
            Integer itemId = (Integer) body.get("itemId");
            if (itemId == null) return Mono.just(ResponseEntity.badRequest().body(Map.of("error","missing_item")));
            StoreItemEntity item = repo.findById(Long.valueOf(itemId)).orElse(null);
            if (item == null) return Mono.just(ResponseEntity.badRequest().body(Map.of("error","invalid_item")));

            // For demo: assume child_id is same as userId (in product you'd pass childId).
            jdbc.update("insert into purchase_requests (user_id, child_id, item_id, item_name, status, created_at, updated_at) values (?,?,?,?, 'PENDING', now(), now())",
                    userId, userId, item.getId(), item.getName()
            );

            return Mono.just(ResponseEntity.ok(Map.of("status","pending")));
        });
    }
}
