import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { notesService } from '../services/notesService';
import FlashcardModal from './modals/FlashcardModal';
import QuizModal from './modals/QuizModal';
import { FiCpu, FiBookOpen, FiLayers, FiHelpCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const AiMenu = ({ editor, variant = 'default' }) => {
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const [quiz, setQuiz] = useState([]);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  if (!editor) {
    return null;
  }

  const handleSummarize = async () => {
    const content = editor.getText();
    if (!content) return;

    setIsLoading(true);
    setModalTitle('Summary');
    try {
      const response = await notesService.summarize(content);
      setModalContent(response.summary);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error summarizing content:', error);
      setModalContent('Could not generate summary.');
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplain = async () => {
    const content = editor.getText();
    if (!content) return;

    setIsLoading(true);
    setModalTitle('Explanation');
    try {
      const response = await notesService.explain(content, 'easy');
      setModalContent(response.explanation);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error explaining content:', error);
      setModalContent('Could not generate explanation.');
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlashcards = async () => {
    const content = editor.getText();
    if (!content) return;

    setIsLoading(true);
    try {
      const response = await notesService.flashcards(content);
      const flashcardsData = typeof response.flashcardsJson === 'string'
        ? JSON.parse(response.flashcardsJson)
        : response.flashcardsJson;
      setFlashcards(flashcardsData);
      setIsFlashcardModalOpen(true);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setModalTitle('Error');
      setModalContent('Could not generate flashcards.');
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuiz = async () => {
    const content = editor.getText();
    if (!content) return;

    setIsLoading(true);
    try {
      const response = await notesService.generateQuiz(content);
      const quizData = typeof response.quizJson === 'string'
        ? JSON.parse(response.quizJson)
        : response.quizJson;
      setQuiz(quizData);
      setIsQuizModalOpen(true);
    } catch (error) {
      console.error('Error generating quiz:', error);
      setModalTitle('Error');
      setModalContent('Could not generate quiz.');
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent('');
    setModalTitle('');
  };

  const AiButton = ({ onClick, icon: Icon, label }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-800 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
    </button>
  );

  const containerClass = variant === 'ribbon'
    ? "flex flex-wrap gap-2"
    : "flex flex-wrap gap-2 p-2 bg-surface-50 dark:bg-surface-900/50 rounded-xl border border-surface-100 dark:border-surface-800";

  return (
    <>
      <div className={containerClass}>
        <div className="flex items-center gap-2 px-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
          <FiCpu className="w-4 h-4" />
          AI Tools
        </div>
        <div className="w-px h-6 bg-surface-200 dark:bg-surface-700 mx-1" />
        <AiButton onClick={handleSummarize} icon={FiBookOpen} label="Summarize" />
        <AiButton onClick={handleExplain} icon={FiHelpCircle} label="Explain" />
        <AiButton onClick={handleFlashcards} icon={FiLayers} label="Flashcards" />
        <AiButton onClick={handleQuiz} icon={FiCpu} label="Quiz Me" />
      </div>

      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white dark:bg-surface-900 p-6 rounded-2xl shadow-2xl max-w-2xl w-full border border-surface-200 dark:border-surface-700 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100">{modalTitle}</h3>
                  <button onClick={closeModal} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200">
                    ✕
                  </button>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-surface-600 dark:text-surface-300">
                  {modalContent.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-700 dark:text-surface-200 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {isFlashcardModalOpen && createPortal(
        <FlashcardModal
          flashcards={flashcards}
          onClose={() => setIsFlashcardModalOpen(false)}
        />,
        document.body
      )}

      {isQuizModalOpen && createPortal(
        <QuizModal
          quiz={quiz}
          onClose={() => setIsQuizModalOpen(false)}
        />,
        document.body
      )}
    </>
  );
};

export default AiMenu;
