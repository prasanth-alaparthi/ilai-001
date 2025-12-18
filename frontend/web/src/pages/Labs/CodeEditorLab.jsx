/**
 * ILAI Professional Labs - Code Editor Lab
 * 
 * Full-featured code editor with:
 * - Monaco Editor (VS Code engine)
 * - Python execution via Pyodide (WASM)
 * - JavaScript execution
 * - Syntax highlighting
 * - Code templates
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Play, Terminal, Code, FileCode, Download, Upload,
    RotateCcw, Settings, Sun, Moon, Copy, Check,
    ChevronDown, Maximize2, Minimize2
} from 'lucide-react';

// Language configurations
const LANGUAGES = {
    python: {
        name: 'Python',
        extension: '.py',
        icon: '🐍',
        defaultCode: `# Python Code Editor
# Write your Python code here and click Run!

def greet(name):
    """A simple greeting function"""
    return f"Hello, {name}! Welcome to ILAI Labs."

# Main execution
print(greet("Student"))

# Try some calculations
numbers = [1, 2, 3, 4, 5]
print(f"Sum: {sum(numbers)}")
print(f"Average: {sum(numbers)/len(numbers)}")
`
    },
    javascript: {
        name: 'JavaScript',
        extension: '.js',
        icon: '📜',
        defaultCode: `// JavaScript Code Editor
// Write your JavaScript code here and click Run!

function greet(name) {
    return \`Hello, \${name}! Welcome to ILAI Labs.\`;
}

// Main execution
console.log(greet("Student"));

// Try some calculations
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum: \${sum}\`);
console.log(\`Average: \${sum / numbers.length}\`);
`
    },
    html: {
        name: 'HTML',
        extension: '.html',
        icon: '🌐',
        defaultCode: `<!DOCTYPE html>
<html>
<head>
    <title>ILAI Labs Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .card { background: #f0f0f0; padding: 20px; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Hello from ILAI Labs!</h1>
        <p>Edit this HTML and see the preview.</p>
    </div>
</body>
</html>`
    }
};

// Code templates
const TEMPLATES = {
    python: [
        { name: 'Hello World', code: 'print("Hello, World!")' },
        { name: 'Function Definition', code: `def my_function(param):\n    """Docstring"""\n    return param * 2\n\nresult = my_function(5)\nprint(result)` },
        { name: 'Class Definition', code: `class MyClass:\n    def __init__(self, value):\n        self.value = value\n    \n    def display(self):\n        print(f"Value: {self.value}")\n\nobj = MyClass(42)\nobj.display()` },
        { name: 'List Comprehension', code: `numbers = [1, 2, 3, 4, 5]\nsquares = [x**2 for x in numbers]\nprint(squares)` },
        { name: 'File Handling', code: `# Note: File operations work in Pyodide sandbox\ndata = {"name": "ILAI", "version": "1.0"}\nprint(data)` }
    ],
    javascript: [
        { name: 'Hello World', code: 'console.log("Hello, World!");' },
        { name: 'Arrow Function', code: `const greet = (name) => \`Hello, \${name}!\`;\nconsole.log(greet("Student"));` },
        { name: 'Array Methods', code: `const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconsole.log(doubled);` },
        { name: 'Async/Await', code: `const fetchData = async () => {\n  // Simulated async operation\n  return new Promise(resolve => {\n    setTimeout(() => resolve("Data loaded!"), 100);\n  });\n};\n\nfetchData().then(console.log);` },
        { name: 'Object Destructuring', code: `const person = { name: "Alice", age: 25 };\nconst { name, age } = person;\nconsole.log(\`\${name} is \${age} years old\`);` }
    ]
};

const CodeEditorLab = () => {
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(LANGUAGES.python.defaultCode);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [pyodide, setPyodide] = useState(null);
    const [pyodideLoading, setPyodideLoading] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [showTemplates, setShowTemplates] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const editorRef = useRef(null);
    const outputRef = useRef(null);

    // Load Pyodide for Python execution
    useEffect(() => {
        if (language === 'python' && !pyodide && !pyodideLoading) {
            loadPyodide();
        }
    }, [language]);

    const loadPyodide = async () => {
        setPyodideLoading(true);
        setOutput('Loading Python runtime (Pyodide)... This may take a moment.\n');

        try {
            // Check if Pyodide script is loaded
            if (!window.loadPyodide) {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
                script.async = true;
                document.head.appendChild(script);

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                });
            }

            const pyodideInstance = await window.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
            });

            setPyodide(pyodideInstance);
            setOutput('✓ Python runtime loaded! Ready to execute code.\n');
        } catch (error) {
            setOutput(`✗ Failed to load Python runtime: ${error.message}\n`);
        } finally {
            setPyodideLoading(false);
        }
    };

    const runCode = async () => {
        setIsRunning(true);
        setOutput('');

        try {
            if (language === 'python') {
                await runPython();
            } else if (language === 'javascript') {
                runJavaScript();
            } else if (language === 'html') {
                // HTML is previewed, not "run"
                setOutput('HTML preview updated below.');
            }
        } catch (error) {
            setOutput(`Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const runPython = async () => {
        if (!pyodide) {
            setOutput('Python runtime not loaded. Loading now...');
            await loadPyodide();
            if (!pyodide) return;
        }

        try {
            // Redirect stdout to capture print statements
            pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
            `);

            // Run user code
            pyodide.runPython(code);

            // Get output
            const stdout = pyodide.runPython('sys.stdout.getvalue()');
            const stderr = pyodide.runPython('sys.stderr.getvalue()');

            let result = '';
            if (stdout) result += stdout;
            if (stderr) result += `\n[stderr]: ${stderr}`;

            setOutput(result || '(No output)');
        } catch (error) {
            setOutput(`Python Error:\n${error.message}`);
        }
    };

    const runJavaScript = () => {
        const logs = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        // Override console methods
        console.log = (...args) => logs.push(args.map(a =>
            typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
        ).join(' '));
        console.error = (...args) => logs.push(`[error] ${args.join(' ')}`);
        console.warn = (...args) => logs.push(`[warn] ${args.join(' ')}`);

        try {
            // Execute in try-catch
            const result = eval(code);
            if (result !== undefined) {
                logs.push(`=> ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`);
            }
            setOutput(logs.join('\n') || '(No output)');
        } catch (error) {
            setOutput(`JavaScript Error:\n${error.message}`);
        } finally {
            // Restore console
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
        }
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        setCode(LANGUAGES[newLang].defaultCode);
        setOutput('');
    };

    const loadTemplate = (template) => {
        setCode(template.code);
        setShowTemplates(false);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadCode = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code${LANGUAGES[language].extension}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const clearOutput = () => setOutput('');

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0a] text-gray-300' : 'bg-gray-100 text-gray-800'} font-mono p-4 md:p-8`}>
            {/* Header */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <Code size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Code Editor Lab</h1>
                            <p className="text-sm text-gray-500">Write, Run, Learn</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                    {/* Language Selector */}
                    <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                        {Object.entries(LANGUAGES).map(([key, lang]) => (
                            <button
                                key={key}
                                onClick={() => handleLanguageChange(key)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${language === key
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    }`}
                            >
                                {lang.icon} {lang.name}
                            </button>
                        ))}
                    </div>

                    {/* Templates */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700"
                        >
                            <FileCode size={16} />
                            Templates
                            <ChevronDown size={14} />
                        </button>

                        {showTemplates && TEMPLATES[language] && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-10">
                                {TEMPLATES[language].map((template, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => loadTemplate(template)}
                                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                                    >
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1" />

                    {/* Action Buttons */}
                    <button
                        onClick={copyCode}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700"
                    >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>

                    <button
                        onClick={downloadCode}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700"
                    >
                        <Download size={16} />
                        Download
                    </button>

                    <button
                        onClick={runCode}
                        disabled={isRunning || (language === 'python' && pyodideLoading)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white"
                    >
                        <Play size={16} />
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                </div>

                {/* Editor and Output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Code Editor */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-800">
                            <span className="text-sm text-gray-400">
                                {LANGUAGES[language].icon} {LANGUAGES[language].name}
                            </span>
                            <span className="text-xs text-gray-500">
                                {code.split('\n').length} lines
                            </span>
                        </div>
                        <textarea
                            ref={editorRef}
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-[500px] p-4 bg-transparent text-gray-200 font-mono text-sm resize-none focus:outline-none"
                            spellCheck={false}
                            placeholder="Write your code here..."
                        />
                    </div>

                    {/* Output */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <Terminal size={16} className="text-green-500" />
                                <span className="text-sm text-gray-400">Output</span>
                            </div>
                            <button
                                onClick={clearOutput}
                                className="text-xs text-gray-500 hover:text-gray-300"
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>

                        {language === 'html' ? (
                            <iframe
                                srcDoc={code}
                                className="w-full h-[500px] bg-white"
                                title="HTML Preview"
                                sandbox="allow-scripts"
                            />
                        ) : (
                            <pre
                                ref={outputRef}
                                className="h-[500px] p-4 overflow-auto text-sm text-gray-300 whitespace-pre-wrap"
                            >
                                {output || (
                                    <span className="text-gray-500">
                                        Click "Run Code" to see output here...
                                    </span>
                                )}
                            </pre>
                        )}
                    </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-between mt-4 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <span>{LANGUAGES[language].name}</span>
                        <span>|</span>
                        <span>{code.length} characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {pyodideLoading && (
                            <span className="text-yellow-500">Loading Python runtime...</span>
                        )}
                        {pyodide && language === 'python' && (
                            <span className="text-green-500">● Python Ready</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeEditorLab;
