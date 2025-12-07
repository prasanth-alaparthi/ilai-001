// File: auth-service/src/main/java/com/muse/auth/profile/UserStats.java
package com.muse.auth.profile;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStats {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "followers_count")
    private Long followersCount;

    @Column(name = "following_count")
    private Long followingCount;

    @Column(name = "posts_count")
    private Long postsCount;

    @Column(name = "library_count")
    private Long libraryCount;
}