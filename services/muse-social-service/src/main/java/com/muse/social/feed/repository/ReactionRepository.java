package com.muse.social.feed.repository;

import com.muse.social.feed.entity.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    List<Reaction> findByTargetIdAndTargetType(Long targetId, String targetType);

    int countByTargetIdAndTargetType(Long targetId, String targetType);

    boolean existsByUserIdAndTargetIdAndTargetType(Long userId, Long targetId, String targetType);
}
