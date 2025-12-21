import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, AlertTriangle, X } from 'lucide-react';

/**
 * Cooling-Off Modal - Displays when user is rate limited or jailed
 * Shows countdown timer and explains resource protection
 */
const CoolingOffModal = ({ isOpen, onClose, jailInfo, violationInfo }) => {
    const [countdown, setCountdown] = useState(0);

    useEffect(() => {
        if (jailInfo?.remaining_seconds) {
            setCountdown(jailInfo.remaining_seconds);
        } else if (jailInfo?.release_at) {
            const remaining = Math.max(0, jailInfo.release_at - Date.now() / 1000);
            setCountdown(Math.floor(remaining));
        }
    }, [jailInfo]);

    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const formatCountdown = (seconds) => {
        if (seconds >= 86400) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            return `${days}d ${hours}h`;
        } else if (seconds >= 3600) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        } else if (seconds >= 60) {
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${minutes}m ${secs}s`;
        }
        return `${seconds}s`;
    };

    const isJailed = jailInfo?.jailed;
    const isRateLimited = violationInfo && !isJailed;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-md mx-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className={`px-6 py-4 ${isJailed ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isJailed ? (
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <ShieldAlert className="w-6 h-6 text-red-400" />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                                        <AlertTriangle className="w-6 h-6 text-yellow-400" />
                                    </div>
                                )}
                                <h2 className="text-lg font-semibold text-white">
                                    {isJailed ? 'Account Suspended' : 'Rate Limit Warning'}
                                </h2>
                            </div>
                            {!isJailed && (
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 space-y-6">
                        {isJailed ? (
                            <>
                                {/* Countdown Timer */}
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-red-500/10 border-4 border-red-500/30">
                                        <div className="text-center">
                                            <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                            <span className="text-2xl font-bold text-red-400">
                                                {formatCountdown(countdown)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center space-y-2">
                                    <p className="text-gray-300">
                                        Your account has been temporarily suspended due to excessive API usage.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        This is offense #{jailInfo?.offense_count || 1}.
                                        Repeated violations result in longer suspensions.
                                    </p>
                                </div>

                                {/* Explanation */}
                                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                    <h3 className="text-sm font-medium text-gray-300 mb-2">
                                        Why am I seeing this?
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        ILAI's Research Lab uses advanced AI and scientific computing resources.
                                        Rate limits protect these shared resources and ensure fair access for all students.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Violation Warning */}
                                <div className="text-center space-y-2">
                                    <p className="text-gray-300">
                                        You're making requests too quickly!
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {violationInfo?.remaining || 5} violations remaining before suspension.
                                    </p>
                                </div>

                                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                                    <p className="text-sm text-yellow-300">
                                        💡 Tip: Wait a few seconds between calculations to avoid rate limits.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700">
                        {isJailed ? (
                            <p className="text-xs text-center text-gray-500">
                                Access will be restored automatically when the countdown ends.
                            </p>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                I Understand
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CoolingOffModal;
