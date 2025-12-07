// File: auth-service/src/main/java/com/muse/auth/profile/dto/ProfileDto.java
package com.muse.auth.profile;

import lombok.Data;

@Data
public class ProfileDto {
    private Long userId;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String location;
    private String website;
    private String interests;
    private String privacyProfile;
}