import React from 'react';

const CodeEditor = ({ code, onChange, language = 'python' }) => {
    return (
        <div className="h-full w-full border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase">{language} Editor (Simple Mode)</span>
                <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
            </div>
            <textarea
                className="flex-1 w-full p-4 font-mono text-sm bg-gray-900 text-gray-100 outline-none resize-none"
                value={code}
                onChange={(e) => onChange(e.target.value)}
                spellCheck="false"
            />
        </div>
    );
};

export default CodeEditor;
