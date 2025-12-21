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

    // List all sections (flat, for backwards compatibility)
    public List<Section> listSections(Long notebookId, Long userId) {
        return repo.findByNotebookIdAndNotebookUserIdOrderByOrderIndexAsc(notebookId, userId);
    }

    // List only root sections (parent = null)
    public List<Section> listRootSections(Long notebookId, Long userId) {
        return repo.findRootSectionsByNotebookIdAndUserId(notebookId, userId);
    }

    // Get children of a section
    public List<Section> getChildren(Long parentId) {
        return repo.findByParentId(parentId);
    }

    // Create a root section
    public Optional<Section> createSection(Long notebookId, Long userId, String title) {
        return notebookRepo.findByIdAndUserId(notebookId, userId).map(notebook -> {
            Instant now = Instant.now();
            int nextOrderIndex = repo.findMaxOrderIndexByNotebookId(notebookId) + 1;

            Section section = new Section();
            section.setNotebook(notebook);
            section.setTitle((title == null || title.isBlank()) ? "Untitled" : title);
            section.setCreatedAt(now);
            section.setUpdatedAt(now);
            section.setOrderIndex(nextOrderIndex);
            section.setParent(null); // Root section
            return repo.save(section);
        });
    }

    // Create a sub-section (nested under a parent)
    public Optional<Section> createSubSection(Long parentId, Long userId, String title) {
        return repo.findByIdAndNotebookUserId(parentId, userId).map(parent -> {
            Instant now = Instant.now();
            int nextOrderIndex = repo.findMaxOrderIndexByParentId(parentId) + 1;

            Section section = new Section();
            section.setNotebook(parent.getNotebook()); // Same notebook as parent
            section.setTitle((title == null || title.isBlank()) ? "Untitled" : title);
            section.setCreatedAt(now);
            section.setUpdatedAt(now);
            section.setOrderIndex(nextOrderIndex);
            section.setParent(parent); // Nested under parent
            return repo.save(section);
        });
    }

    // Move a section to a new parent (or to root if parentId is null)
    public Optional<Section> moveSection(Long sectionId, Long newParentId, Long userId) {
        return repo.findByIdAndNotebookUserId(sectionId, userId).map(section -> {
            if (newParentId == null) {
                // Move to root
                section.setParent(null);
                section.setOrderIndex(repo.findMaxOrderIndexByNotebookId(section.getNotebook().getId()) + 1);
            } else {
                // Move under new parent
                return repo.findByIdAndNotebookUserId(newParentId, userId).map(newParent -> {
                    // Prevent circular reference
                    if (isDescendantOf(newParent, section)) {
                        throw new IllegalArgumentException("Cannot move a section into its own descendant");
                    }
                    section.setParent(newParent);
                    section.setOrderIndex(repo.findMaxOrderIndexByParentId(newParentId) + 1);
                    return repo.save(section);
                }).orElse(section);
            }
            return repo.save(section);
        });
    }

    // Check if potentialDescendant is a descendant of potentialAncestor
    private boolean isDescendantOf(Section potentialDescendant, Section potentialAncestor) {
        Section current = potentialDescendant;
        while (current != null) {
            if (current.getId().equals(potentialAncestor.getId())) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }

    @Transactional
    public void updateOrder(List<Long> sectionIds, Long userId) {
        List<Section> sections = repo.findAllById(sectionIds);
        Map<Long, Section> sectionMap = sections.stream()
                .collect(Collectors.toMap(Section::getId, Function.identity()));

        for (int i = 0; i < sectionIds.size(); i++) {
            Long id = sectionIds.get(i);
            Section section = sectionMap.get(id);
            if (section != null && section.getNotebook().getUserId().equals(userId)) {
                section.setOrderIndex(i);
            }
        }
        repo.saveAll(sections);
    }

    // Delete a section and all its children
    public boolean deleteSection(Long sectionId, Long userId) {
        return repo.findByIdAndNotebookUserId(sectionId, userId).map(section -> {
            repo.delete(section); // Cascade will delete children
            return true;
        }).orElse(false);
    }

    /**
     * Find a section by name within a notebook, or create it if it doesn't exist.
     * Used by Lab Persistent Save for auto-pathing.
     */
    public Section findOrCreateByName(Long notebookId, Long userId, String username, String title) {
        return repo.findByNotebookIdAndTitle(notebookId, title)
                .orElseGet(() -> createSection(notebookId, userId, title).orElse(null));
    }
}
