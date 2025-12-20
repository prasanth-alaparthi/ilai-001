import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Play, Pause, RotateCcw, Settings, Zap, Target,
    ArrowRight, CircleDot, Maximize2, HelpCircle, Calculator
} from 'lucide-react';
import labsService from '../../services/labsService';
import DerivationViewer from '../../components/labs/DerivationViewer';

const Physics_Simulations = {
    PROJECTILE: 'projectile',
    PENDULUM: 'pendulum',
    WAVES: 'waves',
    CIRCUITS: 'circuits',
    EQUATION_SOLVER: 'equation_solver'
};

const PhysicsLab = () => {
    // Simulation state
    const [simulation, setSimulation] = useState(Physics_Simulations.PROJECTILE);
    const [isRunning, setIsRunning] = useState(false);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    // Projectile parameters
    const [angle, setAngle] = useState(45);
    const [velocity, setVelocity] = useState(50);
    const [projectilePos, setProjectilePos] = useState({ x: 50, y: 350 });
    const [trajectory, setTrajectory] = useState([]);

    // Pendulum parameters
    const [pendulumLength, setPendulumLength] = useState(200);
    const [pendulumAngle, setPendulumAngle] = useState(Math.PI / 4);
    const [angularVelocity, setAngularVelocity] = useState(0);

    // Wave parameters
    const [waveFrequency, setWaveFrequency] = useState(2);
    const [waveAmplitude, setWaveAmplitude] = useState(50);
    const [wavePhase, setWavePhase] = useState(0);

    // Equation solver state
    const [equation, setEquation] = useState('x**2 - 4');
    const [equationType, setEquationType] = useState('algebraic');
    const [solverResult, setSolverResult] = useState(null);
    const [isSolving, setIsSolving] = useState(false);
    const [solverError, setSolverError] = useState(null);

    const solveEquation = async () => {
        setIsSolving(true);
        setSolverError(null);
        setSolverResult(null);
        try {
            const result = await labsService.solvePhysics(equation, equationType);
            if (result.success) {
                setSolverResult(result);
            } else {
                setSolverError(result.error);
            }
        } catch (err) {
            setSolverError(err.message || 'Failed to solve equation');
        } finally {
            setIsSolving(false);
        }
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (simulation === Physics_Simulations.WAVES && isRunning) {
            animateWaves();
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [simulation, isRunning, waveFrequency, waveAmplitude]);

    const runProjectile = () => {
        setIsRunning(true);
        setTrajectory([]);
        const g = 9.81;
        const rad = (angle * Math.PI) / 180;
        const vx = velocity * Math.cos(rad);
        const vy = velocity * Math.sin(rad);
        let t = 0;
        const dt = 0.05;
        const startX = 50;
        const startY = 350;
        const points = [];

        const animate = () => {
            t += dt;
            const x = startX + vx * t * 4;
            const y = startY - (vy * t - 0.5 * g * t * t) * 4;

            if (y <= 350 && x < 750) {
                points.push({ x, y: Math.min(y, 350) });
                setTrajectory([...points]);
                setProjectilePos({ x, y: Math.min(y, 350) });
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setIsRunning(false);
            }
        };
        animate();
    };

    const animateWaves = () => {
        const animate = () => {
            setWavePhase(p => p + 0.1);
            if (isRunning) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };
        animate();
    };

    const resetSimulation = () => {
        setIsRunning(false);
        setProjectilePos({ x: 50, y: 350 });
        setTrajectory([]);
        setWavePhase(0);
        setPendulumAngle(Math.PI / 4);
        setAngularVelocity(0);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    };

    const renderProjectileSimulation = () => (
        <div className="bg-gradient-to-b from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-sky-800/20 rounded-2xl p-6 relative overflow-hidden" style={{ height: 400 }}>
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-green-500/30 dark:bg-green-700/30 border-t-2 border-green-600 dark:border-green-500" />

            {/* Trajectory */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                {trajectory.length > 1 && (
                    <path
                        d={`M ${trajectory.map(p => `${p.x},${p.y}`).join(' L ')}`}
                        fill="none"
                        stroke="rgba(239, 68, 68, 0.5)"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                    />
                )}
            </svg>

            {/* Projectile */}
            <motion.div
                className="absolute w-6 h-6 bg-red-500 rounded-full shadow-lg"
                style={{
                    left: projectilePos.x - 12,
                    top: projectilePos.y - 12
                }}
                animate={{ scale: isRunning ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 0.3 }}
            />

            {/* Launcher */}
            <div
                className="absolute w-16 h-4 bg-gray-700 rounded origin-left"
                style={{
                    left: 50,
                    bottom: 50,
                    transform: `rotate(-${angle}deg)`
                }}
            />
        </div>
    );

    const renderWaveSimulation = () => (
        <div className="bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-2xl p-6 relative overflow-hidden" style={{ height: 400 }}>
            <svg className="w-full h-full">
                {/* Wave 1 */}
                <path
                    d={Array.from({ length: 100 }, (_, i) => {
                        const x = (i / 100) * 800;
                        const y = 150 + waveAmplitude * Math.sin(waveFrequency * (i / 10) + wavePhase);
                        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.8)"
                    strokeWidth="3"
                />
                {/* Wave 2 (interference) */}
                <path
                    d={Array.from({ length: 100 }, (_, i) => {
                        const x = (i / 100) * 800;
                        const y = 250 + waveAmplitude * Math.sin(waveFrequency * (i / 10) + wavePhase + Math.PI);
                        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.6)"
                    strokeWidth="3"
                />
            </svg>
        </div>
    );

    const renderPendulumSimulation = () => {
        const pivotX = 400;
        const pivotY = 50;
        const bobX = pivotX + pendulumLength * Math.sin(pendulumAngle);
        const bobY = pivotY + pendulumLength * Math.cos(pendulumAngle);

        return (
            <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20 rounded-2xl p-6 relative overflow-hidden" style={{ height: 400 }}>
                <svg className="w-full h-full">
                    {/* Pivot */}
                    <circle cx={pivotX} cy={pivotY} r="8" fill="#374151" />
                    {/* String */}
                    <line x1={pivotX} y1={pivotY} x2={bobX} y2={bobY} stroke="#374151" strokeWidth="2" />
                    {/* Bob */}
                    <circle cx={bobX} cy={bobY} r="20" fill="#8B5CF6" />
                </svg>
            </div>
        );
    };

    const [circuitDescription, setCircuitDescription] = useState('A 10V battery connected to a 5 ohm resistor and a 10 ohm resistor in parallel.');
    const [circuitAnalysis, setCircuitAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyzeCircuit = async () => {
        setIsAnalyzing(true);
        try {
            // Using the new solve endpoint for circuit analysis
            const res = await labsService.solveEquation(`Analyze this circuit: ${circuitDescription}`);
            setCircuitAnalysis(res.solution);
        } catch (err) {
            setCircuitAnalysis('Failed to analyze circuit. Please check your connection.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const renderCircuitSimulation = () => (
        <div className="bg-gradient-to-b from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 relative flex flex-col" style={{ height: 400 }}>
            <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                    AI Circuit Assistant (v1.0)
                </h3>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-surface-500">
                        Circuit Description
                    </label>
                    <textarea
                        value={circuitDescription}
                        onChange={(e) => setCircuitDescription(e.target.value)}
                        className="flex-1 p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-yellow-500/30 focus:border-yellow-500 outline-none text-sm resize-none"
                        placeholder="Describe your circuit components and connections..."
                    />
                    <button
                        onClick={analyzeCircuit}
                        disabled={isAnalyzing}
                        className="py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Run Simulation'}
                    </button>
                </div>

                <div className="flex flex-col gap-2 overflow-hidden">
                    <label className="text-xs font-medium uppercase tracking-wider text-surface-500">
                        Analysis Results
                    </label>
                    <div className="flex-1 p-3 rounded-xl bg-black/5 dark:bg-black/40 border border-surface-200 dark:border-surface-700 overflow-y-auto text-sm font-mono whitespace-pre-wrap">
                        {circuitAnalysis || 'Simulation results will appear here...'}
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
                    <Zap className="w-8 h-8 text-yellow-500" />
                    Physics Lab
                </h1>
                <p className="text-surface-600 dark:text-surface-400 mt-2">
                    Interactive physics simulations and experiments
                </p>
            </div>

            {/* Simulation Selector */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[
                    { id: Physics_Simulations.PROJECTILE, name: 'Projectile Motion', icon: Target },
                    { id: Physics_Simulations.PENDULUM, name: 'Pendulum', icon: CircleDot },
                    { id: Physics_Simulations.WAVES, name: 'Wave Interference', icon: Maximize2 },
                    { id: Physics_Simulations.CIRCUITS, name: 'Circuits', icon: Zap },
                    { id: Physics_Simulations.EQUATION_SOLVER, name: 'Equation Solver', icon: Calculator }
                ].map(sim => (
                    <button
                        key={sim.id}
                        onClick={() => { setSimulation(sim.id); resetSimulation(); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${simulation === sim.id
                            ? 'bg-yellow-500 text-white'
                            : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                            }`}
                    >
                        <sim.icon className="w-4 h-4" />
                        {sim.name}
                    </button>
                ))}
            </div>

            {/* Simulation Canvas */}
            <div className="mb-6">
                {simulation === Physics_Simulations.PROJECTILE && renderProjectileSimulation()}
                {simulation === Physics_Simulations.PENDULUM && renderPendulumSimulation()}
                {simulation === Physics_Simulations.WAVES && renderWaveSimulation()}
                {simulation === Physics_Simulations.CIRCUITS && renderCircuitSimulation()}
                {simulation === Physics_Simulations.EQUATION_SOLVER && (
                    <div className="bg-gradient-to-b from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6" style={{ minHeight: 400 }}>
                        <div className="flex items-center gap-3 mb-6">
                            <Calculator className="w-6 h-6 text-purple-500" />
                            <h3 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
                                SymPy Equation Solver
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Equation (Python syntax)
                                </label>
                                <input
                                    type="text"
                                    value={equation}
                                    onChange={(e) => setEquation(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-purple-500/30 focus:border-purple-500 outline-none font-mono"
                                    placeholder="x**2 - 4"
                                />
                                <p className="text-xs text-surface-500 mt-1">Examples: x**2 - 4, sin(x) - 0.5, x**3 - 2*x + 1</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                    Equation Type
                                </label>
                                <select
                                    value={equationType}
                                    onChange={(e) => setEquationType(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/20 border border-purple-500/30 focus:border-purple-500 outline-none"
                                >
                                    <option value="algebraic">Algebraic</option>
                                    <option value="ode">Ordinary Differential Equation</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={solveEquation}
                            disabled={isSolving || !equation.trim()}
                            className="mb-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                        >
                            {isSolving ? 'Solving with SymPy...' : 'Solve Equation'}
                        </button>

                        <DerivationViewer
                            latex={solverResult?.derivation_latex}
                            assumptions={solverResult?.assumptions}
                            evidence={solverResult?.evidence}
                            subject={solverResult?.subject}
                            isLoading={isSolving}
                            error={solverError}
                        />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 p-6">
                <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Parameters
                </h3>

                {simulation === Physics_Simulations.PROJECTILE && (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Launch Angle: {angle}°
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="90"
                                value={angle}
                                onChange={(e) => setAngle(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Initial Velocity: {velocity} m/s
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={velocity}
                                onChange={(e) => setVelocity(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}

                {simulation === Physics_Simulations.WAVES && (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Frequency: {waveFrequency} Hz
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="5"
                                step="0.5"
                                value={waveFrequency}
                                onChange={(e) => setWaveFrequency(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Amplitude: {waveAmplitude} px
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={waveAmplitude}
                                onChange={(e) => setWaveAmplitude(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}

                {simulation === Physics_Simulations.PENDULUM && (
                    <div>
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Pendulum Length: {pendulumLength} px
                        </label>
                        <input
                            type="range"
                            min="100"
                            max="300"
                            value={pendulumLength}
                            onChange={(e) => setPendulumLength(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={simulation === Physics_Simulations.PROJECTILE ? runProjectile : () => setIsRunning(!isRunning)}
                        disabled={isRunning && simulation === Physics_Simulations.PROJECTILE}
                        className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        {isRunning ? 'Pause' : 'Run'}
                    </button>
                    <button
                        onClick={resetSimulation}
                        className="px-6 py-3 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors flex items-center gap-2"
                    >
                        <RotateCcw className="w-5 h-5" />
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhysicsLab;
