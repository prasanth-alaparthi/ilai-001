package com.muse.auth.chat;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "devices", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id","device_id"}))
public class Device {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable=false)
    private Long userId;

    @Column(name="device_id", nullable=false)
    private String deviceId;

    @Column(name="device_name")
    private String deviceName;

    @Lob
    @Column(name="identity_key", columnDefinition="text")
    private String identityKey;

    @Lob @Column(name="signed_prekey", columnDefinition="text")
    private String signedPrekey;

    @Lob @Column(name="signed_prekey_signature", columnDefinition="text")
    private String signedPrekeySignature;

    @Lob @Column(name="prekeys", columnDefinition="jsonb")
    private String prekeys;

    @Column(name="last_seen")
    private Instant lastSeen;

    @Column(name="created_at")
    private Instant createdAt = Instant.now();

    // getters/setters
    // ...
}