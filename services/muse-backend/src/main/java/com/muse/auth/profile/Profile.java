// File: auth-service/src/main/java/com/muse/auth/profile/Profile.java
package com.muse.auth.profile;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "display_name")
    private String displayName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_url")
    private String avatarUrl;

    private String location;
    private String website;

    @Column(columnDefinition = "jsonb")
    private String interests;

    @Column(name = "privacy_profile")
    private String privacyProfile; // PUBLIC / PRIVATE

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;
}