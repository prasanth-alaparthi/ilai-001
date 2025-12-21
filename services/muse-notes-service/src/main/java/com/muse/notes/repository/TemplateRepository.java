package com.muse.notes.repository;

import com.muse.notes.entity.Template;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TemplateRepository extends JpaRepository<Template, Long> {
    java.util.List<Template> findByUserId(Long userId);

    java.util.List<Template> findByUserIdOrUserIdIsNull(Long userId);
}
