package com.muse.labs.service;

import com.muse.labs.entity.*;
import com.muse.labs.repository.LabRepository;
import com.muse.labs.repository.UserLabProgressRepository;
import jakarta.persistence.EntityNotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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
        // Assuming subject matches the string field, or we can filter by Category if
        // needed
        // For now, let's filter by Category if the input matches an enum, otherwise
        // return all or empty
        try {
            LabCategory category = LabCategory.valueOf(subject.toUpperCase());
            return labRepository.findByCategory(category);
        } catch (IllegalArgumentException e) {
            // If not a category, maybe it's a specific subject string?
            // For simplicity, we'll just return all for now or implement a custom query
            // later
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
            // Keep the highest score if retaken? Or just update. Let's update.
            progress.setQuizScore(quizScore);
        }

        return progressRepository.save(progress);
    }

    public List<UserLabProgress> getUserProgress(String userId) {
        return progressRepository.findByUserId(userId);
    }
}
