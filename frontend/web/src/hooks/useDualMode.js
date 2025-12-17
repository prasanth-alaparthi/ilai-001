import { useState, useCallback, useEffect } from 'react';

// Safe import with fallback
let useBilling;
try {
    useBilling = require('../state/BillingContext').useBilling;
} catch (e) {
    useBilling = () => ({
        subscription: null,
        credits: null,
        isUnlimited: false,
        balance: 0,
        loading: false
    });
}

/**
 * Hook for dual-mode AI functionality
 * Automatically switches between Free and AI mode based on subscription
 */
export const useDualMode = () => {
    // Safe context access with fallbacks
    let billingContext = { subscription: null, isUnlimited: false, balance: 0 };
    try {
        billingContext = useBilling();
    } catch (e) {
        // BillingProvider not available, use defaults
    }

    const { subscription, isUnlimited, balance } = billingContext;
    const credits = balance || 0;

    const [isAIMode, setIsAIMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check if user CAN use AI
    const canUseAI = isUnlimited || credits > 0;

    // Auto-set mode based on subscription
    useEffect(() => {
        const isPaidUser = subscription?.plan && subscription.plan !== 'FREE';
        setIsAIMode(canUseAI && isPaidUser);
    }, [subscription, canUseAI]);

    /**
     * Execute an action with automatic mode selection
     * @param freeAction - Action to run in free mode
     * @param aiAction - Action to run in AI mode
     * @returns Result of the executed action
     */
    const executeWithMode = useCallback(async (freeAction, aiAction) => {
        setIsLoading(true);
        try {
            if (isAIMode && canUseAI) {
                return await aiAction();
            }
            return await freeAction();
        } finally {
            setIsLoading(false);
        }
    }, [isAIMode, canUseAI]);

    /**
     * Toggle between free and AI mode
     */
    const toggleMode = useCallback(() => {
        if (!isAIMode && !canUseAI) {
            // Can't switch to AI mode without credits
            return false;
        }
        setIsAIMode(prev => !prev);
        return true;
    }, [isAIMode, canUseAI]);

    /**
     * Force AI mode (with credit check)
     */
    const forceAIMode = useCallback(() => {
        if (canUseAI) {
            setIsAIMode(true);
            return true;
        }
        return false;
    }, [canUseAI]);

    return {
        isAIMode,
        setIsAIMode,
        canUseAI,
        isLoading,
        executeWithMode,
        toggleMode,
        forceAIMode,
        modeLabel: isAIMode ? '✨ AI Mode' : '🔍 Free Mode'
    };
};

export default useDualMode;
