package com.muse.labs.config;

import com.muse.labs.entity.*;
import com.muse.labs.repository.LabRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

        private final LabRepository labRepository;

        public DataSeeder(LabRepository labRepository) {
                this.labRepository = labRepository;
        }

        @Override
        public void run(String... args) throws Exception {
                if (labRepository.count() > 0) {
                        return;
                }

                // Physics Lab
                // Physics Lab
                Lab physicsLab = new Lab();
                physicsLab.setTitle("Solar System Simulation");
                physicsLab.setDescription("Explore the solar system and understand planetary orbits.");
                physicsLab.setCategory(LabCategory.PHYSICS);
                physicsLab.setSubject("Astronomy");
                physicsLab.setDifficulty("Easy");
                physicsLab.setContent("SolarSystem");
                physicsLab.setImageUrl(
                                "https://images.unsplash.com/photo-1614730341194-75c6074065db?auto=format&fit=crop&w=500&q=60");

                Quiz physicsQuiz = new Quiz();
                physicsQuiz.setTitle("Solar System Quiz");
                physicsQuiz.setLab(physicsLab);

                QuizQuestion q1 = new QuizQuestion();
                q1.setQuestionText("Which planet is closest to the Sun?");
                q1.setOptions(List.of("Venus", "Mercury", "Earth", "Mars"));
                q1.setCorrectAnswer("Mercury");
                q1.setExplanation("Mercury is the closest planet to the Sun.");
                q1.setQuiz(physicsQuiz);

                physicsQuiz.setQuestions(List.of(q1));
                physicsLab.setQuiz(physicsQuiz);

                // Chemistry Lab
                Lab chemLab = new Lab();
                chemLab.setTitle("Acid-Base Titration");
                chemLab.setDescription("Simulate a titration experiment to determine concentration.");
                chemLab.setCategory(LabCategory.CHEMISTRY);
                chemLab.setSubject("Chemistry");
                chemLab.setDifficulty("Medium");
                chemLab.setContent("Titration");
                chemLab.setImageUrl(
                                "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=500&q=60");

                // CS Lab
                Lab csLab = new Lab();
                csLab.setTitle("Intro to Python: Variables");
                csLab.setDescription("Learn how to declare and use variables in Python.");
                csLab.setCategory(LabCategory.CS);
                csLab.setSubject("Python");
                csLab.setDifficulty("Easy");
                csLab.setContent("# Write a python script to print 'Hello World'\nprint('Hello World')");
                csLab.setImageUrl(
                                "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=500&q=60");

                labRepository.saveAll(List.of(physicsLab, chemLab, csLab));
                System.out.println("Labs Seed Data Injected");
        }
}
