package com.muse.journal.repository;

import com.muse.journal.entity.Template;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateRepository extends JpaRepository<Template, Long> {
    List<Template> findByOwnerUsernameOrderByCreatedAtDesc(String ownerUsername);
}
