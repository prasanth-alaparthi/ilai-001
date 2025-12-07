package com.muse.auth.client.dto;

import lombok.Data;

@Data
public class LoginResponse {
    private String accessToken;
    // Potentially other fields like refreshToken, user details if needed by the client
}
