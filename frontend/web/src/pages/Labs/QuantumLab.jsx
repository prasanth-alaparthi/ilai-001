import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Atom, Play, Terminal, Cpu, ChevronLeft,
    Trash2, RotateCcw, BookOpen, Code, Zap,
    Plus, Minus, GraduationCap, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import QuantumTutorials from '../../components/labs/QuantumTutorials';

// Quantum gates configuration
const GATES = {
    single: [
        { id: 'h', name: 'H', color: 'bg-blue-500', description: 'Hadamard - Superposition' },
        { id: 'x', name: 'X', color: 'bg-red-500', description: 'Pauli-X - Bit Flip' },
        { id: 'y', name: 'Y', color: 'bg-green-500', description: 'Pauli-Y - Rotation' },
        { id: 'z', name: 'Z', color: 'bg-yellow-500', description: 'Pauli-Z - Phase Flip' },
        { id: 't', name: 'T', color: 'bg-purple-500', description: 'T Gate - π/4 Phase' },
        { id: 's', name: 'S', color: 'bg-pink-500', description: 'S Gate - π/2 Phase' },
    ],
    two: [
        { id: 'cx', name: 'CNOT', color: 'bg-cyan-500', description: 'Controlled-NOT - Entanglement' },
        { id: 'cz', name: 'CZ', color: 'bg-orange-500', description: 'Controlled-Z' },
        { id: 'swap', name: 'SWAP', color: 'bg-indigo-500', description: 'Swap Qubits' },
    ]
};

const QuantumLab = () => {
    const [numQubits, setNumQubits] = useState(2);
    const [circuit, setCircuit] = useState([]); // Array of gate operations
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('visual'); // 'visual' or 'code'
    const [code, setCode] = useState(`# Quantum Lab - Write your circuit here
# NOTE: No imports needed! QuantumCircuit is pre-loaded.
# Just define a variable named 'circuit' or 'qc'

# Example: Bell State (Entanglement)
circuit = QuantumCircuit(2, 2)
circuit.h(0)        # Hadamard: superposition
circuit.cx(0, 1)    # CNOT: entangle qubits
circuit.measure([0, 1], [0, 1])

# Available methods:
# circuit.h(qubit)     - Hadamard
# circuit.x(qubit)     - Pauli-X (NOT)
# circuit.y(qubit)     - Pauli-Y
# circuit.z(qubit)     - Pauli-Z
# circuit.t(qubit)     - T gate
# circuit.s(qubit)     - S gate
# circuit.cx(c, t)     - CNOT
# circuit.cz(c, t)     - CZ
# circuit.swap(a, b)   - SWAP
# circuit.measure(qubits, bits)
`);
    const [examples, setExamples] = useState([]);
    const [showTutorials, setShowTutorials] = useState(false);

    useEffect(() => {
        // Load examples
        fetchExamples();
    }, []);

    const fetchExamples = async () => {
        try {
            const res = await apiClient.get('/quantum/examples');
            setExamples(res.data.examples || []);
        } catch (err) {
            console.log('Could not load examples');
        }
    };

    const addGate = (gateId, qubits) => {
        setCircuit([...circuit, { gate: gateId, qubits }]);
    };

    const removeGate = (index) => {
        setCircuit(circuit.filter((_, i) => i !== index));
    };

    const clearCircuit = () => {
        setCircuit([]);
        setResults(null);
    };

    const runCircuit = async () => {
        setLoading(true);
        setError(null);
        try {
            if (mode === 'visual') {
                const res = await apiClient.post('/quantum/run-circuit', {
                    num_qubits: numQubits,
                    gates: circuit,
                    shots: 1024
                });
                setResults(res.data);
            } else {
                const res = await apiClient.post('/quantum/run-code', {
                    code: code,
                    shots: 1024
                });
                if (res.data.success) {
                    setResults(res.data);
                } else {
                    setError(res.data.error);
                }
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to run circuit');
        } finally {
            setLoading(false);
        }
    };

    const loadExample = (example) => {
        if (mode === 'visual') {
            setCircuit(example.gates);
            setNumQubits(example.gates.some(g => g.qubits.includes(2)) ? 3 : 2);
        } else {
            setCode(example.code);
        }
    };

    // Handle exercise from tutorials
    const handleStartExercise = (exercise) => {
        if (exercise.solution && exercise.solution.length > 0) {
            setCircuit(exercise.solution);
            setMode('visual');
        }
        setShowTutorials(false);
    };

    const [showSettings, setShowSettings] = useState(false);
    const [ibmToken, setIbmToken] = useState(localStorage.getItem('ibm_quantum_token') || '');

    const saveSettings = () => {
        localStorage.setItem('ibm_quantum_token', ibmToken);
        setShowSettings(false);
    };

    const exportResults = () => {
        if (!results) return;
        const data = {
            num_qubits: numQubits,
            circuit: circuit,
            results: results,
            timestamp: new Date().toISOString(),
            engine: 'Qiskit Aer Simulator'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quantum_results_${new Date().getTime()}.json`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-mono relative">
            {/* Header */}
            <header className="border-b border-gray-800 p-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/labs" className="p-2 hover:bg-gray-800 rounded-lg transition">
                            <ChevronLeft size={20} />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-violet-500/20 rounded-lg">
                                <Atom size={24} className="text-violet-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">QUANTUM_SIM</h1>
                                <p className="text-xs text-gray-500">Qiskit Aer Simulator</p>
                            </div>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1">
                        <button
                            onClick={() => setMode('visual')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${mode === 'visual' ? 'bg-violet-500 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Zap size={14} />
                            Visual
                        </button>
                        <button
                            onClick={() => setMode('code')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${mode === 'code' ? 'bg-violet-500 text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Code size={14} />
                            Code
                        </button>
                        <button
                            onClick={() => setShowTutorials(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition"
                        >
                            <GraduationCap size={14} />
                            Learn
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left Panel - Gates */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Qubit Control */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Qubits</h3>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => setNumQubits(Math.max(1, numQubits - 1))}
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="text-2xl font-bold text-white">{numQubits}</span>
                            <button
                                onClick={() => setNumQubits(Math.min(5, numQubits + 1))}
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Gate Palette */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Single Qubit Gates</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {GATES.single.map(gate => (
                                <button
                                    key={gate.id}
                                    onClick={() => addGate(gate.id, [0])}
                                    className={`${gate.color} p-3 rounded-lg text-white font-bold text-lg hover:opacity-80 transition`}
                                    title={gate.description}
                                >
                                    {gate.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Two Qubit Gates</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {GATES.two.map(gate => (
                                <button
                                    key={gate.id}
                                    onClick={() => addGate(gate.id, [0, 1])}
                                    disabled={numQubits < 2}
                                    className={`${gate.color} p-3 rounded-lg text-white font-bold text-sm hover:opacity-80 transition disabled:opacity-30`}
                                    title={gate.description}
                                >
                                    {gate.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Examples */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                            <BookOpen size={14} /> Examples
                        </h3>
                        <div className="space-y-2">
                            {examples.map((ex, i) => (
                                <button
                                    key={i}
                                    onClick={() => loadExample(ex)}
                                    className="w-full text-left p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                                >
                                    <div className="text-white font-medium">{ex.name}</div>
                                    <div className="text-xs text-gray-500">{ex.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Panel - Circuit Builder */}
                <div className="lg:col-span-2">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <h3 className="text-sm font-medium text-white">
                                {mode === 'visual' ? 'Circuit Builder' : 'Qiskit Code Editor'}
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={clearCircuit}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={runCircuit}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-medium disabled:opacity-50"
                                >
                                    {loading ? (
                                        <RotateCcw size={16} className="animate-spin" />
                                    ) : (
                                        <Play size={16} />
                                    )}
                                    Run
                                </button>
                            </div>
                        </div>

                        {mode === 'visual' ? (
                            /* Visual Circuit Builder */
                            <div className="p-4 min-h-[300px] overflow-x-auto">
                                {/* Qubit wires */}
                                <div className="min-w-fit">
                                    {Array.from({ length: numQubits }).map((_, q) => (
                                        <div key={q} className="flex items-center gap-2 mb-4">
                                            <span className="text-xs text-gray-500 w-8 flex-shrink-0">q{q}:</span>
                                            <div className="min-w-[200px] h-10 bg-gray-800 rounded-lg flex items-center px-2 gap-2 relative flex-nowrap overflow-visible">
                                                <div className="absolute inset-y-0 left-0 right-0 border-t-2 border-dashed border-gray-700 top-1/2" />
                                                {circuit.map((op, i) => {
                                                    if (op.qubits.includes(q)) {
                                                        const gate = [...GATES.single, ...GATES.two].find(g => g.id === op.gate);
                                                        return (
                                                            <motion.button
                                                                key={i}
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className={`${gate?.color || 'bg-gray-600'} px-3 py-1 rounded text-white text-sm font-bold z-10 hover:opacity-80`}
                                                                onClick={() => removeGate(i)}
                                                                title="Click to remove"
                                                            >
                                                                {gate?.name || op.gate}
                                                            </motion.button>
                                                        );
                                                    }
                                                    return <div key={i} className="w-10" />;
                                                })}
                                            </div>
                                            <span className="text-xs text-gray-500">→ M</span>
                                        </div>
                                    ))}
                                    {circuit.length === 0 && (
                                        <div className="text-center text-gray-500 py-12">
                                            <Atom size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>Click gates on the left to add them to your circuit</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Code Editor */
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-[300px] p-4 bg-black text-green-400 font-mono text-sm outline-none resize-none"
                                spellCheck={false}
                            />
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Right Panel - Results */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                            <Terminal size={14} /> Results
                        </h3>

                        {results ? (
                            <div className="space-y-4">
                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-800 p-2 rounded">
                                        <div className="text-gray-500">Qubits</div>
                                        <div className="text-white font-bold">{results.num_qubits}</div>
                                    </div>
                                    <div className="bg-gray-800 p-2 rounded">
                                        <div className="text-gray-500">Shots</div>
                                        <div className="text-white font-bold">{results.shots}</div>
                                    </div>
                                    <div className="bg-gray-800 p-2 rounded col-span-2">
                                        <div className="text-gray-500">Depth</div>
                                        <div className="text-white font-bold">{results.circuit_depth}</div>
                                    </div>
                                </div>

                                {/* Probability Bars */}
                                <div className="space-y-2">
                                    <div className="text-xs text-gray-500 mb-2">Probabilities</div>
                                    {Object.entries(results.probabilities || {})
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([state, prob]) => (
                                            <div key={state} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-cyan-400 font-mono">|{state}⟩</span>
                                                    <span className="text-white">{(prob * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${prob * 100}%` }}
                                                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {/* Export Button */}
                                <div className="mt-4">
                                    <button
                                        onClick={exportResults}
                                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs flex items-center justify-center gap-2 border border-gray-700 transition"
                                    >
                                        <Plus size={14} className="rotate-45" /> Export Data (.json)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-12">
                                <Cpu size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm">Run circuit to see results</p>
                            </div>
                        )}
                    </div>

                    {/* Hardware Status */}
                    <div className="mt-4 bg-gray-900 border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-gray-400">Simulator Active</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            Running on Qiskit Aer (local)
                        </div>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="mt-3 w-full py-2 bg-violet-500/10 text-violet-400 border border-violet-500/30 rounded-lg text-xs hover:bg-violet-500/20 transition"
                        >
                            ⚙️ IBM Quantum Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* IBM Quantum Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSettings(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-xl p-6 relative z-10"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white">Hardware Settings</h3>
                                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">IBM Quantum API Token</label>
                                    <input
                                        type="password"
                                        value={ibmToken}
                                        onChange={(e) => setIbmToken(e.target.value)}
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm text-green-400 focus:border-violet-500 outline-none"
                                        placeholder="Paste your IBMQ token here..."
                                    />
                                    <p className="text-[10px] text-gray-600 mt-2">
                                        Your token is stored locally in your browser and used only for hardware execution.
                                        Get one at <a href="https://quantum.ibm.com/" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">IBM Quantum</a>.
                                    </p>
                                </div>

                                <button
                                    onClick={saveSettings}
                                    className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg font-bold transition"
                                >
                                    Save Configuration
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Tutorials Panel */}
            <AnimatePresence>
                {showTutorials && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTutorials(false)}
                            className="fixed inset-0 bg-black/60 z-40"
                        />
                        {/* Panel */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-r border-zinc-800 z-50 overflow-hidden"
                        >
                            <QuantumTutorials
                                onClose={() => setShowTutorials(false)}
                                onStartExercise={handleStartExercise}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuantumLab;
