package com.muse.notes.service;

import com.muse.notes.entity.Section;
import com.muse.notes.repository.NotebookRepository;
import com.muse.notes.repository.SectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class SectionService {

    private final SectionRepository repo;
    private final NotebookRepository notebookRepo;

    public SectionService(SectionRepository repo, NotebookRepository notebookRepo) {
        this.repo = repo;
        this.notebookRepo = notebookRepo;
    }

    public List<Section> listSections(Long notebookId, String username) {
        return repo.findByNotebookIdAndNotebookOwnerUsernameOrderByOrderIndexAsc(notebookId, username);
    }

    public Optional<Section> createSection(Long notebookId, String username, String title) {
        return notebookRepo.findByIdAndOwnerUsername(notebookId, username).map(notebook -> {
            Instant now = Instant.now();
            int nextOrderIndex = repo.findMaxOrderIndexByNotebookId(notebookId) + 1;

            Section section = new Section();
            section.setNotebook(notebook);
            section.setTitle((title == null || title.isBlank()) ? "Untitled" : title);
            section.setCreatedAt(now);
            section.setUpdatedAt(now);
            section.setOrderIndex(nextOrderIndex);
            return repo.save(section);
        });
    }

    @Transactional
    public void updateOrder(List<Long> sectionIds, String username) {
        List<Section> sections = repo.findAllById(sectionIds);
        Map<Long, Section> sectionMap = sections.stream()
                .collect(Collectors.toMap(Section::getId, Function.identity()));

        for (int i = 0; i < sectionIds.size(); i++) {
            Long id = sectionIds.get(i);
            Section section = sectionMap.get(id);
            if (section != null && section.getNotebook().getOwnerUsername().equals(username)) {
                section.setOrderIndex(i);
            }
        }
        repo.saveAll(sections);
    }
}
