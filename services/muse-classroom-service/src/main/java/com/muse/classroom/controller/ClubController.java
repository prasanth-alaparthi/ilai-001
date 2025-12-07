package com.muse.classroom.controller;

import com.muse.classroom.entity.Club;
import com.muse.classroom.entity.GroupMessage;
import com.muse.classroom.repository.ClubRepository;
import com.muse.classroom.repository.GroupMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {

    @Autowired
    private ClubRepository clubRepository;

    @Autowired
    private GroupMessageRepository messageRepository;

    @GetMapping
    public ResponseEntity<List<Club>> getAllClubs() {
        return ResponseEntity.ok(clubRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Club> createClub(@RequestBody Club club) {
        return ResponseEntity.ok(clubRepository.save(club));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<GroupMessage>> getClubMessages(@PathVariable Long id) {
        return ResponseEntity.ok(messageRepository.findByClubIdOrderBySentAtAsc(id));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<GroupMessage> postMessage(@PathVariable Long id, @RequestBody GroupMessage message) {
        message.setClubId(id);
        return ResponseEntity.ok(messageRepository.save(message));
    }
}
