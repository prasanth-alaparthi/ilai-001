package com.muse.ai.exception;

import lombok.Getter;

/**
 * Exception thrown when a user tries to access a feature
 * they don't have access to based on their subscription tier.
 */
@Getter
public class FeatureNotAvailableException extends RuntimeException {

    private final String feature;
    private final String requiredTier;

    public FeatureNotAvailableException(String feature) {
        super("Feature not available: " + feature);
        this.feature = feature;
        this.requiredTier = "PREMIUM";
    }

    public FeatureNotAvailableException(String feature, String message) {
        super(message);
        this.feature = feature;
        this.requiredTier = "PREMIUM";
    }

    public FeatureNotAvailableException(String feature, String message, String requiredTier) {
        super(message);
        this.feature = feature;
        this.requiredTier = requiredTier;
    }
}
