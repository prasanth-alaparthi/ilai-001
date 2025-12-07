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

    public List<Notebook> listNotebooks(String username) {
        return repo.findByOwnerUsernameOrderByOrderIndexAsc(username);
    }

    public Notebook createNotebook(String username, String title, String color) {
        Instant now = Instant.now();
        int nextOrderIndex = repo.findMaxOrderIndexByOwnerUsername(username) + 1;

        Notebook nb = new Notebook();
        nb.setOwnerUsername(username);
        nb.setTitle((title == null || title.isBlank()) ? "Untitled" : title);
        nb.setColor(color);
        nb.setCreatedAt(now);
        nb.setUpdatedAt(now);
        nb.setOrderIndex(nextOrderIndex);
        return repo.save(nb);
    }

    public Optional<Notebook> updateNotebook(Long id, String username, String title, String color) {
        return repo.findByIdAndOwnerUsername(id, username).map(nb -> {
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

    public boolean deleteNotebook(Long id, String username) {
        return repo.findByIdAndOwnerUsername(id, username).map(nb -> {
            repo.delete(nb);
            return true;
        }).orElse(false);
    }

    @Transactional
    public void updateOrder(List<Long> notebookIds, String username) {
        List<Notebook> notebooks = repo.findAllById(notebookIds);
        Map<Long, Notebook> notebookMap = notebooks.stream()
                .collect(Collectors.toMap(Notebook::getId, Function.identity()));

        for (int i = 0; i < notebookIds.size(); i++) {
            Long id = notebookIds.get(i);
            Notebook notebook = notebookMap.get(id);
            if (notebook != null && notebook.getOwnerUsername().equals(username)) {
                notebook.setOrderIndex(i);
            } else {
                // Handle error: either notebook not found or user is not the owner
                // For simplicity, we'll just ignore it in this case.
                // In a real app, you might throw an exception.
            }
        }
        repo.saveAll(notebooks);
    }
}
