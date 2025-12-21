package com.muse.notes.service;

import com.muse.notes.entity.Notebook;
import com.muse.notes.repository.NotebookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotebookService {

    private final NotebookRepository repo;

    public NotebookService(NotebookRepository repo) {
        this.repo = repo;
    }

    public List<Notebook> listNotebooks(Long userId) {
        return repo.findByUserIdOrderByOrderIndexAsc(userId);
    }

    public Notebook createNotebook(Long userId, String username, String title, String color) {
        Instant now = Instant.now();
        int nextOrderIndex = repo.findMaxOrderIndexByUserId(userId) + 1;

        Notebook nb = new Notebook();
        nb.setUserId(userId);
        nb.setOwnerUsername(username);
        nb.setTitle((title == null || title.isBlank()) ? "Untitled" : title);
        nb.setColor(color);
        nb.setCreatedAt(now);
        nb.setUpdatedAt(now);
        nb.setOrderIndex(nextOrderIndex);
        return repo.save(nb);
    }

    public Optional<Notebook> updateNotebook(Long id, Long userId, String title, String color) {
        return repo.findByIdAndUserId(id, userId).map(nb -> {
            if (title != null && !title.isBlank()) {
                nb.setTitle(title);
            }
            if (color != null) {
                nb.setColor(color);
            }
            nb.setUpdatedAt(Instant.now());
            return repo.save(nb);
        });
    }

    public boolean deleteNotebook(Long id, Long userId) {
        return repo.findByIdAndUserId(id, userId).map(nb -> {
            repo.delete(nb);
            return true;
        }).orElse(false);
    }

    @Transactional
    public void updateOrder(List<Long> notebookIds, Long userId) {
        List<Notebook> notebooks = repo.findAllById(notebookIds);
        Map<Long, Notebook> notebookMap = notebooks.stream()
                .collect(Collectors.toMap(Notebook::getId, Function.identity()));

        for (int i = 0; i < notebookIds.size(); i++) {
            Long id = notebookIds.get(i);
            Notebook notebook = notebookMap.get(id);
            if (notebook != null && notebook.getUserId().equals(userId)) {
                notebook.setOrderIndex(i);
            }
        }
        repo.saveAll(notebooks);
    }

    /**
     * Find a notebook by name or create it if it doesn't exist.
     * Used by Lab Persistent Save for auto-pathing.
     */
    public Notebook findOrCreateByName(Long userId, String username, String title) {
        return repo.findByUserIdAndTitle(userId, title)
                .orElseGet(() -> createNotebook(userId, username, title, "#6366f1"));
    }
}
