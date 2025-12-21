/**
 * Interactive Visualizer Component
 * Uses Plotly.js to render mathematical functions and data
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ZoomIn, ZoomOut, Download, RotateCcw, Maximize2 } from 'lucide-react';

// Plotly.js - will be loaded from CDN if not installed
let Plotly = null;

const loadPlotly = async () => {
    if (Plotly) return Plotly;

    // Check if already loaded globally
    if (window.Plotly) {
        Plotly = window.Plotly;
        return Plotly;
    }

    // Load from CDN
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.plot.ly/plotly-2.27.0.min.js';
        script.onload = () => {
            Plotly = window.Plotly;
            resolve(Plotly);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * Parse a symbolic expression and generate plottable data
 */
const generatePlotData = (expression, xRange = [-10, 10], numPoints = 200) => {
    try {
        // Clean the expression
        let expr = expression
            .replace(/\^/g, '**')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/log/g, 'Math.log')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/abs/g, 'Math.abs')
            .replace(/exp/g, 'Math.exp')
            .replace(/pi/gi, 'Math.PI')
            .replace(/e(?![x])/gi, 'Math.E');

        const xValues = [];
        const yValues = [];
        const step = (xRange[1] - xRange[0]) / numPoints;

        for (let i = 0; i <= numPoints; i++) {
            const x = xRange[0] + i * step;
            xValues.push(x);

            try {
                // Create a function from the expression
                const fn = new Function('x', `return ${expr}`);
                const y = fn(x);

                // Handle invalid values
                if (isNaN(y) || !isFinite(y)) {
                    yValues.push(null);
                } else {
                    yValues.push(y);
                }
            } catch {
                yValues.push(null);
            }
        }

        return { x: xValues, y: yValues, success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

/**
 * Main Visualizer Component
 */
const Visualizer = ({
    expression,
    result,
    derivation,
    type = 'function', // 'function' | 'data' | 'scatter'
    xRange = [-10, 10],
    title = '',
    onCapture,
    className = ''
}) => {
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(1);

    // Generate plot data from expression
    const plotData = useMemo(() => {
        if (!expression && !result) return null;

        // Check if result contains a function of x
        const exprToPlot = derivation || result || expression;

        // Only plot if expression contains 'x'
        if (!exprToPlot || !exprToPlot.includes('x')) {
            return null;
        }

        return generatePlotData(exprToPlot, xRange);
    }, [expression, result, derivation, xRange]);

    // Load Plotly and render chart
    useEffect(() => {
        if (!plotData?.success || !containerRef.current) return;

        const renderPlot = async () => {
            try {
                await loadPlotly();
                setIsLoaded(true);

                const trace = {
                    x: plotData.x,
                    y: plotData.y,
                    type: type === 'scatter' ? 'scatter' : 'scatter',
                    mode: 'lines',
                    line: {
                        color: '#7C3AED',
                        width: 2
                    },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(124, 58, 237, 0.1)',
                    name: expression || 'f(x)'
                };

                const layout = {
                    title: {
                        text: title || expression || 'Function Plot',
                        font: { color: '#E5E7EB', size: 14 }
                    },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(17, 24, 39, 0.8)',
                    font: { color: '#9CA3AF' },
                    xaxis: {
                        title: 'x',
                        gridcolor: 'rgba(75, 85, 99, 0.5)',
                        zerolinecolor: 'rgba(107, 114, 128, 0.8)',
                        tickfont: { color: '#9CA3AF' }
                    },
                    yaxis: {
                        title: 'f(x)',
                        gridcolor: 'rgba(75, 85, 99, 0.5)',
                        zerolinecolor: 'rgba(107, 114, 128, 0.8)',
                        tickfont: { color: '#9CA3AF' }
                    },
                    margin: { t: 40, r: 20, b: 40, l: 50 },
                    showlegend: false
                };

                const config = {
                    responsive: true,
                    displayModeBar: false
                };

                Plotly.newPlot(containerRef.current, [trace], layout, config);
            } catch (err) {
                setError(err.message);
            }
        };

        renderPlot();

        return () => {
            if (containerRef.current && Plotly) {
                Plotly.purge(containerRef.current);
            }
        };
    }, [plotData, type, title, expression, zoom]);

    // Handle screenshot capture
    const handleCapture = async () => {
        if (!containerRef.current || !Plotly) return;

        try {
            const dataUrl = await Plotly.toImage(containerRef.current, {
                format: 'png',
                width: 800,
                height: 500
            });

            if (onCapture) {
                onCapture(dataUrl);
            }

            return dataUrl;
        } catch (err) {
            console.error('Capture failed:', err);
        }
    };

    // Handle zoom
    const handleZoom = (factor) => {
        setZoom(prev => Math.max(0.5, Math.min(3, prev * factor)));
    };

    // Reset view
    const handleReset = () => {
        if (containerRef.current && Plotly) {
            Plotly.relayout(containerRef.current, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        }
    };

    // No plottable expression
    if (!plotData || !plotData.success) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden ${className}`}
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300">Function Plot</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handleZoom(1.2)}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                        onClick={() => handleZoom(0.8)}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Reset View"
                    >
                        <RotateCcw className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                        onClick={handleCapture}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Download Image"
                    >
                        <Download className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Plot Container */}
            <div
                ref={containerRef}
                className="w-full h-64"
                style={{ minHeight: '250px' }}
            />

            {error && (
                <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/30">
                    <p className="text-xs text-red-400">{error}</p>
                </div>
            )}
        </motion.div>
    );
};

export default Visualizer;
