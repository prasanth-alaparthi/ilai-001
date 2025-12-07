package com.muse.parental.client.dto;

import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String role;
    private String status;
    private Long universityId;
    private boolean emailVerified;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;
    private LocalDate dateOfBirth;
}
