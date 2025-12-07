package com.muse.auth.chat;

import java.util.List;
import lombok.Data;

@Data
public class RegisterKeysRequest {
    private String deviceId;
    private String deviceName;
    private String identityKey;
    private String signedPrekey;
    private String signedPrekeySignature;
    private List<PrekeyDto> prekeys;
    @Data public static class PrekeyDto { public Long keyId; public String publicKey; }
}