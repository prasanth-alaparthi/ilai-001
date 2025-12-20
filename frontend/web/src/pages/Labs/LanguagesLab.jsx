/**
 * ILAI Professional Labs - Languages Lab
 * 
 * Language learning with:
 * - Vocabulary builder
 * - Grammar exercises
 * - Pronunciation guide
 * - Translation practice
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare, BookOpen, Volume2, Check, X, RefreshCw,
    Globe, ChevronRight, Award, Search
} from 'lucide-react';
import labsService from '../../services/labsService';
import DerivationViewer from '../../components/labs/DerivationViewer';

// Vocabulary data
const VOCABULARY = {
    spanish: [
        { word: 'Hola', translation: 'Hello', pronunciation: 'OH-lah' },
        { word: 'Gracias', translation: 'Thank you', pronunciation: 'GRAH-see-ahs' },
        { word: 'Por favor', translation: 'Please', pronunciation: 'por fah-VOR' },
        { word: 'Buenos días', translation: 'Good morning', pronunciation: 'BWEH-nos DEE-ahs' },
        { word: 'Adiós', translation: 'Goodbye', pronunciation: 'ah-dee-OHS' },
        { word: 'Amor', translation: 'Love', pronunciation: 'ah-MOR' },
        { word: 'Agua', translation: 'Water', pronunciation: 'AH-gwah' },
        { word: 'Comida', translation: 'Food', pronunciation: 'koh-MEE-dah' }
    ],
    french: [
        { word: 'Bonjour', translation: 'Hello', pronunciation: 'bon-ZHOOR' },
        { word: 'Merci', translation: 'Thank you', pronunciation: 'mair-SEE' },
        { word: "S'il vous plaît", translation: 'Please', pronunciation: 'seel voo PLEH' },
        { word: 'Au revoir', translation: 'Goodbye', pronunciation: 'oh ruh-VWAHR' },
        { word: 'Amour', translation: 'Love', pronunciation: 'ah-MOOR' },
        { word: 'Eau', translation: 'Water', pronunciation: 'OH' },
        { word: 'Nourriture', translation: 'Food', pronunciation: 'noo-ree-TOOR' }
    ],
    german: [
        { word: 'Hallo', translation: 'Hello', pronunciation: 'HAH-loh' },
        { word: 'Danke', translation: 'Thank you', pronunciation: 'DAHN-kuh' },
        { word: 'Bitte', translation: 'Please', pronunciation: 'BIT-tuh' },
        { word: 'Auf Wiedersehen', translation: 'Goodbye', pronunciation: 'owf VEE-der-zay-en' },
        { word: 'Liebe', translation: 'Love', pronunciation: 'LEE-buh' },
        { word: 'Wasser', translation: 'Water', pronunciation: 'VAH-ser' }
    ]
};

// Grammar exercises
const GRAMMAR_EXERCISES = [
    { question: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], answer: 'am', topic: 'To be verb' },
    { question: 'She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 'goes', topic: 'Present simple' },
    { question: 'They ___ playing football now.', options: ['is', 'are', 'was', 'be'], answer: 'are', topic: 'Present continuous' },
    { question: 'He ___ already eaten lunch.', options: ['has', 'have', 'had', 'having'], answer: 'has', topic: 'Present perfect' },
    { question: 'We ___ watch a movie yesterday.', options: ["didn't", "don't", "doesn't", "wasn't"], answer: "didn't", topic: 'Past simple negative' }
];

const LanguagesLab = () => {
    const [activeTab, setActiveTab] = useState('vocabulary');
    const [selectedLanguage, setSelectedLanguage] = useState('spanish');
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [showTranslation, setShowTranslation] = useState(false);
    const [quizState, setQuizState] = useState({ current: 0, score: 0, answered: false, selected: null });

    // SpaCy Syntax Parser state
    const [sentenceInput, setSentenceInput] = useState('The quick brown fox jumps over the lazy dog.');
    const [parseResult, setParseResult] = useState(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState(null);

    const parseSentence = async () => {
        setIsParsing(true);
        setParseError(null);
        setParseResult(null);
        try {
            const result = await labsService.parseLanguage(sentenceInput);
            if (result.success) {
                setParseResult(result);
            } else {
                setParseError(result.error);
            }
        } catch (err) {
            setParseError(err.message || 'Failed to parse sentence');
        } finally {
            setIsParsing(false);
        }
    };

    const vocabulary = VOCABULARY[selectedLanguage] || [];
    const currentCard = vocabulary[flashcardIndex];

    const nextCard = () => {
        setFlashcardIndex((prev) => (prev + 1) % vocabulary.length);
        setShowTranslation(false);
    };

    const prevCard = () => {
        setFlashcardIndex((prev) => (prev - 1 + vocabulary.length) % vocabulary.length);
        setShowTranslation(false);
    };

    const answerQuiz = (answer) => {
        if (quizState.answered) return;
        const isCorrect = answer === GRAMMAR_EXERCISES[quizState.current].answer;
        setQuizState(prev => ({
            ...prev,
            answered: true,
            selected: answer,
            score: isCorrect ? prev.score + 1 : prev.score
        }));
    };

    const nextQuestion = () => {
        if (quizState.current < GRAMMAR_EXERCISES.length - 1) {
            setQuizState(prev => ({ ...prev, current: prev.current + 1, answered: false, selected: null }));
        }
    };

    const resetQuiz = () => {
        setQuizState({ current: 0, score: 0, answered: false, selected: null });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl">
                        <MessageSquare size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Languages Lab</h1>
                        <p className="text-sm text-gray-500">Learn New Languages</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {['vocabulary', 'grammar', 'syntax'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                ? 'bg-rose-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Vocabulary Tab */}
                {activeTab === 'vocabulary' && (
                    <div className="space-y-6">
                        {/* Language Selector */}
                        <div className="flex gap-2">
                            {Object.keys(VOCABULARY).map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => { setSelectedLanguage(lang); setFlashcardIndex(0); setShowTranslation(false); }}
                                    className={`px-4 py-2 rounded-lg text-sm capitalize ${selectedLanguage === lang
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>

                        {/* Flashcard */}
                        <motion.div
                            key={flashcardIndex}
                            initial={{ opacity: 0, rotateY: -90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center cursor-pointer max-w-md mx-auto"
                            onClick={() => setShowTranslation(!showTranslation)}
                        >
                            {!showTranslation ? (
                                <>
                                    <div className="text-4xl font-bold text-white mb-4">{currentCard?.word}</div>
                                    <div className="text-sm text-gray-500">{currentCard?.pronunciation}</div>
                                    <div className="text-xs text-gray-600 mt-4">Click to reveal translation</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-4xl font-bold text-rose-400">{currentCard?.translation}</div>
                                    <div className="text-sm text-gray-500 mt-4">{currentCard?.word}</div>
                                </>
                            )}
                        </motion.div>

                        {/* Navigation */}
                        <div className="flex justify-center gap-4">
                            <button onClick={prevCard} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-500">
                                {flashcardIndex + 1} / {vocabulary.length}
                            </span>
                            <button onClick={nextCard} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-white">
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {/* Grammar Tab */}
                {activeTab === 'grammar' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm text-gray-500">
                                    Question {quizState.current + 1} of {GRAMMAR_EXERCISES.length}
                                </span>
                                <span className="text-sm text-rose-400">Score: {quizState.score}</span>
                            </div>

                            <div className="text-xs text-gray-500 mb-2">
                                Topic: {GRAMMAR_EXERCISES[quizState.current].topic}
                            </div>
                            <h3 className="text-xl font-medium text-white mb-6">
                                {GRAMMAR_EXERCISES[quizState.current].question}
                            </h3>

                            <div className="space-y-3">
                                {GRAMMAR_EXERCISES[quizState.current].options.map((option, idx) => {
                                    const isCorrect = option === GRAMMAR_EXERCISES[quizState.current].answer;
                                    const isSelected = option === quizState.selected;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => answerQuiz(option)}
                                            disabled={quizState.answered}
                                            className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${quizState.answered
                                                ? isCorrect
                                                    ? 'bg-green-500/20 border-green-500'
                                                    : isSelected
                                                        ? 'bg-red-500/20 border-red-500'
                                                        : 'bg-gray-800 border-gray-700'
                                                : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                                                } border`}
                                        >
                                            {option}
                                            {quizState.answered && isCorrect && <Check size={20} className="text-green-500" />}
                                            {quizState.answered && isSelected && !isCorrect && <X size={20} className="text-red-500" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {quizState.answered && (
                                <div className="mt-6 flex gap-3">
                                    {quizState.current < GRAMMAR_EXERCISES.length - 1 ? (
                                        <button onClick={nextQuestion} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-white font-medium">
                                            Next Question <ChevronRight size={18} className="inline" />
                                        </button>
                                    ) : (
                                        <button onClick={resetQuiz} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-white font-medium flex items-center justify-center gap-2">
                                            <RefreshCw size={18} /> Restart Quiz
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Syntax Parser Tab */}
                {activeTab === 'syntax' && (
                    <div className="space-y-6">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Search className="w-6 h-6 text-rose-400" />
                                <h3 className="text-xl font-semibold text-white">
                                    SpaCy Syntax Parser
                                </h3>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Enter a sentence to analyze
                                </label>
                                <input
                                    type="text"
                                    value={sentenceInput}
                                    onChange={(e) => setSentenceInput(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-rose-500 outline-none text-white"
                                    placeholder="The quick brown fox jumps over the lazy dog."
                                />
                            </div>

                            <button
                                onClick={parseSentence}
                                disabled={isParsing || !sentenceInput.trim()}
                                className="mb-6 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                            >
                                {isParsing ? 'Parsing with SpaCy...' : 'Analyze Syntax'}
                            </button>

                            {parseResult && (
                                <div className="space-y-4 mb-6">
                                    <h4 className="text-sm font-medium text-gray-400 uppercase">Dependency Analysis</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-800">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-gray-400">Token</th>
                                                    <th className="px-3 py-2 text-left text-gray-400">POS</th>
                                                    <th className="px-3 py-2 text-left text-gray-400">Dependency</th>
                                                    <th className="px-3 py-2 text-left text-gray-400">Head</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parseResult.dependencies?.map((dep, i) => (
                                                    <tr key={i} className="border-t border-gray-800">
                                                        <td className="px-3 py-2 font-mono text-rose-400">{dep.token}</td>
                                                        <td className="px-3 py-2 text-blue-400">{dep.pos}</td>
                                                        <td className="px-3 py-2 text-green-400">{dep.dep}</td>
                                                        <td className="px-3 py-2 text-gray-300">{dep.head}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {parseResult.entities?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400 uppercase mb-2">Named Entities</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {parseResult.entities.map((ent, i) => (
                                                    <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                                                        {ent.text} ({ent.label})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <DerivationViewer
                                latex={parseResult?.derivation_latex}
                                assumptions={parseResult?.assumptions}
                                evidence={parseResult?.evidence}
                                subject={parseResult?.subject}
                                isLoading={isParsing}
                                error={parseError}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LanguagesLab;
