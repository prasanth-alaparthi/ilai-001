package com.muse.notes.controller;

import com.muse.notes.entity.Template;
import com.muse.notes.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notes/templates")
@RequiredArgsConstructor
public class TemplateController extends BaseController {

    private final TemplateService templateService;

    @GetMapping
    public ResponseEntity<List<Template>> getAllTemplates(Authentication auth) {
        Long userId = currentUserId(auth);
        return ResponseEntity.ok(templateService.getAllTemplates(userId));
    }
}
