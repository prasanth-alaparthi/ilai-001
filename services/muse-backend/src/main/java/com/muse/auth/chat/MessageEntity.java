package com.muse.auth.chat;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "messages")
public class MessageEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long conversationId;
    private Long senderUserId;
    private String senderDeviceId;

    @Lob
    @Column(columnDefinition = "BYTEA")
    private byte[] ciphertext;

    private String ciphertextVersion;

    @Column(columnDefinition="jsonb")
    private String metadata;

    private Instant createdAt = Instant.now();

    @Column(columnDefinition="jsonb")
    private String deliveredTo;

    @Column(columnDefinition="jsonb")
    private String readBy;

    // getters/setters
    // ...
}