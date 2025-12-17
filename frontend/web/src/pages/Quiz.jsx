import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Brain, Trophy, Clock, CheckCircle, XCircle,
    RefreshCw, ArrowRight, ArrowLeft, Sparkles, Loader2,
    Target, TrendingUp, Zap, Award
} from 'lucide-react';
import apiClient from '../services/apiClient';

const QuizPage = () => {
    // Quiz state
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [quizComplete, setQuizComplete] = useState(false);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [topic, setTopic] = useState('');
    const [contentSource, setContentSource] = useState('notes'); // 'notes' | 'topic' | 'journal'
    const [recentNotes, setRecentNotes] = useState([]);
    const [selectedNoteId, setSelectedNoteId] = useState(null);
    const [error, setError] = useState(null);

    // Stats
    const [stats, setStats] = useState({ quizzesTaken: 0, avgScore: 0, streak: 0 });

    // Load recent notes for quiz source
    useEffect(() => {
        loadRecentNotes();
    }, []);

    const loadRecentNotes = async () => {
        try {
            const res = await apiClient.get('/notes?sort=updatedAt,desc&size=10');
            const items = res.data?.content || res.data || [];
            setRecentNotes(items);
            if (items.length > 0) {
                setSelectedNoteId(items[0].id);
            }
        } catch (err) {
            console.error('Failed to load notes:', err);
        }
    };

    const generateQuiz = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            let content = '';

            if (contentSource === 'topic') {
                content = topic;
            } else if (contentSource === 'notes' && selectedNoteId) {
                // Fetch note content
                const noteRes = await apiClient.get(`/notes/${selectedNoteId}`);
                const noteContent = noteRes.data?.content;
                content = typeof noteContent === 'string' ? noteContent : JSON.stringify(noteContent);
            }

            if (!content || content.length < 20) {
                setError('Please provide more content to generate a quiz from.');
                setIsGenerating(false);
                return;
            }

            const res = await apiClient.post('/ai/generate-quiz', { content });
            const quizJson = res.data?.quiz;

            // Parse quiz JSON
            let parsedQuiz;
            try {
                parsedQuiz = typeof quizJson === 'string' ? JSON.parse(quizJson) : quizJson;
            } catch {
                // Try to extract JSON from response
                const jsonMatch = quizJson?.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    parsedQuiz = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Failed to parse quiz');
                }
            }

            // Normalize quiz format
            const questions = Array.isArray(parsedQuiz) ? parsedQuiz : parsedQuiz.questions || [];

            setQuizData({
                topic: topic || 'Your Notes',
                questions: questions.map((q, idx) => ({
                    id: idx + 1,
                    question: q.question || q.text,
                    options: q.options || q.choices || [],
                    correctAnswer: q.correctAnswer ?? q.correct ?? q.answer ?? 0,
                    explanation: q.explanation || ''
                }))
            });

            setCurrentQuestionIndex(0);
            setAnswers([]);
            setShowResult(false);
            setQuizComplete(false);

        } catch (err) {
            console.error('Quiz generation failed:', err);
            setError('Failed to generate quiz. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnswerSelect = (answerIndex) => {
        if (showResult) return;
        setSelectedAnswer(answerIndex);
    };

    const submitAnswer = () => {
        if (selectedAnswer === null) return;

        const currentQuestion = quizData.questions[currentQuestionIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

        setAnswers([...answers, {
            questionId: currentQuestionIndex,
            selected: selectedAnswer,
            correct: currentQuestion.correctAnswer,
            isCorrect
        }]);

        setShowResult(true);
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            completeQuiz();
        }
    };

    const completeQuiz = async () => {
        setQuizComplete(true);

        // Record quiz result
        const correctCount = answers.filter(a => a.isCorrect).length +
            (selectedAnswer === quizData.questions[currentQuestionIndex].correctAnswer ? 1 : 0);

        try {
            await apiClient.post('/personalization/quiz/record', {
                topic: quizData.topic,
                totalQuestions: quizData.questions.length,
                correctAnswers: correctCount,
                durationSeconds: 300 // TODO: Track actual time
            });
        } catch (err) {
            console.error('Failed to record quiz result:', err);
        }
    };

    const resetQuiz = () => {
        setQuizData(null);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswers([]);
        setShowResult(false);
        setQuizComplete(false);
        setTopic('');
    };

    const getScore = () => {
        const correct = answers.filter(a => a.isCorrect).length;
        return Math.round((correct / quizData.questions.length) * 100);
    };

    // Render quiz setup screen
    if (!quizData) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-500" />
                        Quick Quiz
                    </h1>
                    <p className="text-surface-600 dark:text-surface-400 mt-2">
                        Test your knowledge with AI-generated quizzes
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-4 border border-purple-500/20">
                        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                            <Target className="w-4 h-4" />
                            <span className="text-sm font-medium">Quizzes</span>
                        </div>
                        <div className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                            {stats.quizzesTaken}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl p-4 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">Avg Score</span>
                        </div>
                        <div className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                            {stats.avgScore}%
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl p-4 border border-orange-500/20">
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-medium">Streak</span>
                        </div>
                        <div className="text-2xl font-bold text-surface-900 dark:text-surface-100">
                            {stats.streak} 🔥
                        </div>
                    </div>
                </div>

                {/* Quiz Setup Card */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
                        Generate a Quiz
                    </h2>

                    {/* Source Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Quiz Source
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setContentSource('notes')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${contentSource === 'notes'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                                    }`}
                            >
                                <BookOpen className="w-4 h-4 inline mr-2" />
                                From Notes
                            </button>
                            <button
                                onClick={() => setContentSource('topic')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${contentSource === 'topic'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                                    }`}
                            >
                                <Sparkles className="w-4 h-4 inline mr-2" />
                                From Topic
                            </button>
                        </div>
                    </div>

                    {/* Notes Selection */}
                    {contentSource === 'notes' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Select a Note
                            </label>
                            <select
                                value={selectedNoteId || ''}
                                onChange={(e) => setSelectedNoteId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {recentNotes.map(note => (
                                    <option key={note.id} value={note.id}>
                                        {note.title || 'Untitled Note'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Topic Input */}
                    {contentSource === 'topic' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Enter a Topic
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Photosynthesis, World War II, Linear Algebra..."
                                className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <button
                        onClick={generateQuiz}
                        disabled={isGenerating || (contentSource === 'topic' && !topic.trim())}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating Quiz...
                            </>
                        ) : (
                            <>
                                <Brain className="w-5 h-5" />
                                Generate Quiz
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Quiz Complete Screen
    if (quizComplete) {
        const score = getScore();
        const correctCount = answers.filter(a => a.isCorrect).length;

        return (
            <div className="p-6 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 text-center"
                >
                    <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${score >= 80 ? 'bg-green-100 dark:bg-green-900/30' :
                            score >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                'bg-red-100 dark:bg-red-900/30'
                        }`}>
                        {score >= 80 ? (
                            <Trophy className="w-12 h-12 text-green-600 dark:text-green-400" />
                        ) : score >= 60 ? (
                            <Award className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
                        ) : (
                            <Target className="w-12 h-12 text-red-600 dark:text-red-400" />
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
                        {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good Job!' : 'Keep Practicing!'}
                    </h2>

                    <p className="text-surface-600 dark:text-surface-400 mb-6">
                        You scored <span className="font-bold text-purple-600">{score}%</span>
                    </p>

                    <div className="flex justify-center gap-6 mb-8">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-600">{correctCount}</div>
                            <div className="text-sm text-surface-500">Correct</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-600">
                                {quizData.questions.length - correctCount}
                            </div>
                            <div className="text-sm text-surface-500">Incorrect</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">
                                {quizData.questions.length}
                            </div>
                            <div className="text-sm text-surface-500">Total</div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={resetQuiz}
                            className="px-6 py-3 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            New Quiz
                        </button>
                        <button
                            onClick={() => setQuizComplete(false)}
                            className="px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            <BookOpen className="w-4 h-4" />
                            Review Answers
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Active Quiz Screen
    const currentQuestion = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-sm text-surface-600 dark:text-surface-400 mb-2">
                    <span>Question {currentQuestionIndex + 1} of {quizData.questions.length}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6 mb-6"
            >
                <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-6">
                    {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = idx === currentQuestion.correctAnswer;
                        const showCorrectness = showResult;

                        return (
                            <motion.button
                                key={idx}
                                onClick={() => handleAnswerSelect(idx)}
                                disabled={showResult}
                                whileHover={!showResult ? { scale: 1.01 } : {}}
                                whileTap={!showResult ? { scale: 0.99 } : {}}
                                className={`w-full p-4 rounded-xl text-left transition-all border-2 ${showCorrectness
                                        ? isCorrect
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : isSelected
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-surface-200 dark:border-surface-600'
                                        : isSelected
                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                            : 'border-surface-200 dark:border-surface-600 hover:border-purple-300 dark:hover:border-purple-700'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${showCorrectness
                                            ? isCorrect
                                                ? 'bg-green-500 text-white'
                                                : isSelected
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-400'
                                            : isSelected
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-surface-200 dark:bg-surface-600 text-surface-600 dark:text-surface-400'
                                        }`}>
                                        {showCorrectness ? (
                                            isCorrect ? <CheckCircle className="w-5 h-5" /> :
                                                isSelected ? <XCircle className="w-5 h-5" /> :
                                                    String.fromCharCode(65 + idx)
                                        ) : String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className={`flex-1 ${showCorrectness && isCorrect
                                            ? 'text-green-700 dark:text-green-300 font-medium'
                                            : showCorrectness && isSelected && !isCorrect
                                                ? 'text-red-700 dark:text-red-300'
                                                : 'text-surface-700 dark:text-surface-300'
                                        }`}>
                                        {option}
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                    {showResult && currentQuestion.explanation && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        >
                            <div className="flex gap-2 text-blue-700 dark:text-blue-300">
                                <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm">{currentQuestion.explanation}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-3">
                {!showResult ? (
                    <button
                        onClick={submitAnswer}
                        disabled={selectedAnswer === null}
                        className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Submit Answer
                    </button>
                ) : (
                    <button
                        onClick={nextQuestion}
                        className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {currentQuestionIndex < quizData.questions.length - 1 ? (
                            <>
                                Next Question
                                <ArrowRight className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                See Results
                                <Trophy className="w-4 h-4" />
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default QuizPage;
