package com.muse.auth.client.dto;

import lombok.Data;

@Data
public class MeResponse {
    private Long id;
    private String username;
    private String email;
    private String role; // Role as String
    private String status; // AccountStatus as String
    private Long universityId;
}
