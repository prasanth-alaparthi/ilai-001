package com.muse.notes.controller;

import com.muse.notes.entity.Attachment;
import com.muse.notes.repository.AttachmentRepository;
import com.muse.notes.service.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes/attachments")
public class AttachmentController extends BaseController {

    private final StorageService storageService;
    private final AttachmentRepository attachmentRepository;

    public AttachmentController(StorageService storageService, AttachmentRepository attachmentRepository) {
        this.storageService = storageService;
        this.attachmentRepository = attachmentRepository;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String storageFilename = storageService.store(file);

        Attachment attachment = Attachment.builder()
                .ownerUsername(username)
                .originalFilename(file.getOriginalFilename())
                .storageFilename(storageFilename)
                .contentType(file.getContentType())
                .size(file.getSize())
                .build();

        attachmentRepository.save(attachment);

        return ResponseEntity.ok(Map.of("id", attachment.getId(), "filename", attachment.getOriginalFilename()));
    }

    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Resource> serveFile(@PathVariable UUID id, Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) {
            return ResponseEntity.status(401).build();
        }

        return attachmentRepository.findById(id)
                .map(attachment -> {
                    if (!attachment.getOwnerUsername().equals(username)) {
                        return ResponseEntity.status(403).<Resource>build();
                    }
                    Resource file = storageService.loadAsResource(attachment.getStorageFilename());
                    return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + attachment.getOriginalFilename() + "\"").body(file);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
