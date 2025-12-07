package com.muse.classroom.controller;

import com.muse.classroom.entity.GroupMessage;
import com.muse.classroom.repository.GroupMessageRepository;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final GroupMessageRepository messageRepository;

    public ChatController(GroupMessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @MessageMapping("/club/{clubId}/sendMessage")
    @SendTo("/topic/club/{clubId}")
    public GroupMessage sendMessage(@DestinationVariable Long clubId, GroupMessage message) {
        message.setClubId(clubId);
        return messageRepository.save(message);
    }

    // Video Signaling (Simple Echo for now)
    @MessageMapping("/club/{clubId}/signal")
    @SendTo("/topic/club/{clubId}/signal")
    public Object signal(@DestinationVariable Long clubId, Object signalData) {
        return signalData;
    }
}
