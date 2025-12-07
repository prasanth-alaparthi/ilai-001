package com.muse.auth.auth.service;

import com.muse.auth.auth.dto.CreateInstitutionRequest;
import com.muse.auth.auth.dto.InstitutionDto;
import com.muse.auth.auth.entity.Institution;
import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.repository.InstitutionRepository;
import com.muse.auth.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Transactional
    public InstitutionDto createInstitution(CreateInstitutionRequest request) {
        Institution institution = Institution.builder()
                .name(request.getName())
                .type(request.getType())
                .address(request.getAddress())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .isVerified(true) // Auto-verify for now
                .build();

        institution = institutionRepository.save(institution);
        return mapToDto(institution);
    }

    public List<InstitutionDto> getAllInstitutions() {
        return institutionRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void addUserToInstitution(Long userId, Long institutionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Institution not found"));

        user.setInstitution(institution);
        userRepository.save(user);
    }

    @Transactional
    public String bulkRegisterUsers(Long institutionId, org.springframework.web.multipart.MultipartFile file) {
        Institution institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new RuntimeException("Institution not found"));

        try (java.io.Reader reader = new java.io.InputStreamReader(file.getInputStream());
                com.opencsv.CSVReader csvReader = new com.opencsv.CSVReader(reader)) {

            List<String[]> records = csvReader.readAll();
            int createdCount = 0;
            int skippedCount = 0;

            // Expect header: email, username, role (optional)
            boolean isHeader = true;
            for (String[] record : records) {
                if (isHeader) {
                    isHeader = false;
                    continue; // Skip header
                }

                if (record.length < 2)
                    continue;

                String email = record[0].trim();
                String username = record[1].trim();
                String roleStr = record.length > 2 ? record[2].trim() : "STUDENT";

                if (userRepository.existsByEmail(email)) {
                    skippedCount++;
                    continue;
                }

                User user = User.builder()
                        .email(email)
                        .username(username)
                        .passwordHash(passwordEncoder.encode("Welcome123!")) // Default password
                        .role(com.muse.auth.auth.enums.Role.valueOf(roleStr.toUpperCase()))
                        .institution(institution)
                        .status(com.muse.auth.auth.enums.AccountStatus.ACTIVE)
                        .emailVerified(true) // Auto-verify for bulk upload
                        .isStudentVerified(true)
                        .build();

                userRepository.save(user);
                createdCount++;
            }

            return "Bulk upload completed. Created: " + createdCount + ", Skipped: " + skippedCount;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }
    }

    private InstitutionDto mapToDto(Institution institution) {
        InstitutionDto dto = new InstitutionDto();
        dto.setId(institution.getId());
        dto.setName(institution.getName());
        dto.setType(institution.getType());
        dto.setAddress(institution.getAddress());
        return dto;
    }
}
