package com.muse.academic.classroom.controller;

import com.muse.academic.classroom.entity.Classroom;
import com.muse.academic.classroom.entity.OnlineClass;
import com.muse.academic.classroom.entity.ClassStatus;
import com.muse.academic.classroom.repository.ClassroomRepository;
import com.muse.academic.classroom.repository.OnlineClassRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/classrooms")
public class ClassroomController {

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private OnlineClassRepository onlineClassRepository;

    @GetMapping
    public ResponseEntity<List<Classroom>> getAllClassrooms() {
        return ResponseEntity.ok(classroomRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Classroom> createClassroom(@RequestBody Classroom classroom) {
        return ResponseEntity.ok(classroomRepository.save(classroom));
    }

    @GetMapping("/{id}/online-classes")
    public ResponseEntity<List<OnlineClass>> getOnlineClasses(@PathVariable Long id) {
        return ResponseEntity.ok(onlineClassRepository.findByClassroomId(id));
    }

    @PostMapping("/{id}/start-class")
    public ResponseEntity<OnlineClass> startOnlineClass(@PathVariable Long id, @RequestBody OnlineClass request) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        OnlineClass onlineClass = new OnlineClass();
        onlineClass.setClassroom(classroom);
        onlineClass.setTitle(request.getTitle());
        onlineClass.setStatus(ClassStatus.LIVE);
        onlineClass.setStartTime(Instant.now());
        onlineClass.setMeetingLink("https://meet.jit.si/muse-" + UUID.randomUUID().toString()); // Mock link generation

        return ResponseEntity.ok(onlineClassRepository.save(onlineClass));
    }
}
