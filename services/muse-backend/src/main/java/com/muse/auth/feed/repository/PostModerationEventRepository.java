package com.muse.auth.feed.repository;

import com.muse.auth.feed.entity.PostModerationEvent; // Corrected import
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostModerationEventRepository extends JpaRepository<PostModerationEvent, Long> {
    // save(...) is available, add query methods later as needed
}
