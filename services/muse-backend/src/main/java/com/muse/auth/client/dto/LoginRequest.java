package com.muse.auth.client.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
    private String identifier; // Can be username or email
}
