import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, BookOpen, Clock, CheckCircle, XCircle, ArrowRight,
  RotateCcw, TrendingUp, Calendar, Loader2, Plus, Brain
} from "lucide-react";
import { flashcardService, RATINGS, freeSearchService } from "../services/freeSearchService";
import apiClient from "../services/apiClient";

export default function FlashcardsPage() {
  // State
  const [mode, setMode] = useState('study'); // 'study' | 'create' | 'stats'
  const [dueCards, setDueCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ due: 0, reviewed: 0, streak: 0 });
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const [showComplete, setShowComplete] = useState(false);

  // Create mode
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadDueCards();
    loadStats();
    loadNotes();
  }, []);

  const loadDueCards = async () => {
    setLoading(true);
    try {
      const cards = await flashcardService.getDueCards();
      setDueCards(cards || []);
      if (cards?.length > 0) {
        setCurrentIndex(0);
        setIsFlipped(false);
      }
    } catch (err) {
      console.error('Failed to load due cards:', err);
      // Generate mock cards if API fails
      setDueCards([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await flashcardService.getStats();
      setStats(statsData || { due: 0, reviewed: 0, streak: 0 });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadNotes = async () => {
    try {
      const res = await apiClient.get('/notes?sort=updatedAt,desc&size=20');
      const items = res.data?.content || res.data || [];
      setNotes(items);
      if (items.length > 0) {
        setSelectedNoteId(items[0].id);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  };

  const handleReview = async (rating) => {
    const currentCard = dueCards[currentIndex];

    // Update session stats
    if (rating >= RATINGS.GOOD) {
      setSessionStats(s => ({ ...s, correct: s.correct + 1 }));
    } else {
      setSessionStats(s => ({ ...s, incorrect: s.incorrect + 1 }));
    }

    // Submit review to backend
    try {
      await flashcardService.submitReview(currentCard.id, rating);
    } catch (err) {
      console.error('Failed to submit review:', err);
    }

    // Move to next card
    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setShowComplete(true);
    }
  };

  const generateFlashcards = async () => {
    if (!selectedNoteId) return;

    setIsGenerating(true);
    try {
      const noteRes = await apiClient.get(`/notes/${selectedNoteId}`);
      const content = noteRes.data?.content;
      const textContent = typeof content === 'string' ? content : JSON.stringify(content);

      const res = await apiClient.post('/ai/flashcards', { content: textContent });
      const newCards = res.data?.flashcards;

      // Parse and add to cards
      if (newCards) {
        const parsed = typeof newCards === 'string' ? JSON.parse(newCards) : newCards;
        setDueCards(prev => [...prev, ...parsed]);
      }

      setMode('study');
    } catch (err) {
      console.error('Failed to generate flashcards:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const restartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowComplete(false);
    setSessionStats({ correct: 0, incorrect: 0 });
    loadDueCards();
  };

  // Render header with stats
  const renderHeader = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <Zap className="w-8 h-8 text-amber-500" />
          Flashcards
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('study')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'study'
                ? 'bg-amber-600 text-white'
                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
              }`}
          >
            <BookOpen className="w-4 h-4 inline mr-1" />
            Study
          </button>
          <button
            onClick={() => setMode('create')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'create'
                ? 'bg-amber-600 text-white'
                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
              }`}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Create
          </button>
          <button
            onClick={() => setMode('stats')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === 'stats'
                ? 'bg-amber-600 text-white'
                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
              }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Stats
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{dueCards.length}</div>
          <div className="text-xs text-amber-700 dark:text-amber-300">Due Today</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.reviewed || 0}</div>
          <div className="text-xs text-green-700 dark:text-green-300">Reviewed</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.streak || 0}🔥</div>
          <div className="text-xs text-purple-700 dark:text-purple-300">Day Streak</div>
        </div>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        {renderHeader()}
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-3" />
          <p className="text-surface-500">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  // Create mode
  if (mode === 'create') {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        {renderHeader()}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Generate from Notes
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Select a Note
            </label>
            <select
              value={selectedNoteId || ''}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-900 dark:text-surface-100"
            >
              {notes.map(note => (
                <option key={note.id} value={note.id}>
                  {note.title || 'Untitled Note'}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateFlashcards}
            disabled={isGenerating || !selectedNoteId}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate Flashcards
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Stats mode
  if (mode === 'stats') {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        {renderHeader()}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-6">
            Your Progress
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-surface-900 dark:text-surface-100">Cards Mastered</div>
                  <div className="text-sm text-surface-500">High confidence recall</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.mastered || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-medium text-surface-900 dark:text-surface-100">Learning</div>
                  <div className="text-sm text-surface-500">Still reviewing</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {stats.learning || 0}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-surface-900 dark:text-surface-100">Study Days</div>
                  <div className="text-sm text-surface-500">Total days studied</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.studyDays || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Session complete
  if (showComplete) {
    const accuracy = sessionStats.correct + sessionStats.incorrect > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100)
      : 0;

    return (
      <div className="p-8 max-w-2xl mx-auto">
        {renderHeader()}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
            Session Complete!
          </h2>
          <p className="text-surface-500 mb-6">
            You reviewed {sessionStats.correct + sessionStats.incorrect} cards
          </p>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{sessionStats.correct}</div>
              <div className="text-sm text-surface-500">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{sessionStats.incorrect}</div>
              <div className="text-sm text-surface-500">Needs Review</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{accuracy}%</div>
              <div className="text-sm text-surface-500">Accuracy</div>
            </div>
          </div>

          <button
            onClick={restartSession}
            className="px-6 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Review More
          </button>
        </motion.div>
      </div>
    );
  }

  // No cards due
  if (dueCards.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        {renderHeader()}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-8 text-center">
          <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
            All caught up!
          </h2>
          <p className="text-surface-500 mb-6">
            No flashcards due for review. Create new ones from your notes!
          </p>
          <button
            onClick={() => setMode('create')}
            className="px-6 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            Create Flashcards
          </button>
        </div>
      </div>
    );
  }

  // Study mode - main flashcard UI
  const currentCard = dueCards[currentIndex];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {renderHeader()}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-surface-500 mb-1">
          <span>Card {currentIndex + 1} of {dueCards.length}</span>
          <span>{Math.round(((currentIndex + 1) / dueCards.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, rotateY: 0 }}
        animate={{ opacity: 1, rotateY: isFlipped ? 180 : 0 }}
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative h-64 cursor-pointer perspective-1000 mb-6"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          className={`absolute inset-0 bg-white dark:bg-surface-800 rounded-2xl border-2 border-surface-200 dark:border-surface-600 p-6 flex items-center justify-center text-center shadow-lg transition-all duration-300 ${isFlipped ? 'opacity-0' : 'opacity-100'
            }`}
        >
          <div>
            <div className="text-xs text-surface-400 uppercase tracking-wide mb-3">Question</div>
            <div className="text-xl font-medium text-surface-900 dark:text-surface-100">
              {currentCard?.front || currentCard?.question || 'No question'}
            </div>
            <div className="text-sm text-surface-400 mt-4">Tap to flip</div>
          </div>
        </div>

        <div
          className={`absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-700 p-6 flex items-center justify-center text-center shadow-lg transition-all duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0'
            }`}
          style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
        >
          <div>
            <div className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-3">Answer</div>
            <div className="text-xl font-medium text-surface-900 dark:text-surface-100">
              {currentCard?.back || currentCard?.answer || 'No answer'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rating buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-4 gap-2"
          >
            <button
              onClick={() => handleReview(RATINGS.AGAIN)}
              className="py-3 px-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              <XCircle className="w-5 h-5 mx-auto mb-1" />
              Again
            </button>
            <button
              onClick={() => handleReview(RATINGS.HARD)}
              className="py-3 px-2 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
            >
              <Clock className="w-5 h-5 mx-auto mb-1" />
              Hard
            </button>
            <button
              onClick={() => handleReview(RATINGS.GOOD)}
              className="py-3 px-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium text-sm hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              <CheckCircle className="w-5 h-5 mx-auto mb-1" />
              Good
            </button>
            <button
              onClick={() => handleReview(RATINGS.EASY)}
              className="py-3 px-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Zap className="w-5 h-5 mx-auto mb-1" />
              Easy
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {!isFlipped && (
        <div className="text-center">
          <button
            onClick={() => setIsFlipped(true)}
            className="px-8 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
          >
            Show Answer
          </button>
        </div>
      )}
    </div>
  );
}