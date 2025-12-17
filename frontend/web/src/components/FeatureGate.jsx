import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Building2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFeatureAccess } from '../hooks/useFeatureAccess';

/**
 * Feature Gate Component
 * 
 * Wraps content that requires specific feature access.
 * Shows locked state with upgrade prompt if user doesn't have access.
 * 
 * Usage:
 * <FeatureGate feature="flashcards">
 *   <FlashcardsPage />
 * </FeatureGate>
 */
export function FeatureGate({ feature, children, fallback = null, showLock = true }) {
    const { canAccess, getRequiredTier, getUpgradeMessage } = useFeatureAccess();

    if (canAccess(feature)) {
        return children;
    }

    if (fallback) {
        return fallback;
    }

    if (!showLock) {
        return null;
    }

    return (
        <LockedFeatureCard
            feature={feature}
            requiredTier={getRequiredTier(feature)}
            message={getUpgradeMessage(feature)}
        />
    );
}

/**
 * Locked Feature Card - Shows when user doesn't have access
 */
export function LockedFeatureCard({ feature, requiredTier, message }) {
    const navigate = useNavigate();

    const isInstitutionFeature = requiredTier === 'INSTITUTIONAL';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[400px] p-8"
        >
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                    {isInstitutionFeature ? (
                        <Building2 className="w-12 h-12 text-purple-400" />
                    ) : (
                        <Lock className="w-12 h-12 text-purple-400" />
                    )}
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
            </div>

            <h3 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2 text-center">
                {isInstitutionFeature ? 'Institution Feature' : 'Pro Feature'}
            </h3>

            <p className="text-surface-600 dark:text-surface-400 text-center max-w-md mb-6">
                {message}
            </p>

            {isInstitutionFeature ? (
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={() => navigate('/settings?tab=institution')}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Building2 className="w-5 h-5" />
                        Link to Your School
                    </button>
                    <p className="text-sm text-surface-500 dark:text-surface-500">
                        Ask your school admin to invite you to ILAI
                    </p>
                </div>
            ) : (
                <button
                    onClick={() => navigate('/pricing')}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2 group"
                >
                    Upgrade to Pro
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            )}

            <div className="mt-8 p-4 rounded-xl bg-surface-100 dark:bg-surface-800/50 max-w-sm">
                <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                    {isInstitutionFeature ? 'Institution Features Include:' : 'Pro Features Include:'}
                </h4>
                <ul className="text-sm text-surface-600 dark:text-surface-400 space-y-1">
                    {isInstitutionFeature ? (
                        <>
                            <li>✓ Classroom & Assignments</li>
                            <li>✓ Study Clubs</li>
                            <li>✓ Parent Dashboard</li>
                            <li>✓ Teacher Tools</li>
                            <li>✓ Progress Tracking</li>
                        </>
                    ) : (
                        <>
                            <li>✓ AI Flashcards & Quizzes</li>
                            <li>✓ Mind Maps & Study Guides</li>
                            <li>✓ Voice Notes</li>
                            <li>✓ Doubt Solver</li>
                            <li>✓ Unlimited AI Usage</li>
                        </>
                    )}
                </ul>
            </div>
        </motion.div>
    );
}

/**
 * Feature Lock Badge - Small indicator for locked features in navigation
 */
export function FeatureLockBadge({ feature }) {
    const { canAccess } = useFeatureAccess();

    if (canAccess(feature)) {
        return null;
    }

    return (
        <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
            PRO
        </span>
    );
}

/**
 * Upgrade Prompt - Inline prompt to upgrade
 */
export function UpgradePrompt({ feature, compact = false }) {
    const navigate = useNavigate();
    const { canAccess, getRequiredTier } = useFeatureAccess();

    if (canAccess(feature)) {
        return null;
    }

    const requiredTier = getRequiredTier(feature);
    const isPro = requiredTier === 'PREMIUM';

    if (compact) {
        return (
            <button
                onClick={() => navigate(isPro ? '/pricing' : '/settings?tab=institution')}
                className="text-sm text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
                <Sparkles className="w-3 h-3" />
                {isPro ? 'Upgrade' : 'Link School'}
            </button>
        );
    }

    return (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {isPro ? 'Upgrade to Pro' : 'Link to Your School'}
                    </p>
                    <p className="text-xs text-surface-600 dark:text-surface-400">
                        {isPro ? 'Unlock all AI features' : 'Access classroom features'}
                    </p>
                </div>
                <button
                    onClick={() => navigate(isPro ? '/pricing' : '/settings?tab=institution')}
                    className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
                >
                    {isPro ? 'Upgrade' : 'Link'}
                </button>
            </div>
        </div>
    );
}

export default FeatureGate;
