package com.muse.auth.auth.entity;

import com.muse.auth.auth.enums.Role;
import com.muse.auth.auth.enums.AccountStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_users_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_users_email", columnNames = "email")
}, indexes = {
        @Index(name = "idx_users_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String username;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private AccountStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id")
    private Institution institution;

    @Column(nullable = false)
    private boolean emailVerified;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    private Instant lastLoginAt;
    private Instant lastPasswordChangeAt;

    @Column(nullable = false)
    private int failedLoginAttempts;

    private Instant lockedUntil;

    @Column
    private LocalDate dateOfBirth;

    @Column(length = 16)
    private String gender;

    @Column(length = 16)
    private String gradeLevel; // e.g., "10", "12", "Undergrad"

    @Column(length = 150)
    private String bio;

    @Column(length = 200)
    private String website;

    @Column(length = 20)
    private String phoneNumber;

    @Column(length = 255)
    private String avatarUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_guardians", joinColumns = @JoinColumn(name = "child_id"), inverseJoinColumns = @JoinColumn(name = "parent_id"))
    @Builder.Default
    private Set<User> parents = new HashSet<>();

    @ManyToMany(mappedBy = "parents", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<User> children = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private com.muse.auth.auth.enums.VerificationStatus verificationStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private com.muse.auth.auth.enums.SubscriptionPlan subscriptionPlan;

    @Column(nullable = false)
    private boolean isStudentVerified;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private com.muse.auth.auth.enums.AuthProvider provider;

    @Column(length = 255)
    private String providerId;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = AccountStatus.ACTIVE;
        }
        if (this.role == null) {
            this.role = Role.STUDENT; // Default to STUDENT for testing
        }
        if (!this.emailVerified) {
            this.emailVerified = false;
        }
        if (this.verificationStatus == null) {
            this.verificationStatus = com.muse.auth.auth.enums.VerificationStatus.NONE;
        }
        if (this.subscriptionPlan == null) {
            this.subscriptionPlan = com.muse.auth.auth.enums.SubscriptionPlan.PREMIUM; // Default to PREMIUM for testing
        }
        this.isStudentVerified = true; // Default to VERIFIED for testing
        if (this.provider == null) {
            this.provider = com.muse.auth.auth.enums.AuthProvider.LOCAL;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
