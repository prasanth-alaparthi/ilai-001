package com.muse.auth.chat;

import java.util.Map;
import lombok.Data;

@Data
public class SendMessageRequest {
    private Long conversationId;
    private String senderDeviceId;
    private String ciphertext;
    private String ciphertextVersion;
    private Map<String,Object> metadata;
}