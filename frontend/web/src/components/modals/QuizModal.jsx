import React, { useState } from 'react';

const QuizModal = ({ quiz, onClose }) => {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!quiz || quiz.length === 0) {
    return null;
  }

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers({
      ...answers,
      [questionIndex]: answer,
    });
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const score = quiz.reduce((acc, question, index) => {
    return acc + (answers[index] === question.answer ? 1 : 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-900 p-6 rounded-2xl shadow-2xl max-w-2xl w-full border border-surface-200 dark:border-surface-700 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100">Quiz Me</h3>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex-grow pr-2 space-y-6">
          {quiz.map((q, qIndex) => (
            <div key={qIndex} className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-100 dark:border-surface-800">
              <p className="font-medium text-surface-900 dark:text-surface-100 mb-3 text-lg">{qIndex + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((option, oIndex) => {
                  const isSelected = answers[qIndex] === option;
                  const isCorrect = option === q.answer;
                  const isWrong = isSelected && !isCorrect;

                  let optionClass = "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ";

                  if (showResults) {
                    if (isCorrect) optionClass += "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300";
                    else if (isWrong) optionClass += "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300";
                    else optionClass += "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 opacity-60";
                  } else {
                    if (isSelected) optionClass += "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 ring-1 ring-primary-200 dark:ring-primary-800";
                    else optionClass += "bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700";
                  }

                  return (
                    <label key={oIndex} className={optionClass}>
                      <input
                        type="radio"
                        name={`question-${qIndex}`}
                        value={option}
                        checked={isSelected}
                        onChange={() => !showResults && handleAnswerChange(qIndex, option)}
                        disabled={showResults}
                        className="w-4 h-4 text-primary-600 border-surface-300 focus:ring-primary-500"
                      />
                      <span className="text-sm text-surface-700 dark:text-surface-200">{option}</span>
                      {showResults && isCorrect && (
                        <span className="ml-auto text-xs font-bold text-green-600 dark:text-green-400">Correct</span>
                      )}
                      {showResults && isWrong && (
                        <span className="ml-auto text-xs font-bold text-red-600 dark:text-red-400">Your Answer</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {showResults && (
                <div className="mt-3 text-sm text-surface-500 dark:text-surface-400 italic bg-white dark:bg-surface-800 p-3 rounded-lg border border-surface-100 dark:border-surface-700">
                  <span className="font-semibold not-italic text-surface-700 dark:text-surface-300">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center flex-shrink-0">
          {showResults ? (
            <div className="text-lg font-bold text-surface-900 dark:text-surface-100">
              Score: <span className={score === quiz.length ? "text-green-600" : "text-primary-600"}>{score}</span> / {quiz.length}
            </div>
          ) : (
            <div className="text-sm text-surface-500">
              Answer all questions to submit
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            {!showResults && (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < quiz.length}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Submit Answers
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizModal;
