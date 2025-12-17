import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Flame, Trophy, Star } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';

/**
 * XP Bar Component - Shows level progress with animated fill
 */
export function XPBar({ className = '' }) {
    const { level, totalXp, progress, xpToNext, formatXp, getLevelTitle } = useGamification();

    return (
        <div className={`p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 ${className}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {level}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                            Level {level}
                        </p>
                        <p className="text-xs text-surface-500">{getLevelTitle(level)}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-purple-500">{formatXp(totalXp)} XP</p>
                    <p className="text-xs text-surface-500">{formatXp(xpToNext)} to next</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                />
            </div>
        </div>
    );
}

/**
 * Streak Badge - Shows current study streak
 */
export function StreakBadge({ className = '' }) {
    const { currentStreak, stats } = useGamification();

    const streakColor = currentStreak >= 7 ? 'text-orange-500' :
        currentStreak >= 3 ? 'text-amber-500' : 'text-surface-500';
    const bgColor = currentStreak >= 7 ? 'bg-orange-500/10' :
        currentStreak >= 3 ? 'bg-amber-500/10' : 'bg-surface-500/10';

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor} ${className}`}>
            <Flame className={`w-5 h-5 ${streakColor}`} />
            <div>
                <p className={`text-lg font-bold ${streakColor}`}>{currentStreak}</p>
                <p className="text-xs text-surface-500">day streak</p>
            </div>
            {currentStreak >= 7 && (
                <span className="ml-1 text-xs">🔥</span>
            )}
        </div>
    );
}

/**
 * Stats Card - Quick overview of gamification stats
 */
export function GamificationStatsCard({ compact = false, className = '' }) {
    const { stats, loading, level, currentStreak, formatXp } = useGamification();

    if (loading) {
        return (
            <div className={`animate-pulse bg-surface-100 dark:bg-surface-800 rounded-xl p-4 ${className}`}>
                <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-3/4"></div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className={`flex items-center gap-4 ${className}`}>
                <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Lv.{level}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">{currentStreak}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">{formatXp(stats?.totalXp || 0)}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-xl bg-surface-100 dark:bg-surface-800/50 ${className}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                    <Star className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                    <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{level}</p>
                    <p className="text-xs text-surface-500">Level</p>
                </div>
                <div className="text-center">
                    <Zap className="w-6 h-6 mx-auto text-amber-500 mb-1" />
                    <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{formatXp(stats?.totalXp || 0)}</p>
                    <p className="text-xs text-surface-500">Total XP</p>
                </div>
                <div className="text-center">
                    <Flame className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                    <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{currentStreak}</p>
                    <p className="text-xs text-surface-500">Streak</p>
                </div>
                <div className="text-center">
                    <Trophy className="w-6 h-6 mx-auto text-yellow-500 mb-1" />
                    <p className="text-2xl font-bold text-surface-900 dark:text-surface-100">{stats?.achievementCount || 0}</p>
                    <p className="text-xs text-surface-500">Achievements</p>
                </div>
            </div>
        </div>
    );
}

/**
 * XP Reward Toast - Shows when user earns XP
 */
export function XPRewardToast({ xp, message, levelUp = false, achievements = [] }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
        >
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">+{xp} XP</span>
                {message && <span className="text-sm opacity-90">· {message}</span>}
            </div>

            {levelUp && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg flex items-center gap-2"
                >
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-bold">LEVEL UP!</span>
                </motion.div>
            )}

            {achievements.length > 0 && achievements.map((achievement, i) => (
                <motion.div
                    key={achievement.code}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-full shadow-lg flex items-center gap-2"
                >
                    <Trophy className="w-5 h-5" />
                    <span className="font-semibold">{achievement.name}</span>
                </motion.div>
            ))}
        </motion.div>
    );
}

export default XPBar;
