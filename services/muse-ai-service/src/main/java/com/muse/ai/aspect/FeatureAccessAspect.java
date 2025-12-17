package com.muse.ai.aspect;

import com.muse.ai.annotation.RequiresFeature;
import com.muse.ai.exception.FeatureNotAvailableException;
import com.muse.ai.service.FeatureAccessService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Aspect that intercepts methods annotated with @RequiresFeature
 * and checks if the current user has access to the required feature.
 */
@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class FeatureAccessAspect {

    private final FeatureAccessService featureAccessService;

    @Around("@annotation(requiresFeature)")
    public Object checkFeatureAccess(ProceedingJoinPoint joinPoint, RequiresFeature requiresFeature) throws Throwable {
        String feature = requiresFeature.value();

        // Get current user ID from security context
        Long userId = getCurrentUserId();

        if (userId == null) {
            log.warn("No authenticated user found for feature check: {}", feature);
            throw new FeatureNotAvailableException(feature, "Authentication required");
        }

        // Check feature access
        if (!featureAccessService.canAccess(userId, feature)) {
            String requiredTier = featureAccessService.getRequiredTier(feature);
            String message = requiresFeature.message().isEmpty()
                    ? "This feature requires " + requiredTier + " subscription"
                    : requiresFeature.message();

            log.info("Feature access denied for user {} on feature {}", userId, feature);
            throw new FeatureNotAvailableException(feature, message, requiredTier);
        }

        log.debug("Feature access granted for user {} on feature {}", userId, feature);
        return joinPoint.proceed();
    }

    private Long getCurrentUserId() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof Jwt jwt) {
                return Long.parseLong(jwt.getSubject());
            }
        } catch (Exception e) {
            log.warn("Failed to get current user ID: {}", e.getMessage());
        }
        return null;
    }
}
