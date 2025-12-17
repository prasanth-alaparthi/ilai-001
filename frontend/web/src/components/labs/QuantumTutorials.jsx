import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, Check, Play,
    BookOpen, Atom, Zap, GitBranch, Search,
    X, ArrowRight
} from 'lucide-react';

// Tutorial content
const TUTORIALS = [
    {
        id: 'qubit',
        title: 'What is a Qubit?',
        icon: Atom,
        color: 'from-blue-500 to-cyan-500',
        duration: '5 min',
        steps: [
            {
                title: 'Classical Bits',
                content: `In classical computing, a **bit** can be either 0 or 1. It's like a light switch - either ON or OFF.`,
                visual: 'bit',
                exercise: null
            },
            {
                title: 'Quantum Superposition',
                content: `A **qubit** can be 0, 1, or **both at the same time**! This is called superposition. Think of it like a spinning coin - it's both heads AND tails until you look at it.`,
                visual: 'superposition',
                exercise: null
            },
            {
                title: 'Measurement',
                content: `When we **measure** a qubit in superposition, it "collapses" to either 0 or 1. The probability of each outcome depends on the qubit's state.`,
                visual: 'measurement',
                exercise: null
            },
            {
                title: 'Try It!',
                content: `Let's put a qubit in superposition using the **Hadamard (H) gate**, then measure it.`,
                visual: null,
                exercise: {
                    instruction: 'Add an H gate to qubit 0, then run the circuit',
                    solution: [{ gate: 'h', qubits: [0] }],
                    expectedResult: 'You should see ~50% |0⟩ and ~50% |1⟩'
                }
            }
        ]
    },
    {
        id: 'superposition',
        title: 'Superposition Deep Dive',
        icon: Zap,
        color: 'from-purple-500 to-pink-500',
        duration: '7 min',
        steps: [
            {
                title: 'The Hadamard Gate',
                content: `The **H gate** is the key to superposition. It transforms:\n- |0⟩ → (|0⟩ + |1⟩)/√2\n- |1⟩ → (|0⟩ - |1⟩)/√2`,
                visual: 'hadamard',
                exercise: null
            },
            {
                title: 'Probability Amplitudes',
                content: `Each state has a **probability amplitude** (a complex number). The probability of measuring that state is the square of the amplitude's magnitude.`,
                visual: 'amplitudes',
                exercise: null
            },
            {
                title: 'Multiple Qubits',
                content: `With 2 qubits, we have 4 possible states: |00⟩, |01⟩, |10⟩, |11⟩. With n qubits, we have 2^n states - this is quantum computing's power!`,
                visual: 'multiple',
                exercise: null
            },
            {
                title: 'Exercise',
                content: `Create a 2-qubit circuit where both qubits are in superposition.`,
                visual: null,
                exercise: {
                    instruction: 'Add H gates to both qubits',
                    solution: [{ gate: 'h', qubits: [0] }, { gate: 'h', qubits: [1] }],
                    expectedResult: 'You should see ~25% for each of |00⟩, |01⟩, |10⟩, |11⟩'
                }
            }
        ]
    },
    {
        id: 'entanglement',
        title: 'Quantum Entanglement',
        icon: GitBranch,
        color: 'from-emerald-500 to-teal-500',
        duration: '8 min',
        steps: [
            {
                title: 'What is Entanglement?',
                content: `**Entanglement** is a quantum phenomenon where two qubits become correlated. Measuring one instantly affects the other, no matter the distance!`,
                visual: 'entangle-intro',
                exercise: null
            },
            {
                title: 'The CNOT Gate',
                content: `The **CNOT** (Controlled-NOT) gate flips the target qubit if the control qubit is |1⟩. It's essential for creating entanglement.`,
                visual: 'cnot',
                exercise: null
            },
            {
                title: 'Bell States',
                content: `A **Bell State** is the simplest entangled state. Created by: H on qubit 0, then CNOT with control=0, target=1. The result: |00⟩ + |11⟩ (they're always the same!)`,
                visual: 'bell',
                exercise: null
            },
            {
                title: 'Create Entanglement',
                content: `Let's create a Bell State! The qubits will be perfectly correlated.`,
                visual: null,
                exercise: {
                    instruction: 'Add H to qubit 0, then CNOT(0,1)',
                    solution: [{ gate: 'h', qubits: [0] }, { gate: 'cx', qubits: [0, 1] }],
                    expectedResult: 'Only |00⟩ and |11⟩ should appear, ~50% each'
                }
            }
        ]
    },
    {
        id: 'grover',
        title: "Grover's Algorithm",
        icon: Search,
        color: 'from-amber-500 to-orange-500',
        duration: '10 min',
        steps: [
            {
                title: 'The Search Problem',
                content: `Imagine searching for 1 item in a list of N items. Classically, you need N/2 checks on average. Grover's algorithm does it in √N steps!`,
                visual: 'search',
                exercise: null
            },
            {
                title: 'Oracle',
                content: `The **oracle** marks the correct answer by flipping its phase. It's like a black box that "knows" the answer.`,
                visual: 'oracle',
                exercise: null
            },
            {
                title: 'Amplitude Amplification',
                content: `The **diffusion operator** amplifies the marked state's probability while reducing others. After √N iterations, the answer is highly probable.`,
                visual: 'amplification',
                exercise: null
            },
            {
                title: 'Simple Grover',
                content: `For 2 qubits (4 items), one iteration is enough. The oracle marks one state, and diffusion amplifies it.`,
                visual: 'grover-circuit',
                exercise: {
                    instruction: 'This is advanced! Try the Bell State first, then explore Grover.',
                    solution: [],
                    expectedResult: 'Grover circuits require more gates - explore the examples!'
                }
            }
        ]
    }
];

// Visual components for each concept
const ConceptVisual = ({ type }) => {
    const visuals = {
        'bit': (
            <div className="flex justify-center gap-8">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-white">0</div>
                    <p className="text-xs text-zinc-500 mt-2">OFF</p>
                </div>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-2xl font-bold text-white">1</div>
                    <p className="text-xs text-zinc-500 mt-2">ON</p>
                </div>
            </div>
        ),
        'superposition': (
            <div className="flex justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 flex items-center justify-center"
                >
                    <span className="text-white font-bold">0+1</span>
                </motion.div>
            </div>
        ),
        'measurement': (
            <div className="flex justify-center items-center gap-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: 2 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
                <ArrowRight className="text-zinc-500" />
                <div className="flex gap-2">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">0</div>
                    <span className="text-zinc-500">or</span>
                    <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">1</div>
                </div>
            </div>
        ),
        'hadamard': (
            <div className="flex justify-center items-center gap-4">
                <div className="text-center">
                    <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-white">|0⟩</div>
                </div>
                <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white font-bold">H</div>
                <div className="text-center">
                    <div className="w-16 h-12 rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm">(|0⟩+|1⟩)/√2</div>
                </div>
            </div>
        ),
        'bell': (
            <div className="text-center">
                <div className="inline-block bg-zinc-800 rounded-lg p-4">
                    <div className="text-xs text-zinc-400 mb-2">Bell State Circuit</div>
                    <div className="font-mono text-sm text-cyan-400">
                        <div>q0: ─[H]──●──</div>
                        <div>q1: ──────⊕──</div>
                    </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">Result: |00⟩ + |11⟩</p>
            </div>
        ),
        'cnot': (
            <div className="flex justify-center items-center gap-4">
                <div className="text-center text-sm">
                    <div className="mb-1 text-zinc-400">Control = 0</div>
                    <div className="text-cyan-400">Target unchanged</div>
                </div>
                <div className="w-12 h-12 bg-cyan-500 rounded flex items-center justify-center text-white font-bold text-xs">CNOT</div>
                <div className="text-center text-sm">
                    <div className="mb-1 text-zinc-400">Control = 1</div>
                    <div className="text-cyan-400">Target flipped</div>
                </div>
            </div>
        )
    };

    return visuals[type] || null;
};

const QuantumTutorials = ({ onClose, onStartExercise }) => {
    const [selectedTutorial, setSelectedTutorial] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [completedTutorials, setCompletedTutorials] = useState([]);

    const handleComplete = (tutorialId) => {
        if (!completedTutorials.includes(tutorialId)) {
            setCompletedTutorials([...completedTutorials, tutorialId]);
        }
        setSelectedTutorial(null);
        setCurrentStep(0);
    };

    const handleStartExercise = (exercise) => {
        if (onStartExercise) {
            onStartExercise(exercise);
        }
        onClose?.();
    };

    // Tutorial List View
    if (!selectedTutorial) {
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <BookOpen size={20} className="text-violet-400" />
                        <h2 className="font-bold text-white">Quantum Tutorials</h2>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
                            <X size={18} className="text-zinc-400" />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {TUTORIALS.map((tutorial, index) => {
                        const isCompleted = completedTutorials.includes(tutorial.id);
                        return (
                            <motion.button
                                key={tutorial.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => setSelectedTutorial(tutorial)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${isCompleted
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${tutorial.color}`}>
                                        <tutorial.icon size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-white">{tutorial.title}</h3>
                                            {isCompleted && <Check size={16} className="text-emerald-400" />}
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {tutorial.steps.length} steps • {tutorial.duration}
                                        </p>
                                    </div>
                                    <ChevronRight size={18} className="text-zinc-600" />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Progress</span>
                        <span className="text-white font-medium">
                            {completedTutorials.length}/{TUTORIALS.length} completed
                        </span>
                    </div>
                    <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all"
                            style={{ width: `${(completedTutorials.length / TUTORIALS.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Tutorial Step View
    const step = selectedTutorial.steps[currentStep];
    const isLastStep = currentStep === selectedTutorial.steps.length - 1;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <button
                    onClick={() => { setSelectedTutorial(null); setCurrentStep(0); }}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white"
                >
                    <ChevronLeft size={18} />
                    <span className="text-sm">Back</span>
                </button>
                <span className="text-xs text-zinc-500">
                    {currentStep + 1} / {selectedTutorial.steps.length}
                </span>
            </div>

            {/* Progress */}
            <div className="flex gap-1 px-4 py-2">
                {selectedTutorial.steps.map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-1 rounded-full ${i <= currentStep ? 'bg-violet-500' : 'bg-zinc-800'
                            }`}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <h3 className="text-lg font-bold text-white">{step.title}</h3>

                        <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
                            {step.content.split('**').map((part, i) =>
                                i % 2 === 1 ? <strong key={i} className="text-cyan-400">{part}</strong> : part
                            )}
                        </div>

                        {step.visual && (
                            <div className="py-6 bg-zinc-900 rounded-xl">
                                <ConceptVisual type={step.visual} />
                            </div>
                        )}

                        {step.exercise && (
                            <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2 text-violet-400">
                                    <Play size={16} />
                                    <span className="font-medium text-sm">Exercise</span>
                                </div>
                                <p className="text-sm text-zinc-300">{step.exercise.instruction}</p>
                                <p className="text-xs text-zinc-500">{step.exercise.expectedResult}</p>
                                <button
                                    onClick={() => handleStartExercise(step.exercise)}
                                    className="w-full py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Try in Circuit Builder
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 p-4 border-t border-zinc-800">
                {currentStep > 0 && (
                    <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Previous
                    </button>
                )}
                <button
                    onClick={() => {
                        if (isLastStep) {
                            handleComplete(selectedTutorial.id);
                        } else {
                            setCurrentStep(currentStep + 1);
                        }
                    }}
                    className="flex-1 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    {isLastStep ? 'Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default QuantumTutorials;
