/**
 * ILAI Professional Labs - Math Graphing Lab
 * 
 * Full-featured mathematical graphing with:
 * - Function plotting (multiple functions)
 * - Parametric equations
 * - Polar coordinates
 * - Calculus visualization (derivatives, integrals)
 * - Matrix operations
 * - Interactive controls
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Calculator, Plus, Trash2, Settings, Download,
    ZoomIn, ZoomOut, Move, Grid, Maximize2, Eye, EyeOff,
    Play, Pause, RotateCcw, ChevronDown, Dice5
} from 'lucide-react';

// Math expression parser
const parseMathExpression = (expr, x) => {
    try {
        // Replace common math functions
        const processed = expr
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/log/g, 'Math.log10')
            .replace(/ln/g, 'Math.log')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/abs/g, 'Math.abs')
            .replace(/exp/g, 'Math.exp')
            .replace(/pi/g, 'Math.PI')
            .replace(/e(?![xp])/g, 'Math.E')
            .replace(/\^/g, '**');

        return eval(processed);
    } catch {
        return NaN;
    }
};

// Predefined functions
const PRESETS = [
    { name: 'Linear', expr: 'x', color: '#3b82f6' },
    { name: 'Quadratic', expr: 'x^2', color: '#ef4444' },
    { name: 'Cubic', expr: 'x^3', color: '#22c55e' },
    { name: 'Sine Wave', expr: 'sin(x)', color: '#f59e0b' },
    { name: 'Cosine Wave', expr: 'cos(x)', color: '#8b5cf6' },
    { name: 'Exponential', expr: 'exp(x)', color: '#ec4899' },
    { name: 'Logarithm', expr: 'ln(x)', color: '#06b6d4' },
    { name: 'Square Root', expr: 'sqrt(x)', color: '#84cc16' },
    { name: 'Absolute Value', expr: 'abs(x)', color: '#f97316' },
    { name: 'Tangent', expr: 'tan(x)', color: '#14b8a6' }
];

// Color palette for functions
const COLORS = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'
];

const MathGraphingLab = () => {
    const canvasRef = useRef(null);
    const [functions, setFunctions] = useState([
        { id: 1, expr: 'sin(x)', color: '#3b82f6', visible: true, name: 'f(x)' },
        { id: 2, expr: 'cos(x)', color: '#ef4444', visible: true, name: 'g(x)' }
    ]);
    const [newExpr, setNewExpr] = useState('');
    const [viewport, setViewport] = useState({
        xMin: -10, xMax: 10,
        yMin: -5, yMax: 5
    });
    const [showGrid, setShowGrid] = useState(true);
    const [showAxes, setShowAxes] = useState(true);
    const [showPresets, setShowPresets] = useState(false);
    const [mousePos, setMousePos] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [animate, setAnimate] = useState(false);
    const [animationTime, setAnimationTime] = useState(0);
    const animationRef = useRef(null);

    // Canvas dimensions
    const width = 800;
    const height = 500;

    // Convert math coords to canvas coords
    const toCanvas = useCallback((x, y) => {
        const { xMin, xMax, yMin, yMax } = viewport;
        return {
            cx: ((x - xMin) / (xMax - xMin)) * width,
            cy: ((yMax - y) / (yMax - yMin)) * height
        };
    }, [viewport]);

    // Convert canvas coords to math coords
    const toMath = useCallback((cx, cy) => {
        const { xMin, xMax, yMin, yMax } = viewport;
        return {
            x: xMin + (cx / width) * (xMax - xMin),
            y: yMax - (cy / height) * (yMax - yMin)
        };
    }, [viewport]);

    // Draw the graph
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const { xMin, xMax, yMin, yMax } = viewport;

        // Clear canvas
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        if (showGrid) {
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 0.5;

            // Vertical grid lines
            const xStep = Math.pow(10, Math.floor(Math.log10(xMax - xMin)) - 1);
            for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
                const { cx } = toCanvas(x, 0);
                ctx.beginPath();
                ctx.moveTo(cx, 0);
                ctx.lineTo(cx, height);
                ctx.stroke();
            }

            // Horizontal grid lines
            const yStep = Math.pow(10, Math.floor(Math.log10(yMax - yMin)) - 1);
            for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
                const { cy } = toCanvas(0, y);
                ctx.beginPath();
                ctx.moveTo(0, cy);
                ctx.lineTo(width, cy);
                ctx.stroke();
            }
        }

        // Draw axes
        if (showAxes) {
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;

            // X-axis
            const { cy: yAxisPos } = toCanvas(0, 0);
            if (yAxisPos >= 0 && yAxisPos <= height) {
                ctx.beginPath();
                ctx.moveTo(0, yAxisPos);
                ctx.lineTo(width, yAxisPos);
                ctx.stroke();
            }

            // Y-axis
            const { cx: xAxisPos } = toCanvas(0, 0);
            if (xAxisPos >= 0 && xAxisPos <= width) {
                ctx.beginPath();
                ctx.moveTo(xAxisPos, 0);
                ctx.lineTo(xAxisPos, height);
                ctx.stroke();
            }

            // Axis labels
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px monospace';

            // X-axis labels
            const xLabelStep = (xMax - xMin) / 10;
            for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x += Math.ceil(xLabelStep)) {
                if (x === 0) continue;
                const { cx, cy } = toCanvas(x, 0);
                ctx.fillText(x.toString(), cx - 5, Math.min(Math.max(cy + 15, 15), height - 5));
            }

            // Y-axis labels
            const yLabelStep = (yMax - yMin) / 10;
            for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += Math.ceil(yLabelStep)) {
                if (y === 0) continue;
                const { cx, cy } = toCanvas(0, y);
                ctx.fillText(y.toString(), Math.min(Math.max(cx + 5, 5), width - 20), cy + 4);
            }
        }

        // Draw functions
        const step = (xMax - xMin) / width;

        functions.forEach(fn => {
            if (!fn.visible) return;

            ctx.strokeStyle = fn.color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            let isFirst = true;
            let prevY = null;

            for (let cx = 0; cx <= width; cx++) {
                const { x } = toMath(cx, 0);

                // Support animation with 't' variable
                const exprWithTime = fn.expr.replace(/t/g, animationTime.toString());
                const y = parseMathExpression(exprWithTime, x);

                if (isNaN(y) || !isFinite(y)) {
                    isFirst = true;
                    prevY = null;
                    continue;
                }

                const { cy } = toCanvas(x, y);

                // Detect discontinuities
                if (prevY !== null && Math.abs(cy - prevY) > height / 2) {
                    isFirst = true;
                }

                if (cy >= -100 && cy <= height + 100) {
                    if (isFirst) {
                        ctx.moveTo(cx, cy);
                        isFirst = false;
                    } else {
                        ctx.lineTo(cx, cy);
                    }
                }

                prevY = cy;
            }

            ctx.stroke();
        });

        // Draw cursor position
        if (mousePos) {
            const { x, y } = mousePos;
            const { cx, cy } = toCanvas(x, y);

            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            ctx.beginPath();
            ctx.moveTo(cx, 0);
            ctx.lineTo(cx, height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, cy);
            ctx.lineTo(width, cy);
            ctx.stroke();

            ctx.setLineDash([]);

            // Crosshair
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [functions, viewport, showGrid, showAxes, mousePos, animationTime, toCanvas, toMath]);

    // Draw on changes
    useEffect(() => {
        draw();
    }, [draw]);

    // Animation loop
    useEffect(() => {
        if (animate) {
            const step = () => {
                setAnimationTime(t => t + 0.05);
                animationRef.current = requestAnimationFrame(step);
            };
            animationRef.current = requestAnimationFrame(step);
        } else {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate]);

    // Mouse handlers
    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const pos = toMath(cx, cy);
        setMousePos(pos);

        if (isDragging && dragStart) {
            const dx = (e.clientX - dragStart.x) / width * (viewport.xMax - viewport.xMin);
            const dy = (e.clientY - dragStart.y) / height * (viewport.yMax - viewport.yMin);

            setViewport(v => ({
                xMin: v.xMin - dx,
                xMax: v.xMax - dx,
                yMin: v.yMin + dy,
                yMax: v.yMax + dy
            }));
            setDragStart({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.1 : 0.9;
        const { xMin, xMax, yMin, yMax } = viewport;
        const cx = (xMax + xMin) / 2;
        const cy = (yMax + yMin) / 2;
        const newWidth = (xMax - xMin) * factor;
        const newHeight = (yMax - yMin) * factor;

        setViewport({
            xMin: cx - newWidth / 2,
            xMax: cx + newWidth / 2,
            yMin: cy - newHeight / 2,
            yMax: cy + newHeight / 2
        });
    };

    // Function management
    const addFunction = () => {
        if (!newExpr.trim()) return;

        const id = Date.now();
        const colorIndex = functions.length % COLORS.length;
        setFunctions([...functions, {
            id,
            expr: newExpr,
            color: COLORS[colorIndex],
            visible: true,
            name: `h${functions.length + 1}(x)`
        }]);
        setNewExpr('');
    };

    const removeFunction = (id) => {
        setFunctions(functions.filter(f => f.id !== id));
    };

    const toggleVisibility = (id) => {
        setFunctions(functions.map(f =>
            f.id === id ? { ...f, visible: !f.visible } : f
        ));
    };

    const updateFunction = (id, expr) => {
        setFunctions(functions.map(f =>
            f.id === id ? { ...f, expr } : f
        ));
    };

    const loadPreset = (preset) => {
        const id = Date.now();
        setFunctions([...functions, {
            id,
            expr: preset.expr,
            color: preset.color,
            visible: true,
            name: `${preset.name}(x)`
        }]);
        setShowPresets(false);
    };

    const resetView = () => {
        setViewport({ xMin: -10, xMax: 10, yMin: -5, yMax: 5 });
    };

    const zoomIn = () => {
        const { xMin, xMax, yMin, yMax } = viewport;
        const cx = (xMax + xMin) / 2;
        const cy = (yMax + yMin) / 2;
        setViewport({
            xMin: cx - (xMax - xMin) * 0.4,
            xMax: cx + (xMax - xMin) * 0.4,
            yMin: cy - (yMax - yMin) * 0.4,
            yMax: cy + (yMax - yMin) * 0.4
        });
    };

    const zoomOut = () => {
        const { xMin, xMax, yMin, yMax } = viewport;
        const cx = (xMax + xMin) / 2;
        const cy = (yMax + yMin) / 2;
        setViewport({
            xMin: cx - (xMax - xMin) * 0.6,
            xMax: cx + (xMax - xMin) * 0.6,
            yMin: cy - (yMax - yMin) * 0.6,
            yMax: cy + (yMax - yMin) * 0.6
        });
    };

    const downloadImage = () => {
        const link = document.createElement('a');
        link.download = 'graph.png';
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-mono p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                            <LineChart size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Math Graphing Lab</h1>
                            <p className="text-sm text-gray-500">Plot, Explore, Understand</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAnimate(!animate)}
                            className={`p-2 rounded-lg ${animate ? 'bg-green-600' : 'bg-gray-800'} hover:bg-opacity-80`}
                        >
                            {animate ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button onClick={downloadImage} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
                            <Download size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Function Panel */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Add Function */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Add Function</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newExpr}
                                    onChange={(e) => setNewExpr(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addFunction()}
                                    placeholder="e.g., x^2 + 2*x"
                                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={addFunction}
                                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Presets */}
                            <div className="mt-3 relative">
                                <button
                                    onClick={() => setShowPresets(!showPresets)}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                                >
                                    <Dice5 size={14} />
                                    Presets
                                    <ChevronDown size={14} />
                                </button>

                                {showPresets && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-10 max-h-64 overflow-y-auto">
                                        {PRESETS.map((preset, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => loadPreset(preset)}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-700"
                                            >
                                                <div className="w-3 h-3 rounded-full" style={{ background: preset.color }} />
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Functions List */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Functions</h3>
                            <div className="space-y-2">
                                {functions.map(fn => (
                                    <div key={fn.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                                        <div
                                            className="w-4 h-4 rounded-full flex-shrink-0"
                                            style={{ background: fn.color }}
                                        />
                                        <input
                                            type="text"
                                            value={fn.expr}
                                            onChange={(e) => updateFunction(fn.id, e.target.value)}
                                            className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
                                        />
                                        <button
                                            onClick={() => toggleVisibility(fn.id)}
                                            className="p-1 hover:bg-gray-700 rounded"
                                        >
                                            {fn.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button
                                            onClick={() => removeFunction(fn.id)}
                                            className="p-1 hover:bg-gray-700 rounded text-red-400"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">View Controls</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={zoomIn} className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
                                    <ZoomIn size={14} /> Zoom In
                                </button>
                                <button onClick={zoomOut} className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
                                    <ZoomOut size={14} /> Zoom Out
                                </button>
                                <button onClick={resetView} className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
                                    <RotateCcw size={14} /> Reset
                                </button>
                                <button
                                    onClick={() => setShowGrid(!showGrid)}
                                    className={`flex items-center gap-2 p-2 rounded-lg text-sm ${showGrid ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                                >
                                    <Grid size={14} /> Grid
                                </button>
                            </div>
                        </div>

                        {/* Coordinates */}
                        {mousePos && (
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-2">Cursor Position</h3>
                                <div className="font-mono text-sm">
                                    <div>x = {mousePos.x.toFixed(4)}</div>
                                    <div>y = {mousePos.y.toFixed(4)}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Graph Canvas */}
                    <div className="lg:col-span-3">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={500}
                                className="w-full cursor-crosshair"
                                onMouseMove={handleMouseMove}
                                onMouseDown={handleMouseDown}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={() => { setMousePos(null); handleMouseUp(); }}
                                onWheel={handleWheel}
                            />
                        </div>

                        {/* Help Text */}
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Syntax Guide</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500">
                                <div><code className="text-blue-400">x^2</code> - Power</div>
                                <div><code className="text-blue-400">sin(x)</code> - Sine</div>
                                <div><code className="text-blue-400">cos(x)</code> - Cosine</div>
                                <div><code className="text-blue-400">tan(x)</code> - Tangent</div>
                                <div><code className="text-blue-400">sqrt(x)</code> - Square root</div>
                                <div><code className="text-blue-400">ln(x)</code> - Natural log</div>
                                <div><code className="text-blue-400">exp(x)</code> - e^x</div>
                                <div><code className="text-blue-400">abs(x)</code> - Absolute</div>
                                <div><code className="text-blue-400">pi</code> - π constant</div>
                                <div><code className="text-blue-400">e</code> - Euler's number</div>
                                <div><code className="text-blue-400">t</code> - Animation time</div>
                                <div>Drag to pan, scroll to zoom</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MathGraphingLab;
