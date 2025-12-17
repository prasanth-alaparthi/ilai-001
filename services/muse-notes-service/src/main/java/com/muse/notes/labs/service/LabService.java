package com.muse.notes.labs.service;

import com.muse.notes.labs.entity.*;
import com.muse.notes.labs.repository.LabRepository;
import com.muse.notes.labs.repository.UserLabProgressRepository;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LabService {

    private final LabRepository labRepository;
    private final UserLabProgressRepository progressRepository;

    public LabService(LabRepository labRepository, UserLabProgressRepository progressRepository) {
        this.labRepository = labRepository;
        this.progressRepository = progressRepository;
    }

    public List<Lab> getAllLabs() {
        return labRepository.findAll();
    }

    public List<Lab> getLabsBySubject(String subject) {
        try {
            LabCategory category = LabCategory.valueOf(subject.toUpperCase());
            return labRepository.findByCategory(category);
        } catch (IllegalArgumentException e) {
            return labRepository.findAll();
        }
    }

    public Lab getLabById(Long id) {
        return labRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Lab not found with id: " + id));
    }

    @Transactional
    public Lab createLab(Lab lab) {
        if (lab.getQuiz() != null) {
            lab.getQuiz().setLab(lab);
            if (lab.getQuiz().getQuestions() != null) {
                lab.getQuiz().getQuestions().forEach(q -> q.setQuiz(lab.getQuiz()));
            }
        }
        return labRepository.save(lab);
    }

    @Transactional
    public UserLabProgress completeLab(Long labId, String userId, Integer quizScore) {
        Lab lab = getLabById(labId);

        UserLabProgress progress = progressRepository.findByUserIdAndLabId(userId, labId)
                .orElseGet(() -> {
                    UserLabProgress p = new UserLabProgress();
                    p.setUserId(userId);
                    p.setLab(lab);
                    return p;
                });

        progress.setCompleted(true);
        if (quizScore != null) {
            progress.setQuizScore(quizScore);
        }

        return progressRepository.save(progress);
    }

    public List<UserLabProgress> getUserProgress(String userId) {
        return progressRepository.findByUserId(userId);
    }
}
