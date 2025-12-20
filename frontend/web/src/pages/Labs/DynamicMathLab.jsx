/**
 * ILAI Dynamic Math Lab - Apple Math Notes Style
 * 
 * Features:
 * - MathLive LaTeX input with auto-solve on "="
 * - Local solver (Math.js) for BTech-level math
 * - Pro solver (Groq + SymPy) for calculus & chemistry
 * - Variable context tracking with auto-update
 * - Step-by-step solution explanations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator, Plus, Trash2, RefreshCw, Sparkles, BookOpen,
    ChevronDown, ChevronUp, Beaker, Atom, Variable, Sigma,
    Lightbulb, Zap, Clock, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { create, all } from 'mathjs';
import 'mathlive';

// Initialize Math.js with all features
const math = create(all);

// Configure Math.js
math.config({
    number: 'BigNumber',
    precision: 64
});

// Apple Blue color for results
const RESULT_COLOR = '#007AFF';
const ERROR_COLOR = '#FF3B30';

/**
 * Custom Hook: useMathSolver
 * Handles local (Math.js) and Pro (API) solving
 */
const useMathSolver = () => {
    const [variables, setVariables] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // Check if expression needs Pro solver
    const needsProSolver = (expr) => {
        const proPatterns = [
            /diff\(/i, /integrate\(/i, /derivative\(/i, /integral\(/i,
            /limit\(/i, /taylor\(/i, /laplace\(/i,
            /[A-Z][a-z]?\d*\s*\+\s*[A-Z][a-z]?\d*\s*=/, // Chemistry: H2 + O2 =
            /balance\(/i, /sympy\(/i
        ];
        return proPatterns.some(p => p.test(expr));
    };

    // Local solve with Math.js
    const solveLocal = useCallback((expression, scope = {}) => {
        try {
            // Merge with stored variables
            const fullScope = { ...variables, ...scope };

            // Clean expression - remove trailing = for evaluation
            let cleanExpr = expression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/\^/g, '^')
                .replace(/²/g, '^2')
                .replace(/³/g, '^3')
                .replace(/√/g, 'sqrt')
                .replace(/π/g, 'pi')
                .replace(/\s*=\s*$/, '')  // Remove trailing = for auto-solve
                .trim();

            // Check for variable assignment
            const assignMatch = cleanExpr.match(/^([a-z_]\w*)\s*=\s*(.+)$/i);
            if (assignMatch) {
                const [, varName, valueExpr] = assignMatch;

                // If it ends with just "=", solve for that variable
                if (valueExpr.trim() === '') {
                    // Try to find equation involving this variable and solve
                    return {
                        result: null,
                        steps: ['Enter an expression to solve'],
                        type: 'pending'
                    };
                }

                const value = math.evaluate(valueExpr, fullScope);
                setVariables(prev => ({ ...prev, [varName]: value }));
                return {
                    result: value,
                    steps: [
                        `Define variable: ${varName}`,
                        `Evaluate: ${valueExpr}`,
                        `Result: ${varName} = ${math.format(value, { precision: 10 })}`
                    ],
                    type: 'assignment',
                    variable: varName
                };
            }

            // Regular evaluation
            const result = math.evaluate(cleanExpr, fullScope);

            // Generate steps based on expression type
            const steps = generateSteps(cleanExpr, result, fullScope);

            return {
                result,
                steps,
                type: 'evaluation',
                latex: formatResultLatex(result)
            };
        } catch (error) {
            return {
                result: null,
                error: error.message,
                steps: [`Error: ${error.message}`],
                type: 'error'
            };
        }
    }, [variables]);

    // Generate step-by-step explanation
    const generateSteps = (expr, result, scope) => {
        const steps = [];

        // Check for matrix
        if (expr.includes('[') && expr.includes(';')) {
            steps.push('📐 Matrix Operation Detected');
            steps.push('Parse matrix notation: [row1; row2; ...]');
            steps.push('Apply operation element-wise or use matrix multiplication');
        }
        // Check for equation solving
        else if (expr.includes('solve(')) {
            steps.push('🔍 Equation Solver');
            steps.push('Move terms to one side');
            steps.push('Apply algebraic rules');
            steps.push('Isolate the variable');
        }
        // Check for units
        else if (/\d+\s*(m|kg|s|N|J|W|Hz|Pa|A|V|Ω)/i.test(expr)) {
            steps.push('📏 Unit Calculation');
            steps.push('Parse values with units');
            steps.push('Apply dimensional analysis');
            steps.push('Convert to consistent units if needed');
        }
        // Check for function
        else if (/sin|cos|tan|log|ln|sqrt|exp/.test(expr)) {
            steps.push('📊 Mathematical Function');
            steps.push('Identify function type');
            steps.push('Evaluate inner expression first');
            steps.push('Apply function transformation');
        }
        // Default arithmetic
        else {
            steps.push('🧮 Arithmetic Expression');
            // Show variable substitution if any
            Object.entries(scope).forEach(([k, v]) => {
                if (expr.includes(k)) {
                    steps.push(`Substitute ${k} = ${v}`);
                }
            });
            steps.push('Apply order of operations (PEMDAS)');
        }

        steps.push(`✓ Result: ${formatResult(result)}`);
        return steps;
    };

    // Format result for display
    const formatResult = (result) => {
        if (result === null || result === undefined) return 'undefined';
        if (typeof result === 'object' && result.entries) {
            // Matrix
            return 'Matrix: ' + math.format(result, { precision: 4 });
        }
        if (typeof result === 'object' && result.re !== undefined) {
            // Complex number
            return `${result.re} + ${result.im}i`;
        }
        return math.format(result, { precision: 10 });
    };

    // Format result as LaTeX
    const formatResultLatex = (result) => {
        if (result === null || result === undefined) return '';
        try {
            if (typeof result === 'object' && result.toTex) {
                return result.toTex();
            }
            return math.format(result, { precision: 10 });
        } catch {
            return String(result);
        }
    };

    // Pro solver (API call)
    const solvePro = async (expression, type = 'sympy') => {
        setIsLoading(true);
        try {
            const endpoint = type === 'chemistry'
                ? '/api/chemistry/balance'
                : '/api/physics/solve';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    equation: expression,
                    equation_type: type === 'chemistry' ? 'balance' : 'symbolic',
                    variable: 'x'
                })
            });

            const data = await response.json();

            if (data.success) {
                return {
                    result: data.derivation_latex || data.result,
                    steps: [
                        `🚀 Pro Solver: ${type === 'chemistry' ? 'Chemistry' : 'SymPy'}`,
                        ...(data.assumptions || []).map(a => `Assumption: ${a.name} = ${a.value}`),
                        `Evidence: ${data.evidence || 'Symbolic computation'}`,
                        `✓ Result: ${data.derivation_latex || data.result}`
                    ],
                    type: 'pro',
                    latex: data.derivation_latex
                };
            } else {
                throw new Error(data.error || 'Pro solver failed');
            }
        } catch (error) {
            return {
                result: null,
                error: error.message,
                steps: [`Pro solver error: ${error.message}`],
                type: 'error'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Main solve function
    const solve = useCallback(async (expression) => {
        if (!expression || expression.trim() === '') {
            return { result: null, steps: [], type: 'empty' };
        }

        // Check for chemistry (element symbols + equals)
        if (/^[A-Z][a-z]?\d*(\s*\+\s*[A-Z][a-z]?\d*)+\s*=/.test(expression)) {
            return solvePro(expression.replace(/\s*=\s*$/, ''), 'chemistry');
        }

        // Check if needs Pro solver
        if (needsProSolver(expression)) {
            return solvePro(expression, 'sympy');
        }

        // Use local solver
        return solveLocal(expression);
    }, [solveLocal, needsProSolver]);

    return {
        solve,
        variables,
        setVariables,
        isLoading,
        clearVariables: () => setVariables({})
    };
};

/**
 * MathField component - wrapper for MathLive
 */
const MathField = ({ value, onChange, onSubmit, placeholder, disabled }) => {
    const mathFieldRef = useRef(null);
    const callbackRef = useRef({ onChange, onSubmit });

    // Keep callbacks up to date
    useEffect(() => {
        callbackRef.current = { onChange, onSubmit };
    }, [onChange, onSubmit]);

    useEffect(() => {
        const mf = mathFieldRef.current;
        if (!mf) return;

        // Set initial value
        if (value && mf.value !== value) {
            mf.value = value;
        }

        const handleInput = (evt) => {
            const latex = evt.target.value;

            // Call onChange via ref to avoid stale closure
            if (callbackRef.current.onChange) {
                callbackRef.current.onChange(latex);
            }

            // Auto-solve on "=" - call onSubmit via ref
            if (latex.endsWith('=') && callbackRef.current.onSubmit) {
                // Small delay to allow state update
                setTimeout(() => {
                    callbackRef.current.onSubmit(latex);
                }, 10);
            }
        };

        mf.addEventListener('input', handleInput);
        return () => mf.removeEventListener('input', handleInput);
    }, []);

    useEffect(() => {
        if (mathFieldRef.current && mathFieldRef.current.value !== value) {
            mathFieldRef.current.value = value;
        }
    }, [value]);

    return (
        <math-field
            ref={mathFieldRef}
            style={{
                width: '100%',
                fontSize: '20px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #333',
                background: '#1a1a1a',
                color: '#fff',
                outline: 'none',
                '--caret-color': RESULT_COLOR,
                '--selection-background-color': 'rgba(0, 122, 255, 0.3)',
                opacity: disabled ? 0.6 : 1
            }}
            virtual-keyboard-mode="manual"
            smart-mode
        />
    );
};

/**
 * Expression Row - single math expression with result
 */
const ExpressionRow = ({
    id,
    expression,
    result,
    steps,
    type,
    error,
    isLoading,
    onExpressionChange,
    onSolve,
    onDelete,
    showSteps,
    onToggleSteps
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="group relative"
        >
            <div className="flex items-start gap-3 p-4 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
                {/* Expression Input */}
                <div className="flex-1">
                    <MathField
                        value={expression}
                        onChange={(latex) => onExpressionChange(id, latex)}
                        onSubmit={() => onSolve(id)}
                        disabled={isLoading}
                    />

                    {/* Result Display */}
                    {result !== null && type !== 'error' && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mt-2 pl-4 flex items-center gap-2"
                        >
                            <span className="text-gray-500">=</span>
                            <span
                                className="text-xl font-mono font-semibold"
                                style={{ color: RESULT_COLOR }}
                            >
                                {typeof result === 'object' ? JSON.stringify(result) : String(result)}
                            </span>
                            {type === 'pro' && (
                                <Sparkles size={16} className="text-amber-400" />
                            )}
                        </motion.div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 flex items-center gap-2 text-red-400 text-sm"
                        >
                            <AlertCircle size={14} />
                            {error}
                        </motion.div>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-2 flex items-center gap-2 text-blue-400 text-sm"
                        >
                            <Loader2 size={14} className="animate-spin" />
                            Computing with Pro Solver...
                        </motion.div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {steps && steps.length > 0 && (
                        <button
                            onClick={() => onToggleSteps(id)}
                            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                            title="Show steps"
                        >
                            {showSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(id)}
                        className="p-2 rounded-lg hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Step-by-step Explanation */}
            <AnimatePresence>
                {showSteps && steps && steps.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-4 mt-2 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
                            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                                <Lightbulb size={14} className="text-amber-400" />
                                Step-by-Step Solution
                            </div>
                            <div className="space-y-2">
                                {steps.map((step, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-start gap-2 text-sm"
                                    >
                                        <span className="text-gray-500 w-5 flex-shrink-0">
                                            {idx + 1}.
                                        </span>
                                        <span className="text-gray-300">{step}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/**
 * Main Component: DynamicMathLab
 */
const DynamicMathLab = () => {
    const { solve, variables, clearVariables, isLoading } = useMathSolver();
    const [expressions, setExpressions] = useState([
        { id: 1, expression: '', result: null, steps: [], type: 'empty', showSteps: false }
    ]);
    const [expandedSteps, setExpandedSteps] = useState(new Set());

    // Add new expression row
    const addExpression = () => {
        const id = Date.now();
        setExpressions(prev => [...prev, {
            id,
            expression: '',
            result: null,
            steps: [],
            type: 'empty',
            showSteps: false
        }]);
    };

    // Update expression
    const updateExpression = (id, newExpression) => {
        setExpressions(prev => prev.map(e =>
            e.id === id ? { ...e, expression: newExpression } : e
        ));
    };

    // Solve expression
    const solveExpression = async (id) => {
        const expr = expressions.find(e => e.id === id);
        if (!expr) return;

        const solution = await solve(expr.expression);

        setExpressions(prev => prev.map(e =>
            e.id === id ? {
                ...e,
                result: solution.result,
                steps: solution.steps,
                type: solution.type,
                error: solution.error
            } : e
        ));

        // Re-solve dependent expressions when variable changes
        if (solution.type === 'assignment' && solution.variable) {
            expressions.forEach(e => {
                if (e.id !== id && e.expression.includes(solution.variable)) {
                    solveExpression(e.id);
                }
            });
        }
    };

    // Delete expression
    const deleteExpression = (id) => {
        setExpressions(prev => prev.filter(e => e.id !== id));
    };

    // Toggle steps visibility
    const toggleSteps = (id) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                            <Calculator size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Dynamic Math Lab</h1>
                            <p className="text-sm text-gray-500">
                                PhD-level equations • Auto-solve on = • Step-by-step
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearVariables}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                        >
                            <RefreshCw size={14} />
                            Clear Variables
                        </button>
                    </div>
                </div>

                {/* Variables Panel */}
                {Object.keys(variables).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800"
                    >
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
                            <Variable size={14} />
                            Defined Variables
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(variables).map(([name, value]) => (
                                <div
                                    key={name}
                                    className="px-3 py-1 bg-gray-800 rounded-lg text-sm font-mono"
                                >
                                    <span className="text-purple-400">{name}</span>
                                    <span className="text-gray-500"> = </span>
                                    <span style={{ color: RESULT_COLOR }}>
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Expressions */}
                <div className="space-y-4 mb-6">
                    <AnimatePresence>
                        {expressions.map((expr) => (
                            <ExpressionRow
                                key={expr.id}
                                {...expr}
                                isLoading={isLoading}
                                showSteps={expandedSteps.has(expr.id)}
                                onExpressionChange={updateExpression}
                                onSolve={solveExpression}
                                onDelete={deleteExpression}
                                onToggleSteps={toggleSteps}
                            />
                        ))}
                    </AnimatePresence>
                </div>

                {/* Add Expression Button */}
                <button
                    onClick={addExpression}
                    className="w-full p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-gray-600 hover:bg-gray-900/30 transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-gray-300"
                >
                    <Plus size={20} />
                    Add Expression
                </button>

                {/* Quick Reference */}
                <div className="mt-8 p-6 bg-gray-900/30 rounded-xl border border-gray-800">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-4">
                        <BookOpen size={16} />
                        Quick Reference
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                        {/* Local Solver */}
                        <div>
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <Zap size={14} />
                                Local (Instant)
                            </div>
                            <ul className="space-y-1 text-gray-500">
                                <li><code className="text-blue-400">2 + 2 =</code> → 4</li>
                                <li><code className="text-blue-400">[1,2;3,4] * 2 =</code> → Matrix</li>
                                <li><code className="text-blue-400">a = 5</code> → Define variable</li>
                                <li><code className="text-blue-400">sqrt(16) =</code> → 4</li>
                            </ul>
                        </div>

                        {/* Physics */}
                        <div>
                            <div className="flex items-center gap-2 text-amber-400 mb-2">
                                <Atom size={14} />
                                Physics
                            </div>
                            <ul className="space-y-1 text-gray-500">
                                <li><code className="text-blue-400">F = 10</code></li>
                                <li><code className="text-blue-400">m = 2</code></li>
                                <li><code className="text-blue-400">a = F/m =</code> → 5</li>
                            </ul>
                        </div>

                        {/* Pro Solver */}
                        <div>
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                                <Sparkles size={14} />
                                Pro (SymPy/Groq)
                            </div>
                            <ul className="space-y-1 text-gray-500">
                                <li><code className="text-blue-400">diff(x^2, x) =</code> → 2x</li>
                                <li><code className="text-blue-400">integrate(x, x) =</code> → x²/2</li>
                                <li><code className="text-blue-400">H2 + O2 =</code> → 2H₂O</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DynamicMathLab;
