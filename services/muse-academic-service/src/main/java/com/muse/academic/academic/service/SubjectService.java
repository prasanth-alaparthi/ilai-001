package com.muse.academic.academic.service;

import com.muse.academic.academic.entity.Subject;
import com.muse.academic.academic.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SubjectService {
    private final SubjectRepository subjectRepository;

    public List<Subject> getSubjectsByInstitution(Long institutionId) {
        return subjectRepository.findByInstitutionId(institutionId);
    }

    public Subject createSubject(Subject subject) {
        return subjectRepository.save(subject);
    }

    public Subject updateSubject(Long id, Subject updatedSubject) {
        return subjectRepository.findById(id)
                .map(subject -> {
                    subject.setName(updatedSubject.getName());
                    subject.setCode(updatedSubject.getCode());
                    subject.setDescription(updatedSubject.getDescription());
                    subject.setDepartment(updatedSubject.getDepartment());
                    subject.setCredits(updatedSubject.getCredits());
                    subject.setFacultyName(updatedSubject.getFacultyName());
                    return subjectRepository.save(subject);
                })
                .orElseThrow(() -> new RuntimeException("Subject not found"));
    }

    public void deleteSubject(Long id) {
        subjectRepository.deleteById(id);
    }
}
