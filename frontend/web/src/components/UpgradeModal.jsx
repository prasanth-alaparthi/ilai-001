import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, Building2, CreditCard, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Upgrade Modal - Shows when user tries to access a locked feature
 * 
 * Usage:
 * <UpgradeModal 
 *   isOpen={showUpgrade} 
 *   onClose={() => setShowUpgrade(false)}
 *   feature="flashcards"
 * />
 */
export function UpgradeModal({ isOpen, onClose, feature = null, requiredTier = 'PREMIUM' }) {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState('pro');

    const isInstitutionRequired = requiredTier === 'INSTITUTIONAL';

    const handleUpgrade = () => {
        onClose();
        if (isInstitutionRequired) {
            navigate('/settings?tab=institution');
        } else {
            navigate('/pricing');
        }
    };

    const plans = [
        {
            id: 'pro',
            name: 'Student Pro',
            price: '₹199',
            period: '/month',
            features: [
                'AI Flashcards & Quizzes',
                'Mind Maps & Study Guides',
                'Voice Notes → Text',
                'Doubt Solver with Citations',
                'Quantum Computing Lab',
                'Unlimited AI Usage',
                'No Ads',
            ],
            popular: true,
        },
        {
            id: 'pro_plus',
            name: 'Pro+',
            price: '₹499',
            period: '/month',
            features: [
                'Everything in Pro',
                'Deep Research Agent',
                'API Access',
                'Priority Support',
                'Early Access to Features',
            ],
            popular: false,
        },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl md:w-full bg-white dark:bg-surface-900 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="w-8 h-8" />
                                <h2 className="text-2xl font-bold">Unlock Premium Features</h2>
                            </div>
                            <p className="text-purple-100">
                                {feature 
                                    ? `Upgrade to access ${feature.replace(/_/g, ' ')}`
                                    : 'Get unlimited access to all AI features'}
                            </p>
                        </div>

                        {isInstitutionRequired ? (
                            /* Institution Required Content */
                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <Building2 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                                        Institution Feature
                                    </h3>
                                    <p className="text-surface-600 dark:text-surface-400">
                                        This feature is available for students linked to a school or college account.
                                    </p>
                                </div>

                                <div className="bg-surface-100 dark:bg-surface-800 rounded-xl p-4 mb-6">
                                    <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-3">
                                        Institution Features Include:
                                    </h4>
                                    <ul className="space-y-2 text-surface-600 dark:text-surface-400">
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Classroom & Assignments
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Study Clubs & Groups
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Parent Dashboard
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Teacher Tools & Grading
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            Progress Reports
                                        </li>
                                    </ul>
                                </div>

                                <button
                                    onClick={handleUpgrade}
                                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Building2 className="w-5 h-5" />
                                    Link to Your School
                                </button>
                                <p className="text-center text-sm text-surface-500 mt-3">
                                    Ask your school admin to add ILAI for your institution
                                </p>
                            </div>
                        ) : (
                            /* Pro Plans Content */
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id)}
                                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                selectedPlan === plan.id
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-surface-200 dark:border-surface-700 hover:border-purple-300'
                                            }`}
                                        >
                                            {plan.popular && (
                                                <span className="absolute -top-2 left-4 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full font-semibold">
                                                    Popular
                                                </span>
                                            )}
                                            
                                            <div className="flex items-baseline gap-1 mb-3">
                                                <span className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                                                    {plan.price}
                                                </span>
                                                <span className="text-surface-500">{plan.period}</span>
                                            </div>
                                            
                                            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-2">
                                                {plan.name}
                                            </h4>
                                            
                                            <ul className="space-y-1 text-sm text-surface-600 dark:text-surface-400">
                                                {plan.features.slice(0, 4).map((f, i) => (
                                                    <li key={i} className="flex items-center gap-1">
                                                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                                                        <span className="truncate">{f}</span>
                                                    </li>
                                                ))}
                                                {plan.features.length > 4 && (
                                                    <li className="text-purple-500">
                                                        +{plan.features.length - 4} more
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleUpgrade}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-5 h-5" />
                                    Upgrade Now
                                </button>
                                
                                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-surface-500">
                                    <CreditCard className="w-4 h-4" />
                                    <span>UPI, Cards, Net Banking accepted</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default UpgradeModal;
