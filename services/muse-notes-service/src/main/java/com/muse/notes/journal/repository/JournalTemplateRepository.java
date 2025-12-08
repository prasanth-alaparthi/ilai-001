package com.muse.notes.journal.repository;

import com.muse.notes.journal.entity.Template;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JournalTemplateRepository extends JpaRepository<Template, Long> {
    List<Template> findByOwnerUsernameOrderByCreatedAtDesc(String ownerUsername);
}
