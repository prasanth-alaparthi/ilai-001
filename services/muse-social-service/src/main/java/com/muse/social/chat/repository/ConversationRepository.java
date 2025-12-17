package com.muse.social.chat.repository;

import com.muse.social.chat.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c JOIN ConversationParticipant cp ON c.id = cp.conversation.id WHERE cp.userId = :userId")
    List<Conversation> findByUserId(@Param("userId") String userId);

    List<Conversation> findByContextTypeAndContextId(Conversation.ContextType contextType, String contextId);
}
