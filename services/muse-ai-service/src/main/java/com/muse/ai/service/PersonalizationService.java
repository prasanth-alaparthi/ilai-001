package com.muse.ai.service;

import com.muse.ai.entity.UserProfile;
import com.muse.ai.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Personalization Service
 * Tracks user behavior and preferences for adaptive learning.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PersonalizationService {

    private final UserProfileRepository userProfileRepository;

    /**
     * Ensure a user profile exists
     */
    @Transactional
    public UserProfile ensureProfileExists(Long userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserProfile profile = UserProfile.builder()
                            .userId(userId)
                            .topicInterests(new HashMap<>())
                            .skillLevels(new HashMap<>())
                            .moduleUsage(new HashMap<>())
                            .studyPreferences(new HashMap<>())
                            .aiSettings(new HashMap<>())
                            .recentTopics(new String[] {})
                            .build();
                    return userProfileRepository.save(profile);
                });
    }

    /**
     * Get user profile
     */
    public Optional<UserProfile> getProfile(Long userId) {
        return userProfileRepository.findByUserId(userId);
    }

    /**
     * Update topic interests based on user activity
     */
    @Transactional
    public void updateTopicInterests(Long userId, String[] topics) {
        UserProfile profile = ensureProfileExists(userId);
        Map<String, Integer> interests = new HashMap<>(profile.getTopicInterests());

        for (String topic : topics) {
            if (topic != null && !topic.isBlank()) {
                String normalizedTopic = topic.toLowerCase().trim();
                interests.merge(normalizedTopic, 1, Integer::sum);
            }
        }

        profile.setTopicInterests(interests);

        // Update recent topics (keep last 20)
        List<String> recent = new ArrayList<>();
        if (profile.getRecentTopics() != null) {
            recent.addAll(Arrays.asList(profile.getRecentTopics()));
        }
        recent.addAll(0, Arrays.asList(topics));
        if (recent.size() > 20) {
            recent = recent.subList(0, 20);
        }
        profile.setRecentTopics(recent.toArray(new String[0]));

        userProfileRepository.save(profile);
        log.debug("Updated topic interests for user {}: {}", userId, topics);
    }

    /**
     * Update skill level for a subject
     */
    @Transactional
    public void updateSkillLevel(Long userId, String subject, double score) {
        UserProfile profile = ensureProfileExists(userId);
        Map<String, Double> skills = new HashMap<>(profile.getSkillLevels());

        // Running average
        double currentLevel = skills.getOrDefault(subject.toLowerCase(), 0.5);
        double newLevel = (currentLevel * 0.7) + (score * 0.3); // Weighted average
        skills.put(subject.toLowerCase(), Math.min(1.0, Math.max(0.0, newLevel)));

        profile.setSkillLevels(skills);
        userProfileRepository.save(profile);
        log.debug("Updated skill level for user {} in {}: {}", userId, subject, newLevel);
    }

    /**
     * Increment module usage count
     */
    @Transactional
    public void incrementModuleUsage(Long userId, String module) {
        UserProfile profile = ensureProfileExists(userId);
        Map<String, Integer> usage = new HashMap<>(profile.getModuleUsage());
        usage.merge(module.toLowerCase(), 1, Integer::sum);
        profile.setModuleUsage(usage);
        userProfileRepository.save(profile);
    }

    /**
     * Update learning style
     */
    @Transactional
    public void updateLearningStyle(Long userId, String style) {
        UserProfile profile = ensureProfileExists(userId);
        profile.setLearningStyle(style);
        userProfileRepository.save(profile);
    }

    /**
     * Update study preferences
     */
    @Transactional
    public void updateStudyPreferences(Long userId, Map<String, Object> preferences) {
        UserProfile profile = ensureProfileExists(userId);
        Map<String, Object> current = new HashMap<>(profile.getStudyPreferences());
        current.putAll(preferences);
        profile.setStudyPreferences(current);
        userProfileRepository.save(profile);
    }

    /**
     * Get personalized recommendations
     */
    public Map<String, Object> getRecommendations(Long userId) {
        Optional<UserProfile> profileOpt = getProfile(userId);

        if (profileOpt.isEmpty()) {
            return Map.of(
                    "topics", List.of(),
                    "difficulty", "medium",
                    "suggestions", List.of("Start by creating your first note!"));
        }

        UserProfile profile = profileOpt.get();

        // Get top interests
        List<String> topTopics = profile.getTopicInterests().entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .map(Map.Entry::getKey)
                .toList();

        // Determine difficulty based on skill levels
        double avgSkill = profile.getSkillLevels().values().stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.5);

        String difficulty = avgSkill < 0.3 ? "easy" : avgSkill < 0.7 ? "medium" : "hard";

        // Generate suggestions
        List<String> suggestions = new ArrayList<>();
        if (profile.getModuleUsage().getOrDefault("notes", 0) < 10) {
            suggestions.add("Try creating more notes to improve retention");
        }
        if (profile.getModuleUsage().getOrDefault("flashcards", 0) < 5) {
            suggestions.add("Use flashcards for spaced repetition learning");
        }
        if (!topTopics.isEmpty()) {
            suggestions.add("Continue exploring: " + String.join(", ", topTopics));
        }

        return Map.of(
                "topics", topTopics,
                "difficulty", difficulty,
                "learningStyle", profile.getLearningStyle() != null ? profile.getLearningStyle() : "visual",
                "suggestions", suggestions,
                "recentTopics",
                profile.getRecentTopics() != null ? Arrays.asList(profile.getRecentTopics()) : List.of(),
                "topTopics", topTopics);
    }

    /**
     * Record a user activity for personalization tracking
     */
    @Transactional
    public void recordActivity(Long userId, Map<String, Object> activity) {
        String type = (String) activity.get("type");
        if (type == null)
            return;

        switch (type) {
            case "note_created", "note_updated" -> {
                String topic = (String) activity.get("topic");
                if (topic != null) {
                    updateTopicInterests(userId, new String[] { topic });
                }
                incrementModuleUsage(userId, "notes");
            }
            case "feed_read" -> {
                String topic = (String) activity.get("topic");
                if (topic != null) {
                    updateTopicInterests(userId, new String[] { topic });
                }
                incrementModuleUsage(userId, "feed");
            }
            case "quiz_completed" -> {
                String topic = (String) activity.get("topic");
                Double score = activity.get("score") instanceof Number n ? n.doubleValue() : 0.5;
                if (topic != null) {
                    updateSkillLevel(userId, topic, score);
                }
                incrementModuleUsage(userId, "quiz");
            }
            case "flashcard_studied" -> {
                incrementModuleUsage(userId, "flashcards");
            }
            case "journal_entry" -> {
                incrementModuleUsage(userId, "journal");
            }
            default -> log.debug("Unknown activity type: {}", type);
        }

        log.debug("Recorded activity for user {}: {}", userId, type);
    }
}
