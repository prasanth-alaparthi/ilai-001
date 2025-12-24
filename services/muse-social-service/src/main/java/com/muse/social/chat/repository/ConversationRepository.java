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

    @Query("SELECT cp.conversation FROM ConversationParticipant cp " +
            "WHERE cp.conversation.type = 'PRIVATE' " +
            "AND cp.userId IN :userIds " +
            "GROUP BY cp.conversation " +
            "HAVING COUNT(cp) = 2")
    List<Conversation> findPrivateConversationByParticipants(@Param("userIds") List<String> userIds);
}
