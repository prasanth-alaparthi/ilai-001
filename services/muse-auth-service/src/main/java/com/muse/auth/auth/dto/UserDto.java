package com.muse.auth.auth.dto;

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
    private Long institutionId;
    private String institutionName;
    private boolean emailVerified;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;
    private LocalDate dateOfBirth;
    private String gradeLevel;
    private String bio;
    private String website;
    private String phoneNumber;
    private String avatarUrl;
    private String gender;
}
