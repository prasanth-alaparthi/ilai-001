import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Check, ChevronRight, Sparkles, Crown, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// UPI App logos (SVG paths simplified)
const UPI_APPS = [
    { id: 'gpay', name: 'Google Pay', color: '#4285F4', icon: '🔵' },
    { id: 'phonepe', name: 'PhonePe', icon: '💜' },
    { id: 'paytm', name: 'Paytm', icon: '🔵' },
    { id: 'bhim', name: 'BHIM UPI', icon: '🟠' },
];

const PAYMENT_METHODS = [
    { id: 'card', name: 'Card', icon: CreditCard, description: 'Debit/Credit Card' },
    { id: 'upi', name: 'UPI', icon: Smartphone, description: 'GPay, PhonePe, Paytm' },
];

/**
 * Payment Method Selector Component
 */
export function PaymentMethodSelector({ selectedMethod, onSelect, onUpiAppSelect, selectedUpiApp }) {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-surface-600 dark:text-surface-400">
                Choose Payment Method
            </h3>

            <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => (
                    <button
                        key={method.id}
                        onClick={() => onSelect(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedMethod === method.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                            }`}
                    >
                        <method.icon className={`w-6 h-6 mb-2 ${selectedMethod === method.id ? 'text-blue-500' : 'text-surface-500'
                            }`} />
                        <p className="font-medium text-surface-900 dark:text-surface-100">
                            {method.name}
                        </p>
                        <p className="text-xs text-surface-500">{method.description}</p>
                    </button>
                ))}
            </div>

            {/* UPI App Selection */}
            {selectedMethod === 'upi' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-surface-200 dark:border-surface-700"
                >
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-3">
                        Select UPI App
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {UPI_APPS.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => onUpiAppSelect(app.id)}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center transition-all ${selectedUpiApp === app.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-surface-200 dark:border-surface-700'
                                    }`}
                            >
                                <span className="text-2xl mb-1">{app.icon}</span>
                                <span className="text-xs text-center">{app.name}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/**
 * Pricing Card Component
 */
export function PricingCard({ plan, isPopular, onSelect, isSelected }) {
    const { t } = useTranslation();

    const getIcon = () => {
        switch (plan.id) {
            case 'free': return Sparkles;
            case 'student_pro_monthly':
            case 'student_pro_yearly': return Crown;
            case 'institution_monthly': return Building2;
            default: return Sparkles;
        }
    };

    const Icon = getIcon();

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={`relative p-6 rounded-2xl border-2 transition-all ${isSelected
                    ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/20 dark:to-surface-900'
                    : isPopular
                        ? 'border-purple-500 bg-gradient-to-b from-purple-50 to-white dark:from-purple-900/20 dark:to-surface-900'
                        : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900'
                }`}
        >
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                    Most Popular
                </div>
            )}

            <div className={`inline-flex p-3 rounded-xl mb-4 ${isPopular ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-surface-100 dark:bg-surface-800'
                }`}>
                <Icon className={`w-6 h-6 ${isPopular ? 'text-purple-500' : 'text-surface-600'}`} />
            </div>

            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                {plan.name}
            </h3>

            <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-surface-900 dark:text-surface-100">
                    {plan.displayPrice}
                </span>
                {plan.amount > 0 && (
                    <span className="text-surface-500">/{plan.interval}</span>
                )}
            </div>

            <ul className="space-y-3 mb-6">
                {plan.features?.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onSelect(plan)}
                className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isSelected
                        ? 'bg-blue-500 text-white'
                        : isPopular
                            ? 'bg-purple-500 text-white hover:bg-purple-600'
                            : plan.amount === 0
                                ? 'bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-200'
                                : 'bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 hover:opacity-90'
                    }`}
            >
                {plan.amount === 0 ? 'Current Plan' : 'Subscribe'}
                <ChevronRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

/**
 * Payment Status Modal
 */
export function PaymentStatusModal({ status, onClose }) {
    if (!status) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-surface-900 rounded-2xl p-6 max-w-sm w-full text-center"
            >
                {status.success ? (
                    <>
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                            Payment Successful!
                        </h3>
                        <p className="text-surface-600 dark:text-surface-400 mb-4">
                            {status.message}
                        </p>
                        {status.paymentId && (
                            <p className="text-xs text-surface-500 mb-4">
                                Payment ID: {status.paymentId}
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">❌</span>
                        </div>
                        <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                            Payment Failed
                        </h3>
                        <p className="text-surface-600 dark:text-surface-400 mb-4">
                            {status.message || 'Something went wrong. Please try again.'}
                        </p>
                    </>
                )}

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 rounded-xl font-medium"
                >
                    {status.success ? 'Continue' : 'Try Again'}
                </button>
            </motion.div>
        </div>
    );
}

export default { PaymentMethodSelector, PricingCard, PaymentStatusModal };
