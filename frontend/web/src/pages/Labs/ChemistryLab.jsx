import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Beaker, Play, RotateCcw, Droplets, Flame, Thermometer,
    FlaskConical, Atom, Settings, AlertTriangle, CheckCircle
} from 'lucide-react';

const Chemistry_Experiments = {
    TITRATION: 'titration',
    REACTIONS: 'reactions',
    PERIODIC: 'periodic',
    PH_SCALE: 'ph_scale'
};

const ChemistryLab = () => {
    const [experiment, setExperiment] = useState(Chemistry_Experiments.TITRATION);
    const [isRunning, setIsRunning] = useState(false);

    // Titration state
    const [acidVolume, setAcidVolume] = useState(50);
    const [baseAdded, setBaseAdded] = useState(0);
    const [ph, setPh] = useState(2);
    const [indicatorColor, setIndicatorColor] = useState('rgb(255, 100, 100)');
    const [equivalenceReached, setEquivalenceReached] = useState(false);

    // Reaction state
    const [selectedReaction, setSelectedReaction] = useState(0);
    const [reactionProgress, setReactionProgress] = useState(0);

    // pH Scale state
    const [selectedSubstance, setSelectedSubstance] = useState(null);

    const reactions = [
        { name: 'Na + Cl₂ → NaCl', reactants: ['Sodium', 'Chlorine'], product: 'Sodium Chloride', type: 'Synthesis', color: '#f97316' },
        { name: '2H₂O₂ → 2H₂O + O₂', reactants: ['Hydrogen Peroxide'], product: 'Water + Oxygen', type: 'Decomposition', color: '#3b82f6' },
        { name: 'Zn + CuSO₄ → ZnSO₄ + Cu', reactants: ['Zinc', 'Copper Sulfate'], product: 'Zinc Sulfate + Copper', type: 'Single Displacement', color: '#22c55e' }
    ];

    const substances = [
        { name: 'Battery Acid', ph: 0, color: '#dc2626' },
        { name: 'Lemon Juice', ph: 2, color: '#f97316' },
        { name: 'Vinegar', ph: 3, color: '#eab308' },
        { name: 'Coffee', ph: 5, color: '#ca8a04' },
        { name: 'Pure Water', ph: 7, color: '#22c55e' },
        { name: 'Baking Soda', ph: 9, color: '#06b6d4' },
        { name: 'Ammonia', ph: 11, color: '#3b82f6' },
        { name: 'Bleach', ph: 13, color: '#8b5cf6' },
        { name: 'Drain Cleaner', ph: 14, color: '#a855f7' }
    ];

    useEffect(() => {
        if (baseAdded > 0) {
            // Calculate pH based on titration progress
            const neutralPoint = acidVolume;
            if (baseAdded < neutralPoint * 0.9) {
                setPh(2 + (baseAdded / neutralPoint) * 5);
                setIndicatorColor(`rgb(255, ${100 + baseAdded * 2}, ${100 + baseAdded * 2})`);
            } else if (baseAdded < neutralPoint * 1.1) {
                setPh(7);
                setIndicatorColor('rgb(200, 100, 200)');
                setEquivalenceReached(true);
            } else {
                setPh(7 + ((baseAdded - neutralPoint) / neutralPoint) * 7);
                setIndicatorColor(`rgb(${150 - baseAdded}, 100, 255)`);
            }
        }
    }, [baseAdded, acidVolume]);

    const addDrop = () => {
        if (baseAdded < 100) {
            setBaseAdded(prev => prev + 2);
        }
    };

    const resetTitration = () => {
        setBaseAdded(0);
        setPh(2);
        setIndicatorColor('rgb(255, 100, 100)');
        setEquivalenceReached(false);
    };

    const runReaction = () => {
        setIsRunning(true);
        setReactionProgress(0);
        const interval = setInterval(() => {
            setReactionProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsRunning(false);
                    return 100;
                }
                return prev + 2;
            });
        }, 50);
    };

    const renderTitration = () => (
        <div className="bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 relative" style={{ height: 400 }}>
            <div className="flex justify-center gap-12 h-full items-center">
                {/* Burette */}
                <div className="flex flex-col items-center">
                    <div className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">NaOH (Base)</div>
                    <div className="relative">
                        <div className="w-8 h-48 bg-white dark:bg-gray-700 rounded-t-lg border-2 border-gray-300 dark:border-gray-600 relative overflow-hidden">
                            <motion.div
                                className="absolute bottom-0 w-full bg-blue-400"
                                style={{ height: `${100 - baseAdded}%` }}
                                animate={{ height: `${100 - baseAdded}%` }}
                            />
                        </div>
                        <div className="w-2 h-8 bg-gray-400 mx-auto" />
                        <AnimatePresence>
                            {isRunning && (
                                <motion.div
                                    initial={{ y: 0, opacity: 1 }}
                                    animate={{ y: 50, opacity: 0 }}
                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                    className="absolute -bottom-2 left-1/2 w-2 h-2 bg-blue-400 rounded-full -translate-x-1/2"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Flask */}
                <div className="flex flex-col items-center">
                    <div className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">HCl + Indicator</div>
                    <motion.div
                        className="w-32 h-40 rounded-b-full border-4 border-gray-300 dark:border-gray-600 relative overflow-hidden"
                        style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
                    >
                        <motion.div
                            className="absolute bottom-0 w-full rounded-b-full"
                            style={{
                                height: '60%',
                                backgroundColor: indicatorColor
                            }}
                            animate={{ backgroundColor: indicatorColor }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.div>
                    <div className="mt-4 text-center">
                        <div className="text-xl font-bold" style={{ color: indicatorColor }}>
                            pH: {ph.toFixed(1)}
                        </div>
                        {equivalenceReached && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full text-sm flex items-center gap-1"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Equivalence Point!
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReactions = () => (
        <div className="bg-gradient-to-b from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6" style={{ height: 400 }}>
            <div className="flex flex-col items-center justify-center h-full gap-6">
                {/* Reaction equation */}
                <div className="text-2xl font-mono font-bold text-surface-900 dark:text-surface-100">
                    {reactions[selectedReaction].name}
                </div>

                {/* Animation area */}
                <div className="relative w-full h-32 flex items-center justify-center">
                    {reactionProgress < 50 ? (
                        <div className="flex gap-8">
                            {reactions[selectedReaction].reactants.map((r, i) => (
                                <motion.div
                                    key={r}
                                    animate={{
                                        x: reactionProgress * 2,
                                        scale: 1 - reactionProgress * 0.01
                                    }}
                                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: reactions[selectedReaction].color }}
                                >
                                    {r.slice(0, 2)}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: reactions[selectedReaction].color }}
                        >
                            <Atom className="w-10 h-10" />
                        </motion.div>
                    )}
                </div>

                {/* Progress */}
                <div className="w-full max-w-md">
                    <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: reactions[selectedReaction].color, width: `${reactionProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-sm text-surface-500 mt-2">
                        <span>Reactants</span>
                        <span>{reactionProgress === 100 ? 'Complete!' : `${reactionProgress}%`}</span>
                        <span>Products</span>
                    </div>
                </div>

                {/* Reaction type */}
                <div className="px-4 py-2 bg-white dark:bg-surface-800 rounded-lg text-sm">
                    <span className="text-surface-500">Type: </span>
                    <span className="font-medium text-surface-900 dark:text-surface-100">
                        {reactions[selectedReaction].type}
                    </span>
                </div>
            </div>
        </div>
    );

    const renderPhScale = () => (
        <div className="bg-gradient-to-b from-green-50 to-cyan-50 dark:from-green-900/20 dark:to-cyan-900/20 rounded-2xl p-6" style={{ height: 400 }}>
            <div className="h-full flex flex-col">
                {/* pH Scale bar */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-red-600">Acidic (0)</span>
                    <span className="text-sm font-medium text-green-600">Neutral (7)</span>
                    <span className="text-sm font-medium text-purple-600">Basic (14)</span>
                </div>
                <div className="h-8 rounded-full overflow-hidden flex">
                    {[...Array(15)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1"
                            style={{
                                backgroundColor: `hsl(${i * 25}, 70%, 50%)`
                            }}
                        />
                    ))}
                </div>

                {/* Substances */}
                <div className="flex-1 mt-6 grid grid-cols-3 gap-3">
                    {substances.map((sub) => (
                        <motion.button
                            key={sub.name}
                            onClick={() => setSelectedSubstance(sub)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`p-3 rounded-xl border-2 transition-all ${selectedSubstance?.name === sub.name
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'
                                }`}
                        >
                            <div
                                className="w-10 h-10 rounded-full mx-auto mb-2"
                                style={{ backgroundColor: sub.color }}
                            />
                            <div className="text-xs font-medium text-surface-900 dark:text-surface-100">
                                {sub.name}
                            </div>
                            <div className="text-xs text-surface-500">pH {sub.ph}</div>
                        </motion.button>
                    ))}
                </div>

                {/* Selected info */}
                {selectedSubstance && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: selectedSubstance.color }}
                            />
                            <div>
                                <div className="font-medium text-surface-900 dark:text-surface-100">
                                    {selectedSubstance.name}
                                </div>
                                <div className="text-sm text-surface-500">
                                    pH {selectedSubstance.ph} - {selectedSubstance.ph < 7 ? 'Acidic' : selectedSubstance.ph > 7 ? 'Basic' : 'Neutral'}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
                    <FlaskConical className="w-8 h-8 text-purple-500" />
                    Chemistry Lab
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-2">
                    Interactive chemistry experiments and simulations
                </p>
            </div>

            {/* Experiment Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { id: Chemistry_Experiments.TITRATION, name: 'Acid-Base Titration', icon: Droplets },
                    { id: Chemistry_Experiments.REACTIONS, name: 'Chemical Reactions', icon: Atom },
                    { id: Chemistry_Experiments.PH_SCALE, name: 'pH Scale', icon: Thermometer }
                ].map(exp => (
                    <button
                        key={exp.id}
                        onClick={() => setExperiment(exp.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${experiment === exp.id
                                ? 'bg-purple-500 text-white'
                                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                            }`}
                    >
                        <exp.icon className="w-4 h-4" />
                        {exp.name}
                    </button>
                ))}
            </div>

            {/* Experiment Area */}
            <div className="mb-6">
                {experiment === Chemistry_Experiments.TITRATION && renderTitration()}
                {experiment === Chemistry_Experiments.REACTIONS && renderReactions()}
                {experiment === Chemistry_Experiments.PH_SCALE && renderPhScale()}
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Controls
                </h3>

                {experiment === Chemistry_Experiments.TITRATION && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Acid Volume: {acidVolume} mL
                            </label>
                            <input
                                type="range"
                                min="25"
                                max="100"
                                value={acidVolume}
                                onChange={(e) => { setAcidVolume(Number(e.target.value)); resetTitration(); }}
                                className="w-full"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={addDrop}
                                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Droplets className="w-5 h-5" />
                                Add Drop
                            </button>
                            <button
                                onClick={resetTitration}
                                className="px-6 py-3 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Reset
                            </button>
                        </div>
                    </div>
                )}

                {experiment === Chemistry_Experiments.REACTIONS && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Select Reaction
                            </label>
                            <select
                                value={selectedReaction}
                                onChange={(e) => { setSelectedReaction(Number(e.target.value)); setReactionProgress(0); }}
                                className="w-full px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-700"
                            >
                                {reactions.map((r, i) => (
                                    <option key={i} value={i}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={runReaction}
                            disabled={isRunning}
                            className="px-6 py-3 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <Play className="w-5 h-5" />
                            {isRunning ? 'Reacting...' : 'Start Reaction'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChemistryLab;
