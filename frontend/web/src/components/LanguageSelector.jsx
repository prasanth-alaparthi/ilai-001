import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '../i18n';

/**
 * Language Selector Component - Dropdown for switching app language
 */
export function LanguageSelector({ compact = false, className = '' }) {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const currentLang = getCurrentLanguage();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode) => {
        changeLanguage(langCode);
        setIsOpen(false);
    };

    if (compact) {
        return (
            <div ref={dropdownRef} className={`relative ${className}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                    title="Change Language"
                >
                    <Globe className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 overflow-hidden z-50"
                        >
                            {SUPPORTED_LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors ${i18n.language === lang.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{lang.flag}</span>
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                                                {lang.nativeName}
                                            </p>
                                            <p className="text-xs text-surface-500">{lang.name}</p>
                                        </div>
                                    </div>
                                    {i18n.language === lang.code && (
                                        <Check className="w-4 h-4 text-blue-500" />
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            >
                <span className="text-lg">{currentLang.flag}</span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    {currentLang.nativeName}
                </span>
                <ChevronDown className={`w-4 h-4 text-surface-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute left-0 mt-2 w-56 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-surface-200 dark:border-surface-700 overflow-hidden z-50"
                    >
                        <div className="px-4 py-2 border-b border-surface-200 dark:border-surface-700">
                            <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">
                                Select Language
                            </p>
                        </div>
                        {SUPPORTED_LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors ${i18n.language === lang.code ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{lang.flag}</span>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                                            {lang.nativeName}
                                        </p>
                                        <p className="text-xs text-surface-500">{lang.name}</p>
                                    </div>
                                </div>
                                {i18n.language === lang.code && (
                                    <Check className="w-5 h-5 text-blue-500" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * Inline language switcher for settings pages
 */
export function LanguageSettings() {
    const { t, i18n } = useTranslation();

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium text-surface-700 dark:text-surface-300">
                {t('settings.language')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`p-4 rounded-xl border-2 transition-all ${i18n.language === lang.code
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'
                            }`}
                    >
                        <span className="text-2xl mb-2 block">{lang.flag}</span>
                        <p className="font-medium text-surface-900 dark:text-surface-100">
                            {lang.nativeName}
                        </p>
                        <p className="text-sm text-surface-500">{lang.name}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default LanguageSelector;
