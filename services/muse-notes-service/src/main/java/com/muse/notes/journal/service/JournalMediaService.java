package com.muse.notes.journal.service;

// import com.muse.auth.ai.service.OpenAIIntegrationService; // Removed dependency
import com.muse.notes.journal.entity.JournalAudio;
import com.muse.notes.journal.repository.JournalAudioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.time.Instant;

@Service
public class JournalMediaService {
    private final Logger log = LoggerFactory.getLogger(JournalMediaService.class);
    private final JournalAudioRepository audioRepo;
    // private final OpenAIIntegrationService openAI; // Removed dependency
    private final Path storageDir;

    public JournalMediaService(JournalAudioRepository audioRepo) {
        this.audioRepo = audioRepo;
        // this.openAI = openAI;
        this.storageDir = Paths.get(System.getProperty("java.io.tmpdir"), "muse_journal_audio");
        try {
            Files.createDirectories(storageDir);
        } catch (Exception e) {
            log.warn("cannot create audio dir", e);
        }
    }

    public JournalAudio saveAudioFile(Long journalId, String username, MultipartFile file) throws Exception {
        String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path dest = storageDir.resolve(filename);
        file.transferTo(dest.toFile());
        JournalAudio ja = new JournalAudio();
        ja.setJournalId(journalId);
        ja.setUsername(username);
        ja.setFilename(filename);
        ja.setFilepath(dest.toString());
        ja.setDurationSeconds(null);
        ja.setCreatedAt(Instant.now());
        audioRepo.save(ja);

        /*
         * try {
         * if (openAI != null && openAI.enabled()) {
         * String text = openAI.transcribeAudio(dest.toFile());
         * ja.setTranscription(text);
         * audioRepo.save(ja);
         * }
         * } catch (Exception e) {
         * log.warn("transcription failed", e);
         * }
         */
        return ja;
    }
}
