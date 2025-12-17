import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Dna, Brain, Leaf, Eye, Settings, Play, Pause,
    RotateCcw, ZoomIn, ZoomOut, ChevronRight
} from 'lucide-react';

const Biology_Simulations = {
    CELL: 'cell',
    DNA: 'dna',
    HEART: 'heart',
    ECOSYSTEM: 'ecosystem'
};

const BiologyLab = () => {
    const [simulation, setSimulation] = useState(Biology_Simulations.CELL);
    const [isRunning, setIsRunning] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Cell state
    const [selectedOrganelle, setSelectedOrganelle] = useState(null);

    // DNA state
    const [dnaSequence, setDnaSequence] = useState(['A', 'T', 'G', 'C', 'T', 'A', 'C', 'G']);
    const [replicationProgress, setReplicationProgress] = useState(0);

    // Heart state
    const [heartRate, setHeartRate] = useState(72);
    const [heartPhase, setHeartPhase] = useState(0);

    // Ecosystem state
    const [producers, setProducers] = useState(50);
    const [consumers, setConsumers] = useState(20);
    const [predators, setPredators] = useState(5);

    const organelles = [
        { id: 'nucleus', name: 'Nucleus', x: 50, y: 50, size: 40, color: '#8B5CF6', description: 'Control center containing DNA, manages cell activities' },
        { id: 'mitochondria', name: 'Mitochondria', x: 25, y: 35, size: 20, color: '#EF4444', description: 'Powerhouse of the cell, produces ATP through cellular respiration' },
        { id: 'ribosome', name: 'Ribosome', x: 70, y: 30, size: 12, color: '#3B82F6', description: 'Protein synthesis factories' },
        { id: 'er', name: 'Endoplasmic Reticulum', x: 35, y: 70, size: 25, color: '#10B981', description: 'Transport network for proteins and lipids' },
        { id: 'golgi', name: 'Golgi Apparatus', x: 70, y: 65, size: 18, color: '#F59E0B', description: 'Packages and ships proteins' },
        { id: 'lysosome', name: 'Lysosome', x: 20, y: 60, size: 14, color: '#EC4899', description: 'Digestive enzyme containers, breaks down waste' }
    ];

    const baseComplementary = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };

    useEffect(() => {
        if (simulation === Biology_Simulations.HEART && isRunning) {
            const interval = setInterval(() => {
                setHeartPhase(p => (p + 1) % 4);
            }, 60000 / heartRate / 4);
            return () => clearInterval(interval);
        }
    }, [simulation, isRunning, heartRate]);

    useEffect(() => {
        if (simulation === Biology_Simulations.ECOSYSTEM && isRunning) {
            const interval = setInterval(() => {
                setProducers(p => Math.max(10, Math.min(100, p + Math.random() * 4 - 2 + (100 - p) * 0.02)));
                setConsumers(c => Math.max(5, Math.min(50, c + (producers * 0.02) - (predators * 0.5) + Math.random() * 2 - 1)));
                setPredators(pr => Math.max(1, Math.min(20, pr + (consumers * 0.01) - 0.2 + Math.random() - 0.5)));
            }, 500);
            return () => clearInterval(interval);
        }
    }, [simulation, isRunning, producers, consumers, predators]);

    const replicateDNA = () => {
        setIsRunning(true);
        setReplicationProgress(0);
        const interval = setInterval(() => {
            setReplicationProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsRunning(false);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    const renderCellSimulation = () => (
        <div
            className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 relative overflow-hidden"
            style={{ height: 400, transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
            {/* Cell membrane */}
            <div className="absolute inset-8 rounded-full border-4 border-blue-300 dark:border-blue-700 bg-blue-100/50 dark:bg-blue-900/30">
                {/* Cytoplasm pattern */}
                <div className="absolute inset-0 opacity-20">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-blue-400 rounded-full"
                            animate={{
                                x: [Math.random() * 300, Math.random() * 300],
                                y: [Math.random() * 300, Math.random() * 300]
                            }}
                            transition={{ repeat: Infinity, duration: 5 + Math.random() * 5 }}
                            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                        />
                    ))}
                </div>

                {/* Organelles */}
                {organelles.map(org => (
                    <motion.div
                        key={org.id}
                        onClick={() => setSelectedOrganelle(org)}
                        whileHover={{ scale: 1.2 }}
                        className={`absolute rounded-full cursor-pointer transition-all ${selectedOrganelle?.id === org.id ? 'ring-4 ring-white shadow-lg' : ''
                            }`}
                        style={{
                            left: `${org.x}%`,
                            top: `${org.y}%`,
                            width: org.size * 2,
                            height: org.id === 'er' ? org.size : org.size * 2,
                            backgroundColor: org.color,
                            borderRadius: org.id === 'er' ? '30%' : '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                ))}
            </div>

            {/* Selected organelle info */}
            <AnimatePresence>
                {selectedOrganelle && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-4 left-4 right-4 bg-white dark:bg-surface-800 rounded-xl p-4 shadow-lg"
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="w-8 h-8 rounded-full flex-shrink-0"
                                style={{ backgroundColor: selectedOrganelle.color }}
                            />
                            <div>
                                <h4 className="font-semibold text-surface-900 dark:text-surface-100">
                                    {selectedOrganelle.name}
                                </h4>
                                <p className="text-sm text-surface-600 dark:text-surface-400">
                                    {selectedOrganelle.description}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderDNASimulation = () => (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6" style={{ height: 400 }}>
            <div className="h-full flex flex-col items-center justify-center">
                {/* DNA Helix representation */}
                <div className="flex justify-center gap-1 mb-8">
                    {dnaSequence.map((base, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex flex-col items-center"
                        >
                            {/* Original strand */}
                            <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white mb-1 ${base === 'A' ? 'bg-green-500' :
                                        base === 'T' ? 'bg-red-500' :
                                            base === 'G' ? 'bg-blue-500' : 'bg-yellow-500'
                                    }`}
                            >
                                {base}
                            </div>

                            {/* Hydrogen bonds */}
                            <div className="h-8 border-l-2 border-dashed border-gray-400" />

                            {/* Complementary strand */}
                            <motion.div
                                animate={{
                                    opacity: replicationProgress > (i / dnaSequence.length) * 100 ? 1 : 0.3
                                }}
                                className={`w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white mt-1 ${baseComplementary[base] === 'A' ? 'bg-green-500' :
                                        baseComplementary[base] === 'T' ? 'bg-red-500' :
                                            baseComplementary[base] === 'G' ? 'bg-blue-500' : 'bg-yellow-500'
                                    }`}
                            >
                                {baseComplementary[base]}
                            </motion.div>
                        </motion.div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-500" /> Adenine</span>
                    <span className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-500" /> Thymine</span>
                    <span className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-blue-500" /> Guanine</span>
                    <span className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-yellow-500" /> Cytosine</span>
                </div>

                {/* Progress */}
                <div className="w-full max-w-md mt-6">
                    <div className="text-sm text-center text-surface-500 mb-2">
                        Replication Progress: {replicationProgress}%
                    </div>
                    <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-purple-500 rounded-full"
                            animate={{ width: `${replicationProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderHeartSimulation = () => (
        <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6" style={{ height: 400 }}>
            <div className="h-full flex items-center justify-center gap-12">
                {/* Heart animation */}
                <motion.div
                    animate={{
                        scale: heartPhase === 0 ? 1 : heartPhase === 1 ? 1.15 : heartPhase === 2 ? 1 : 0.95
                    }}
                    transition={{ duration: 0.15 }}
                    className="relative"
                >
                    <Heart
                        className={`w-48 h-48 ${isRunning ? 'text-red-500' : 'text-red-300'}`}
                        fill={isRunning ? '#ef4444' : '#fca5a5'}
                    />
                    {/* Chambers */}
                    <div className="absolute top-8 left-8 text-xs text-white font-bold">RA</div>
                    <div className="absolute top-8 right-12 text-xs text-white font-bold">LA</div>
                    <div className="absolute bottom-16 left-10 text-xs text-white font-bold">RV</div>
                    <div className="absolute bottom-16 right-14 text-xs text-white font-bold">LV</div>
                </motion.div>

                {/* ECG-like visualization */}
                <div className="flex-1 max-w-xs">
                    <svg viewBox="0 0 200 100" className="w-full">
                        <motion.path
                            d="M 0,50 L 30,50 L 35,50 L 40,20 L 45,80 L 50,50 L 80,50 L 100,50 L 105,50 L 110,20 L 115,80 L 120,50 L 150,50 L 170,50 L 175,50 L 180,20 L 185,80 L 190,50 L 200,50"
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            animate={{ pathLength: [0, 1] }}
                            transition={{ repeat: Infinity, duration: 60 / heartRate * 3 }}
                        />
                    </svg>
                    <div className="text-center mt-4">
                        <div className="text-3xl font-bold text-red-500">{heartRate}</div>
                        <div className="text-sm text-surface-500">BPM</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEcosystemSimulation = () => (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6" style={{ height: 400 }}>
            <div className="h-full flex flex-col">
                {/* Population visualization */}
                <div className="flex-1 flex items-end justify-center gap-8 pb-4">
                    <div className="text-center">
                        <div className="text-sm text-surface-500 mb-2">Producers</div>
                        <motion.div
                            className="w-20 bg-green-500 rounded-t-lg mx-auto"
                            animate={{ height: producers * 2 }}
                        />
                        <div className="mt-2 font-bold text-green-600">{Math.round(producers)}</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <ChevronRight className="w-6 h-6 text-surface-400 -rotate-45" />
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-surface-500 mb-2">Consumers</div>
                        <motion.div
                            className="w-20 bg-blue-500 rounded-t-lg mx-auto"
                            animate={{ height: consumers * 4 }}
                        />
                        <div className="mt-2 font-bold text-blue-600">{Math.round(consumers)}</div>
                    </div>
                    <div className="flex flex-col items-center">
                        <ChevronRight className="w-6 h-6 text-surface-400 -rotate-45" />
                    </div>
                    <div className="text-center">
                        <div className="text-sm text-surface-500 mb-2">Predators</div>
                        <motion.div
                            className="w-20 bg-red-500 rounded-t-lg mx-auto"
                            animate={{ height: predators * 8 }}
                        />
                        <div className="mt-2 font-bold text-red-600">{Math.round(predators)}</div>
                    </div>
                </div>

                {/* Energy flow */}
                <div className="mt-4 p-4 bg-white dark:bg-surface-800 rounded-xl">
                    <div className="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                        Energy Pyramid
                    </div>
                    <div className="text-xs text-surface-500">
                        Energy flows from producers → consumers → predators with ~10% efficiency at each level
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-3">
                    <Leaf className="w-8 h-8 text-green-500" />
                    Biology Lab
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-2">
                    Explore life sciences through interactive simulations
                </p>
            </div>

            {/* Simulation Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { id: Biology_Simulations.CELL, name: 'Cell Structure', icon: Eye },
                    { id: Biology_Simulations.DNA, name: 'DNA Replication', icon: Dna },
                    { id: Biology_Simulations.HEART, name: 'Cardiac Cycle', icon: Heart },
                    { id: Biology_Simulations.ECOSYSTEM, name: 'Ecosystem', icon: Leaf }
                ].map(sim => (
                    <button
                        key={sim.id}
                        onClick={() => { setSimulation(sim.id); setIsRunning(false); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${simulation === sim.id
                                ? 'bg-green-500 text-white'
                                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                            }`}
                    >
                        <sim.icon className="w-4 h-4" />
                        {sim.name}
                    </button>
                ))}
            </div>

            {/* Simulation Area */}
            <div className="mb-6">
                {simulation === Biology_Simulations.CELL && renderCellSimulation()}
                {simulation === Biology_Simulations.DNA && renderDNASimulation()}
                {simulation === Biology_Simulations.HEART && renderHeartSimulation()}
                {simulation === Biology_Simulations.ECOSYSTEM && renderEcosystemSimulation()}
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Controls
                </h3>

                {simulation === Biology_Simulations.CELL && (
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-surface-600 dark:text-surface-400">Zoom:</span>
                        <button
                            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                            className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <span className="font-mono">{(zoom * 100).toFixed(0)}%</span>
                        <button
                            onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                            className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <span className="text-sm text-surface-500 ml-4">Click on organelles to learn about them</span>
                    </div>
                )}

                {simulation === Biology_Simulations.DNA && (
                    <button
                        onClick={replicateDNA}
                        disabled={isRunning}
                        className="px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <Dna className="w-5 h-5" />
                        {isRunning ? 'Replicating...' : 'Start Replication'}
                    </button>
                )}

                {simulation === Biology_Simulations.HEART && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Heart Rate: {heartRate} BPM
                            </label>
                            <input
                                type="range"
                                min="40"
                                max="180"
                                value={heartRate}
                                onChange={(e) => setHeartRate(Number(e.target.value))}
                                className="w-full max-w-md"
                            />
                        </div>
                        <button
                            onClick={() => setIsRunning(!isRunning)}
                            className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${isRunning
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            {isRunning ? 'Stop' : 'Start'} Heartbeat
                        </button>
                    </div>
                )}

                {simulation === Biology_Simulations.ECOSYSTEM && (
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${isRunning
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                    >
                        {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        {isRunning ? 'Pause' : 'Simulate'} Ecosystem
                    </button>
                )}
            </div>
        </div>
    );
};

export default BiologyLab;
