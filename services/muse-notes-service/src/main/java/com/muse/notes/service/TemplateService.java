package com.muse.notes.service;

import com.muse.notes.entity.Template;
import com.muse.notes.repository.TemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class TemplateService {

    private final TemplateRepository templateRepository;

    public List<Template> getAllTemplates(Long userId) {
        if (userId == null) {
            return templateRepository.findAll().stream()
                    .filter(t -> t.getUserId() == null)
                    .toList();
        }
        return templateRepository.findByUserIdOrUserIdIsNull(userId);
    }
}
