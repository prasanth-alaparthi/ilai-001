import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import teTranslations from './locales/te.json';
import bnTranslations from './locales/bn.json';
import knTranslations from './locales/kn.json';
import taTranslations from './locales/ta.json';
import mlTranslations from './locales/ml.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';

// Supported languages
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

// Get saved language or detect from browser
const getSavedLanguage = () => {
    const saved = localStorage.getItem('language');
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
    }

    // Try browser language
    const browserLang = navigator.language?.split('-')[0];
    if (SUPPORTED_LANGUAGES.some(l => l.code === browserLang)) {
        return browserLang;
    }

    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: enTranslations },
            hi: { translation: hiTranslations },
            te: { translation: teTranslations },
            bn: { translation: bnTranslations },
            kn: { translation: knTranslations },
            ta: { translation: taTranslations },
            ml: { translation: mlTranslations },
            es: { translation: esTranslations },
            fr: { translation: frTranslations },
            de: { translation: deTranslations },
        },
        lng: getSavedLanguage(),
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes
        },
        react: {
            useSuspense: false,
        },
    });

// Helper to change language
export const changeLanguage = (langCode) => {
    localStorage.setItem('language', langCode);
    i18n.changeLanguage(langCode);
};

// Get current language info
export const getCurrentLanguage = () => {
    return SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];
};

export default i18n;
