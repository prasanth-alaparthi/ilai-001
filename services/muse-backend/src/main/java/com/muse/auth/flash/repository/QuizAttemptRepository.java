package com.muse.auth.flash.repository;

import com.muse.auth.flash.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUsernameOrderByCreatedAtDesc(String username);
}