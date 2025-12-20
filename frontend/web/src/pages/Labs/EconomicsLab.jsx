/**
 * ILAI Professional Labs - Economics Lab (PhD Level)
 * 
 * Research-grade economics simulation with:
 * - Supply/Demand curves
 * - Market equilibrium
 * - GDP calculator
 * - Stock market simulation
 * - Economic indicators
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart,
    Activity, RefreshCw, Play, Pause, Settings, Info, Calculator
} from 'lucide-react';
import labsService from '../../services/labsService';
import DerivationViewer from '../../components/labs/DerivationViewer';

// Economic data
const COUNTRIES = [
    { name: 'USA', gdp: 25462.7, population: 331.9, currency: 'USD', growth: 2.1 },
    { name: 'China', gdp: 17963.2, population: 1412.0, currency: 'CNY', growth: 3.0 },
    { name: 'Japan', gdp: 4231.1, population: 125.7, currency: 'JPY', growth: 1.1 },
    { name: 'Germany', gdp: 4072.2, population: 83.2, currency: 'EUR', growth: 1.8 },
    { name: 'UK', gdp: 3070.7, population: 67.5, currency: 'GBP', growth: 0.4 },
    { name: 'India', gdp: 3385.1, population: 1417.2, currency: 'INR', growth: 6.8 },
    { name: 'France', gdp: 2782.9, population: 67.8, currency: 'EUR', growth: 0.7 },
    { name: 'Brazil', gdp: 1920.1, population: 215.3, currency: 'BRL', growth: 2.9 }
];

// Economic concepts
const CONCEPTS = [
    {
        name: 'Supply & Demand',
        description: 'The relationship between the quantity of a commodity that producers wish to sell and the quantity that consumers wish to buy.',
        formula: 'Qd = a - bP, Qs = c + dP'
    },
    {
        name: 'Elasticity',
        description: 'A measure of a variable\'s sensitivity to a change in another variable.',
        formula: 'Ed = (ΔQ/Q) / (ΔP/P)'
    },
    {
        name: 'GDP',
        description: 'Gross Domestic Product - the total monetary value of all goods and services produced within a country.',
        formula: 'GDP = C + I + G + (X - M)'
    },
    {
        name: 'Inflation',
        description: 'The rate at which the general level of prices for goods and services is rising.',
        formula: 'Inflation = ((CPI₁ - CPI₀) / CPI₀) × 100'
    }
];

const EconomicsLab = () => {
    const canvasRef = useRef(null);
    const [activeTab, setActiveTab] = useState('supply-demand');
    const [supplyParams, setSupplyParams] = useState({ c: 10, d: 2 }); // Qs = c + dP
    const [demandParams, setDemandParams] = useState({ a: 100, b: 3 }); // Qd = a - bP
    const [equilibrium, setEquilibrium] = useState({ price: 0, quantity: 0 });
    const [stockPrice, setStockPrice] = useState(100);
    const [stockHistory, setStockHistory] = useState([100]);
    const [isSimulating, setIsSimulating] = useState(false);
    const simulationRef = useRef(null);

    // SciPy Equilibrium state
    const [scipyResult, setScipyResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calcError, setCalcError] = useState(null);

    const calculateWithSciPy = async () => {
        setIsCalculating(true);
        setCalcError(null);
        setScipyResult(null);
        try {
            const result = await labsService.calculateEquilibrium({
                supplyIntercept: supplyParams.c,
                supplySlope: supplyParams.d,
                demandIntercept: demandParams.a,
                demandSlope: demandParams.b
            });
            if (result.success) {
                setScipyResult(result);
            } else {
                setCalcError(result.error);
            }
        } catch (err) {
            setCalcError(err.message || 'Failed to calculate equilibrium');
        } finally {
            setIsCalculating(false);
        }
    };

    // Calculate equilibrium
    useEffect(() => {
        // Qd = Qs => a - bP = c + dP => P = (a - c) / (b + d)
        const price = (demandParams.a - supplyParams.c) / (demandParams.b + supplyParams.d);
        const quantity = supplyParams.c + supplyParams.d * price;
        setEquilibrium({ price: Math.max(0, price), quantity: Math.max(0, quantity) });
    }, [supplyParams, demandParams]);

    // Draw supply/demand curves
    const drawCurves = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 50;

        // Clear
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, width, height);

        // Draw axes
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;

        // Y-axis (Price)
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // X-axis (Quantity)
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px monospace';
        ctx.fillText('Price (P)', padding + 10, padding - 10);
        ctx.fillText('Quantity (Q)', width - padding - 60, height - padding + 30);

        // Scale factors
        const maxP = 40;
        const maxQ = 120;
        const scaleX = (width - 2 * padding) / maxQ;
        const scaleY = (height - 2 * padding) / maxP;

        const toCanvas = (q, p) => ({
            x: padding + q * scaleX,
            y: height - padding - p * scaleY
        });

        // Draw Demand curve (downward sloping)
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let p = 0; p <= maxP; p++) {
            const q = demandParams.a - demandParams.b * p;
            if (q < 0) continue;
            const { x, y } = toCanvas(q, p);
            if (p === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw Supply curve (upward sloping)
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let p = 0; p <= maxP; p++) {
            const q = supplyParams.c + supplyParams.d * p;
            if (q > maxQ) continue;
            const { x, y } = toCanvas(q, p);
            if (p === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw equilibrium point
        if (equilibrium.price > 0 && equilibrium.quantity > 0) {
            const { x, y } = toCanvas(equilibrium.quantity, equilibrium.price);

            // Dashed lines
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(x, y);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
            ctx.setLineDash([]);

            // Point
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`E (${equilibrium.quantity.toFixed(1)}, ${equilibrium.price.toFixed(1)})`, x + 15, y - 10);
        }

        // Legend
        ctx.font = '12px monospace';
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(width - 120, 20, 15, 15);
        ctx.fillStyle = '#fff';
        ctx.fillText('Demand', width - 100, 32);

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(width - 120, 45, 15, 15);
        ctx.fillStyle = '#fff';
        ctx.fillText('Supply', width - 100, 57);

    }, [supplyParams, demandParams, equilibrium]);

    useEffect(() => {
        if (activeTab === 'supply-demand') {
            drawCurves();
        }
    }, [activeTab, drawCurves]);

    // Stock simulation with events
    const simulateStock = useCallback(() => {
        const events = [
            { msg: "Interest rates held steady", impact: 1.02 },
            { msg: "Tech sector rally", impact: 1.05 },
            { msg: "Energy crunch concerns", impact: 0.95 },
            { msg: "GDP growth exceeding forecasts", impact: 1.03 },
            { msg: "Supply chain disruptions", impact: 0.92 }
        ];

        setStockPrice(prev => {
            const event = Math.random() > 0.9 ? events[Math.floor(Math.random() * events.length)] : null;
            const bias = event ? event.impact : 1.001; // Slight natural growth
            const volatility = (Math.random() - 0.5) * 4;

            const newPrice = Math.max(1, (prev * bias) + volatility);
            setStockHistory(hist => [...hist.slice(-99), newPrice]);

            if (event && isSimulating) {
                console.log(`ECON EVENT: ${event.msg}`);
            }
            return newPrice;
        });
    }, [isSimulating]);

    useEffect(() => {
        if (isSimulating) {
            simulationRef.current = setInterval(simulateStock, 500);
        } else {
            if (simulationRef.current) {
                clearInterval(simulationRef.current);
            }
        }
        return () => {
            if (simulationRef.current) {
                clearInterval(simulationRef.current);
            }
        };
    }, [isSimulating, simulateStock]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Economics Lab</h1>
                            <p className="text-sm text-gray-500">Market Simulation & Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {['supply-demand', 'equilibrium', 'gdp', 'stocks', 'concepts'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                ? 'bg-lime-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>

                {/* Supply & Demand Tab */}
                {activeTab === 'supply-demand' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="space-y-4">
                            {/* Demand Parameters */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-blue-400 mb-3">Demand: Qd = a - bP</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500">a (Intercept): {demandParams.a}</label>
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={demandParams.a}
                                            onChange={(e) => setDemandParams(p => ({ ...p, a: parseInt(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">b (Slope): {demandParams.b}</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            value={demandParams.b}
                                            onChange={(e) => setDemandParams(p => ({ ...p, b: parseFloat(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Supply Parameters */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-green-400 mb-3">Supply: Qs = c + dP</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-500">c (Intercept): {supplyParams.c}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="50"
                                            value={supplyParams.c}
                                            onChange={(e) => setSupplyParams(p => ({ ...p, c: parseInt(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">d (Slope): {supplyParams.d}</label>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="5"
                                            step="0.5"
                                            value={supplyParams.d}
                                            onChange={(e) => setSupplyParams(p => ({ ...p, d: parseFloat(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Equilibrium */}
                            <div className="bg-gray-900 rounded-xl border border-yellow-500/30 p-4">
                                <h3 className="text-sm font-medium text-yellow-400 mb-3">Equilibrium Point</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Price (P*)</span>
                                        <span className="font-mono text-white">${equilibrium.price.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Quantity (Q*)</span>
                                        <span className="font-mono text-white">{equilibrium.quantity.toFixed(2)} units</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                                <canvas ref={canvasRef} width={700} height={450} className="w-full" />
                            </div>
                        </div>
                    </div>
                )}

                {/* SciPy Equilibrium Tab */}
                {activeTab === 'equilibrium' && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Calculator className="w-6 h-6 text-lime-400" />
                            <h3 className="text-xl font-semibold text-white">
                                SciPy Market Equilibrium Calculator
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-blue-400">Demand Function: Qd = a - b·P</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">a (intercept)</label>
                                        <input
                                            type="number"
                                            value={demandParams.a}
                                            onChange={(e) => setDemandParams(p => ({ ...p, a: parseInt(e.target.value) || 0 }))}
                                            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">b (slope)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={demandParams.b}
                                            onChange={(e) => setDemandParams(p => ({ ...p, b: parseFloat(e.target.value) || 0 }))}
                                            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-green-400">Supply Function: Qs = c + d·P</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">c (intercept)</label>
                                        <input
                                            type="number"
                                            value={supplyParams.c}
                                            onChange={(e) => setSupplyParams(p => ({ ...p, c: parseInt(e.target.value) || 0 }))}
                                            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">d (slope)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={supplyParams.d}
                                            onChange={(e) => setSupplyParams(p => ({ ...p, d: parseFloat(e.target.value) || 0 }))}
                                            className="w-full p-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={calculateWithSciPy}
                            disabled={isCalculating}
                            className="mb-6 px-6 py-3 bg-lime-600 hover:bg-lime-500 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                        >
                            {isCalculating ? 'Calculating with SciPy...' : 'Calculate Equilibrium'}
                        </button>

                        {scipyResult && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-800 p-4 rounded-xl">
                                    <div className="text-xs text-gray-500 uppercase">Equilibrium Price</div>
                                    <div className="text-xl font-bold text-yellow-400">${scipyResult.equilibrium_price}</div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl">
                                    <div className="text-xs text-gray-500 uppercase">Equilibrium Quantity</div>
                                    <div className="text-xl font-bold text-blue-400">{scipyResult.equilibrium_quantity} units</div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl">
                                    <div className="text-xs text-gray-500 uppercase">Supply Elasticity</div>
                                    <div className="text-xl font-bold text-green-400">{scipyResult.elasticity_supply}</div>
                                </div>
                                <div className="bg-gray-800 p-4 rounded-xl">
                                    <div className="text-xs text-gray-500 uppercase">Demand Elasticity</div>
                                    <div className="text-xl font-bold text-red-400">{scipyResult.elasticity_demand}</div>
                                </div>
                            </div>
                        )}

                        <DerivationViewer
                            latex={scipyResult?.derivation_latex}
                            assumptions={scipyResult?.assumptions}
                            evidence={scipyResult?.evidence}
                            subject={scipyResult?.subject}
                            isLoading={isCalculating}
                            error={calcError}
                        />
                    </div>
                )}

                {/* GDP Tab */}
                {activeTab === 'gdp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {COUNTRIES.map((country, idx) => (
                            <motion.div
                                key={country.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-medium text-white">{country.name}</span>
                                    <span className={`flex items-center gap-1 text-sm ${country.growth > 2 ? 'text-green-400' : country.growth > 0 ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {country.growth > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {country.growth}%
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">GDP</span>
                                        <span className="font-mono">${country.gdp.toLocaleString()}B</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Population</span>
                                        <span className="font-mono">{country.population}M</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">GDP per Capita</span>
                                        <span className="font-mono">${(country.gdp * 1000 / country.population).toFixed(0)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Stocks Tab */}
                {activeTab === 'stocks' && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-medium text-white">Stock Price Simulation</h3>
                                <p className="text-sm text-gray-500">Random walk with slight upward bias</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`text-2xl font-bold ${stockPrice > 100 ? 'text-green-400' : 'text-red-400'}`}>
                                    ${stockPrice.toFixed(2)}
                                </div>
                                <button
                                    onClick={() => setIsSimulating(!isSimulating)}
                                    className={`p-2 rounded-lg ${isSimulating ? 'bg-red-600' : 'bg-green-600'}`}
                                >
                                    {isSimulating ? <Pause size={20} /> : <Play size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="h-64 flex items-end gap-1">
                            {stockHistory.map((price, idx) => {
                                const height = (price / 150) * 100;
                                const prevPrice = stockHistory[idx - 1] || price;
                                return (
                                    <div
                                        key={idx}
                                        className="flex-1 rounded-t transition-all"
                                        style={{
                                            height: `${height}%`,
                                            backgroundColor: price >= prevPrice ? '#22c55e' : '#ef4444',
                                            minWidth: '3px'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Concepts Tab */}
                {activeTab === 'concepts' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {CONCEPTS.map((concept, idx) => (
                            <motion.div
                                key={concept.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <h3 className="text-lg font-medium text-white mb-2">{concept.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{concept.description}</p>
                                <div className="bg-gray-800 rounded-lg p-3">
                                    <code className="text-lime-400 text-sm">{concept.formula}</code>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EconomicsLab;
