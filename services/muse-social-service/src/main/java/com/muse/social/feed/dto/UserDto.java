package com.muse.social.feed.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String avatarUrl;
    // Add other fields if needed
}
