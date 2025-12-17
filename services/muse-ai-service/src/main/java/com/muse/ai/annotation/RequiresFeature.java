package com.muse.ai.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark API endpoints that require specific feature access.
 * 
 * Usage:
 * @RequiresFeature("flashcards")
 * @PostMapping("/api/ai/flashcards/generate")
 * public ResponseEntity<?> generateFlashcards() { ... }
 * 
 * This will check if the user has access to the "flashcards" feature
 * based on their subscription tier before allowing the request.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresFeature {

    /**
     * The feature code required to access this endpoint.
     * Examples: "flashcards", "mindmap", "classroom", "quantum_lab"
     */
    String value();

    /**
     * Optional message to show when access is denied.
     */
    String message() default "";
}
