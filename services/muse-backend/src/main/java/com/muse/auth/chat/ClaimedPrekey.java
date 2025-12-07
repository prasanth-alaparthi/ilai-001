package com.muse.auth.chat;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "claimed_prekeys")
public class ClaimedPrekey {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long targetUserId;
    private String targetDeviceId;
    private Long keyId;
    @Lob 
    @Column(columnDefinition = "TEXT")
    private String publicKey;
    private Long claimedByUserId;
    private Instant claimedAt;
    private boolean consumed;
    private Instant consumedAt;
    private boolean reclaimed;
    private Instant reclaimedAt;
    // getters/setters
}