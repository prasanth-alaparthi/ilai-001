package com.muse.auth.client.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class RegistrationRequest {
    private String username;
    private String email;
    private String password;
    private String role; // Role as String, will be converted by auth service
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String guardianEmail;
    private String institutionId;
}
