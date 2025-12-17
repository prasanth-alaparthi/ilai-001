import React, { useState } from 'react';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/solid';
import labsService from '../../services/labsService';

const AiSolver = ({ type = 'math' }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setResponse('');

        try {
            let result;
            if (type === 'code' || type === 'math') {
                result = await labsService.solveEquation(query);
            } else if (type === 'chemistry') {
                result = await labsService.balanceReaction(query);
            } else {
                result = await labsService.explainConcept(query);
            }
            setResponse(result.answer || result.explanation || result);
        } catch (error) {
            console.error('AI solver error:', error);
            setResponse('Sorry, I could not process your request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-[400px]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center text-purple-600 dark:text-purple-400">
                <SparklesIcon className="w-5 h-5 mr-2" />
                <h3 className="font-bold">AI Assistant</h3>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {response ? (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {response}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        Ask me to solve an equation or explain a concept!
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={type === 'math' ? "Enter equation..." : "Ask a question..."}
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                    />
                    <button
                        onClick={handleAsk}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiSolver;
