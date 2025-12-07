package com.muse.auth.auth.controller;

import com.muse.auth.auth.dto.CreateInstitutionRequest;
import com.muse.auth.auth.dto.InstitutionDto;
import com.muse.auth.auth.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InstitutionDto> createInstitution(@RequestBody CreateInstitutionRequest request) {
        return ResponseEntity.ok(institutionService.createInstitution(request));
    }

    @GetMapping
    public ResponseEntity<List<InstitutionDto>> getAllInstitutions() {
        return ResponseEntity.ok(institutionService.getAllInstitutions());
    }

    @PostMapping("/{institutionId}/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> addUserToInstitution(@PathVariable Long institutionId, @PathVariable Long userId) {
        institutionService.addUserToInstitution(userId, institutionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/{institutionId}/bulk-upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('INSTITUTION_ADMIN')")
    public ResponseEntity<String> bulkUploadUsers(
            @PathVariable Long institutionId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok(institutionService.bulkRegisterUsers(institutionId, file));
    }
}
