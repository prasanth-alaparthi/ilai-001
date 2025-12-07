package com.muse.auth.auth.dto;

import com.muse.auth.auth.enums.Role;
import lombok.Data;

// Removed unused fields to match frontend payload more closely
@Data
public class RegistrationRequest {

    private String username;
    private String email;
    private String password;
    private Role role;
    // private String firstName; // Not sent by frontend
    // private String lastName; // Not sent by frontend
    private java.time.LocalDate dateOfBirth;
    private String gender;
    // private String guardianEmail; // Not sent by frontend
    private String institutionId; // Sent only for TEACHER
    private String adminKey; // Required for ADMIN registration
    private String institutionCode; // Optional for TEACHER verification

}
