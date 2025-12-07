package com.muse.auth.auth.dto;

import com.muse.auth.auth.enums.AccountStatus;
import com.muse.auth.auth.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class MeResponse {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private AccountStatus status;
    private Long institutionId;
    private String institutionName;
    private com.muse.auth.auth.enums.VerificationStatus verificationStatus;
    private String gradeLevel;
    private String subscriptionPlan;
    private boolean isStudentVerified;
}
