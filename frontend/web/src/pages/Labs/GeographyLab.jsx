/**
 * ILAI Professional Labs - Geography Lab
 * 
 * Interactive geography learning with:
 * - World map visualization
 * - Country information
 * - Climate zones
 * - Physical geography features
 * - Quiz mode
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Globe, MapPin, Mountain, Droplets, Wind, Thermometer,
    Search, Info, ChevronRight, CheckCircle, XCircle,
    RefreshCw, Award
} from 'lucide-react';

// World regions data
const REGIONS = {
    asia: {
        name: 'Asia',
        countries: ['China', 'India', 'Japan', 'South Korea', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines'],
        facts: ['Largest continent by area and population', 'Home to Mount Everest', 'Contains 48 countries'],
        color: '#ef4444'
    },
    europe: {
        name: 'Europe',
        countries: ['Germany', 'France', 'UK', 'Italy', 'Spain', 'Poland', 'Netherlands', 'Belgium'],
        facts: ['Second smallest continent', 'Home to 44 countries', 'Birthplace of Western civilization'],
        color: '#3b82f6'
    },
    africa: {
        name: 'Africa',
        countries: ['Nigeria', 'Egypt', 'South Africa', 'Kenya', 'Morocco', 'Ethiopia', 'Ghana', 'Tanzania'],
        facts: ['Second largest continent', 'Contains the Sahara Desert', 'Home to 54 countries'],
        color: '#22c55e'
    },
    northAmerica: {
        name: 'North America',
        countries: ['USA', 'Canada', 'Mexico', 'Cuba', 'Jamaica', 'Panama', 'Costa Rica', 'Guatemala'],
        facts: ['Third largest continent', 'Contains Grand Canyon', 'Home to 23 countries'],
        color: '#f59e0b'
    },
    southAmerica: {
        name: 'South America',
        countries: ['Brazil', 'Argentina', 'Colombia', 'Peru', 'Chile', 'Venezuela', 'Ecuador', 'Bolivia'],
        facts: ['Fourth largest continent', 'Contains Amazon Rainforest', 'Home to 12 countries'],
        color: '#8b5cf6'
    },
    oceania: {
        name: 'Oceania',
        countries: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Samoa', 'Tonga', 'Vanuatu'],
        facts: ['Smallest continent', 'Contains Great Barrier Reef', 'Home to 14 countries'],
        color: '#ec4899'
    },
    antarctica: {
        name: 'Antarctica',
        countries: [],
        facts: ['Fifth largest continent', 'Coldest place on Earth', 'No permanent population'],
        color: '#06b6d4'
    }
};

// Climate zones
const CLIMATE_ZONES = [
    { name: 'Tropical', temp: '20-30°C', description: 'Hot and wet year-round', color: '#ef4444' },
    { name: 'Dry/Arid', temp: '10-40°C', description: 'Very little rainfall', color: '#f59e0b' },
    { name: 'Temperate', temp: '10-20°C', description: 'Moderate temperatures', color: '#22c55e' },
    { name: 'Continental', temp: '-30 to 30°C', description: 'Large temperature variations', color: '#3b82f6' },
    { name: 'Polar', temp: '-50 to 0°C', description: 'Extremely cold', color: '#06b6d4' }
];

// Physical features
const PHYSICAL_FEATURES = [
    { name: 'Mountains', icon: Mountain, examples: ['Himalayas', 'Alps', 'Andes', 'Rockies'] },
    { name: 'Rivers', icon: Droplets, examples: ['Amazon', 'Nile', 'Ganges', 'Mississippi'] },
    { name: 'Deserts', icon: Wind, examples: ['Sahara', 'Gobi', 'Arabian', 'Kalahari'] },
    { name: 'Oceans', icon: Globe, examples: ['Pacific', 'Atlantic', 'Indian', 'Arctic'] }
];

// Quiz questions
const QUIZ_QUESTIONS = [
    { question: 'What is the largest continent?', options: ['Asia', 'Africa', 'Europe', 'North America'], answer: 'Asia' },
    { question: 'Which river is the longest?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], answer: 'Nile' },
    { question: 'What is the smallest ocean?', options: ['Indian', 'Arctic', 'Atlantic', 'Pacific'], answer: 'Arctic' },
    { question: 'Which desert is the largest?', options: ['Gobi', 'Sahara', 'Arabian', 'Kalahari'], answer: 'Sahara' },
    { question: 'Mount Everest is in which mountain range?', options: ['Alps', 'Andes', 'Himalayas', 'Rockies'], answer: 'Himalayas' },
    { question: 'Which continent has the most countries?', options: ['Asia', 'Africa', 'Europe', 'South America'], answer: 'Africa' },
    { question: 'The Amazon Rainforest is in which continent?', options: ['Africa', 'Asia', 'South America', 'North America'], answer: 'South America' },
    { question: 'Which ocean is the largest?', options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], answer: 'Pacific' }
];

const GeographyLab = () => {
    const [activeTab, setActiveTab] = useState('explore');
    const [selectedRegion, setSelectedRegion] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [quizState, setQuizState] = useState({
        active: false,
        currentQuestion: 0,
        score: 0,
        answered: false,
        selectedAnswer: null
    });

    const startQuiz = () => {
        setQuizState({
            active: true,
            currentQuestion: 0,
            score: 0,
            answered: false,
            selectedAnswer: null
        });
    };

    const answerQuestion = (answer) => {
        if (quizState.answered) return;

        const isCorrect = answer === QUIZ_QUESTIONS[quizState.currentQuestion].answer;
        setQuizState(prev => ({
            ...prev,
            answered: true,
            selectedAnswer: answer,
            score: isCorrect ? prev.score + 1 : prev.score
        }));
    };

    const nextQuestion = () => {
        if (quizState.currentQuestion < QUIZ_QUESTIONS.length - 1) {
            setQuizState(prev => ({
                ...prev,
                currentQuestion: prev.currentQuestion + 1,
                answered: false,
                selectedAnswer: null
            }));
        } else {
            setQuizState(prev => ({ ...prev, active: false }));
        }
    };

    const filteredCountries = searchQuery
        ? Object.values(REGIONS).flatMap(r =>
            r.countries.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : [];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
                            <Globe size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Geography Lab</h1>
                            <p className="text-sm text-gray-500">Explore Our World</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search countries..."
                            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-teal-500 w-64"
                        />
                        {filteredCountries.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                                {filteredCountries.map((country, idx) => (
                                    <div key={idx} className="px-4 py-2 hover:bg-gray-700 text-sm">
                                        {country}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {['explore', 'climate', 'features', 'quiz'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-teal-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Explore Tab */}
                {activeTab === 'explore' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* World Map Visualization */}
                        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-lg font-medium text-white mb-4">World Continents</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(REGIONS).map(([key, region]) => (
                                    <motion.button
                                        key={key}
                                        onClick={() => setSelectedRegion(selectedRegion === key ? null : key)}
                                        className={`p-4 rounded-xl border-2 transition-all ${selectedRegion === key
                                                ? 'border-white bg-gray-800'
                                                : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-full mb-3 flex items-center justify-center text-white text-lg"
                                            style={{ background: region.color }}
                                        >
                                            <Globe size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-white">{region.name}</div>
                                            <div className="text-xs text-gray-500">
                                                {region.countries.length} countries
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Region Details */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-lg font-medium text-white mb-4">
                                {selectedRegion ? REGIONS[selectedRegion].name : 'Select a Region'}
                            </h3>

                            {selectedRegion ? (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm text-gray-400 mb-2">Countries</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {REGIONS[selectedRegion].countries.map((country, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-gray-800 rounded text-xs">
                                                    {country}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm text-gray-400 mb-2">Key Facts</h4>
                                        <ul className="space-y-2">
                                            {REGIONS[selectedRegion].facts.map((fact, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-sm">
                                                    <Info size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
                                                    {fact}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">
                                    Click on a continent to view details about countries and key facts.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Climate Tab */}
                {activeTab === 'climate' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {CLIMATE_ZONES.map((zone, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: `${zone.color}20` }}
                                    >
                                        <Thermometer size={24} style={{ color: zone.color }} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{zone.name}</h3>
                                        <p className="text-sm text-gray-500">{zone.temp}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">{zone.description}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Physical Features Tab */}
                {activeTab === 'features' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {PHYSICAL_FEATURES.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 bg-gray-800 rounded-xl">
                                        <feature.icon size={24} className="text-teal-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white">{feature.name}</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {feature.examples.map((example, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-800 rounded-lg text-sm">
                                            {example}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Quiz Tab */}
                {activeTab === 'quiz' && (
                    <div className="max-w-2xl mx-auto">
                        {!quizState.active && quizState.score === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center"
                            >
                                <div className="p-4 bg-teal-500/20 rounded-full w-fit mx-auto mb-4">
                                    <Award size={48} className="text-teal-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Geography Quiz</h2>
                                <p className="text-gray-400 mb-6">
                                    Test your knowledge with {QUIZ_QUESTIONS.length} questions about world geography!
                                </p>
                                <button
                                    onClick={startQuiz}
                                    className="px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-medium text-white"
                                >
                                    Start Quiz
                                </button>
                            </motion.div>
                        ) : quizState.active ? (
                            <motion.div
                                key={quizState.currentQuestion}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-sm text-gray-500">
                                        Question {quizState.currentQuestion + 1} of {QUIZ_QUESTIONS.length}
                                    </span>
                                    <span className="text-sm text-teal-500">
                                        Score: {quizState.score}
                                    </span>
                                </div>

                                <h3 className="text-xl font-medium text-white mb-6">
                                    {QUIZ_QUESTIONS[quizState.currentQuestion].question}
                                </h3>

                                <div className="space-y-3">
                                    {QUIZ_QUESTIONS[quizState.currentQuestion].options.map((option, idx) => {
                                        const isCorrect = option === QUIZ_QUESTIONS[quizState.currentQuestion].answer;
                                        const isSelected = option === quizState.selectedAnswer;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => answerQuestion(option)}
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
                                                {quizState.answered && isCorrect && (
                                                    <CheckCircle size={20} className="text-green-500" />
                                                )}
                                                {quizState.answered && isSelected && !isCorrect && (
                                                    <XCircle size={20} className="text-red-500" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {quizState.answered && (
                                    <button
                                        onClick={nextQuestion}
                                        className="mt-6 w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-medium text-white flex items-center justify-center gap-2"
                                    >
                                        {quizState.currentQuestion < QUIZ_QUESTIONS.length - 1 ? (
                                            <>Next Question <ChevronRight size={18} /></>
                                        ) : (
                                            'See Results'
                                        )}
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center"
                            >
                                <div className="p-4 bg-yellow-500/20 rounded-full w-fit mx-auto mb-4">
                                    <Award size={48} className="text-yellow-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
                                <p className="text-4xl font-bold text-teal-500 mb-4">
                                    {quizState.score} / {QUIZ_QUESTIONS.length}
                                </p>
                                <p className="text-gray-400 mb-6">
                                    {quizState.score === QUIZ_QUESTIONS.length
                                        ? 'Perfect score! You\'re a geography expert!'
                                        : quizState.score >= QUIZ_QUESTIONS.length / 2
                                            ? 'Great job! Keep learning!'
                                            : 'Keep practicing to improve your score!'}
                                </p>
                                <button
                                    onClick={startQuiz}
                                    className="px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-xl font-medium text-white flex items-center gap-2 mx-auto"
                                >
                                    <RefreshCw size={18} /> Try Again
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GeographyLab;
