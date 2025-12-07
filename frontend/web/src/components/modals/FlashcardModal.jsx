import React, { useState } from 'react';

const FlashcardModal = ({ flashcards, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return null;
  }

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-900 p-6 rounded-2xl shadow-2xl max-w-lg w-full border border-surface-200 dark:border-surface-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100">Flashcards</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors">
            ✕
          </button>
        </div>

        <div className="relative w-full h-64 perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 flex flex-col items-center justify-center p-6 text-center shadow-sm group-hover:shadow-md transition-shadow">
              <div className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4">Question</div>
              <div className="text-lg font-medium text-surface-900 dark:text-surface-100">{currentCard.q}</div>
              <div className="absolute bottom-4 text-xs text-surface-400">Click to flip</div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800 flex flex-col items-center justify-center p-6 text-center shadow-sm group-hover:shadow-md transition-shadow">
              <div className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-4">Answer</div>
              <div className="text-lg font-medium text-surface-900 dark:text-surface-100">{currentCard.a}</div>
              <div className="absolute bottom-4 text-xs text-surface-400">Click to flip back</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>

          <div className="text-sm font-medium text-surface-500 dark:text-surface-400">
            Card {currentIndex + 1} of {flashcards.length}
          </div>

          <button
            onClick={handleNext}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Next Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardModal;
