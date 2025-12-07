package com.muse.auth.chat;

import com.muse.auth.chat.MessageEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {
    List<MessageEntity> findByConversationIdOrderByCreatedAtDesc(Long conversationId);
    long countBySenderUserIdOrConversationId(Long senderUserId, Long conversationId);
    long countBySenderUserId(Long senderUserId);
}
