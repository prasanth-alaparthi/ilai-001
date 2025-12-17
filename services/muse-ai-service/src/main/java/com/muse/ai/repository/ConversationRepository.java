package com.muse.ai.repository;

import com.muse.ai.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(Long userId);

    List<Conversation> findByUserIdAndContextTypeOrderByUpdatedAtDesc(Long userId, String contextType);
}
