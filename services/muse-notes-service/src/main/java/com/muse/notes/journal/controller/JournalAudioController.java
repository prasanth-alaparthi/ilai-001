package com.muse.notes.journal.controller;

import com.muse.notes.journal.entity.JournalAudio;
import com.muse.notes.journal.repository.JournalAudioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/journals")
public class JournalAudioController {

    private final JournalAudioRepository repo;

    // where to store audio files
    private final String uploadDir;
    private final String publicBase; // base URL to serve uploaded files, e.g. https://example.com/uploads/audio

    public JournalAudioController(JournalAudioRepository repo,
            @Value("${journal.audio.upload-dir:/tmp/journal-audio}") String uploadDir,
            @Value("${journal.audio.public-base:/uploads/audio}") String publicBase) {
        this.repo = repo;
        this.uploadDir = uploadDir;
        this.publicBase = publicBase;
        File d = new File(uploadDir);
        if (!d.exists())
            d.mkdirs();
    }

    @PostMapping(path = "/{id}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAudio(@PathVariable Long id, @RequestPart("file") MultipartFile file)
            throws IOException {
        if (file == null || file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "file required"));
        String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String fname = "audio-" + id + "-" + UUID.randomUUID().toString().substring(0, 8)
                + (ext != null ? ("." + ext) : ".webm");
        File dest = new File(uploadDir, fname);
        file.transferTo(dest);
        // Build public URL (you must configure static resource handler to serve
        // uploadDir mapped to publicBase)
        String audioUrl = publicBase.replaceAll("/$", "") + "/" + fname;
        JournalAudio ja = new JournalAudio();
        ja.setJournalId(id);
        ja.setAudioUrl(audioUrl);
        ja.setCreatedAt(Instant.now());
        repo.save(ja);
        return ResponseEntity.ok(Map.of("id", ja.getId(), "audioUrl", audioUrl));
    }

    @GetMapping("/{id}/audio/meta")
    public ResponseEntity<?> audioMeta(@PathVariable Long id) {
        Optional<JournalAudio> opt = repo.findFirstByJournalIdOrderByCreatedAtDesc(id);
        if (opt.isEmpty())
            return ResponseEntity.notFound().build();
        JournalAudio ja = opt.get();
        return ResponseEntity
                .ok(Map.of("id", ja.getId(), "audioUrl", ja.getAudioUrl(), "createdAt", ja.getCreatedAt()));
    }
}
