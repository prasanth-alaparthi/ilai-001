import React, { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const QuizComponent = ({ quiz, onComplete }) => {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleSelect = (qId, option) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [qId]: option }));
    };

    const handleSubmit = () => {
        let correctCount = 0;
        quiz.questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });
        const finalScore = Math.round((correctCount / quiz.questions.length) * 100);
        setScore(finalScore);
        setSubmitted(true);
        if (onComplete) onComplete(finalScore);
    };

    if (!quiz || !quiz.questions) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{quiz.title}</h3>

            <div className="space-y-6">
                {quiz.questions.map((q, idx) => {
                    const isCorrect = submitted && answers[q.id] === q.correctAnswer;
                    const isWrong = submitted && answers[q.id] !== q.correctAnswer;

                    return (
                        <div key={q.id} className="space-y-3">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                {idx + 1}. {q.questionText}
                            </p>
                            <div className="space-y-2">
                                {q.options.map(opt => (
                                    <button
                                        key={opt}
                                        onClick={() => handleSelect(q.id, opt)}
                                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${answers[q.id] === opt
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            } ${submitted && opt === q.correctAnswer ? '!border-green-500 !bg-green-50 !text-green-700' : ''}
                                          ${submitted && answers[q.id] === opt && opt !== q.correctAnswer ? '!border-red-500 !bg-red-50 !text-red-700' : ''}
                                        `}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                            {submitted && (
                                <div className={`text-sm flex items-center ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                    {isCorrect ? <CheckCircleIcon className="w-5 h-5 mr-1" /> : <XCircleIcon className="w-5 h-5 mr-1" />}
                                    {isCorrect ? 'Correct!' : `Incorrect. ${q.explanation}`}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {!submitted && (
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length !== quiz.questions.length}
                    className="mt-6 w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-xl font-bold transition-colors"
                >
                    Submit Quiz
                </button>
            )}

            {submitted && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Score: {score}%</p>
                </div>
            )}
        </div>
    );
};

export default QuizComponent;
