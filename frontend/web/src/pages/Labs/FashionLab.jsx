/**
 * ILAI Professional Labs - Fashion Lab
 * 
 * Fashion design principles:
 * - Color theory
 * - Design elements
 * - Fashion history
 * - Style guide
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Palette, Droplets, Square, Circle, Triangle,
    Shirt, Glasses, Watch, ChevronRight, Scissors
} from 'lucide-react';
import labsService from '../../services/labsService';
import DerivationViewer from '../../components/labs/DerivationViewer';

// Color theory
const COLOR_WHEEL = [
    { name: 'Red', hex: '#EF4444', type: 'Primary', emotion: 'Passion, Energy, Excitement' },
    { name: 'Orange', hex: '#F97316', type: 'Secondary', emotion: 'Warmth, Enthusiasm, Creativity' },
    { name: 'Yellow', hex: '#EAB308', type: 'Primary', emotion: 'Happiness, Optimism, Clarity' },
    { name: 'Green', hex: '#22C55E', type: 'Secondary', emotion: 'Nature, Growth, Harmony' },
    { name: 'Blue', hex: '#3B82F6', type: 'Primary', emotion: 'Trust, Calm, Professionalism' },
    { name: 'Purple', hex: '#8B5CF6', type: 'Secondary', emotion: 'Luxury, Mystery, Creativity' },
    { name: 'Pink', hex: '#EC4899', type: 'Tertiary', emotion: 'Romance, Femininity, Playfulness' },
    { name: 'Brown', hex: '#92400E', type: 'Neutral', emotion: 'Earthiness, Reliability, Comfort' },
    { name: 'Black', hex: '#1F2937', type: 'Neutral', emotion: 'Elegance, Power, Sophistication' },
    { name: 'White', hex: '#F9FAFB', type: 'Neutral', emotion: 'Purity, Simplicity, Cleanliness' }
];

// Color harmonies
const COLOR_HARMONIES = [
    { name: 'Complementary', description: 'Colors opposite on the color wheel', example: ['#EF4444', '#22C55E'] },
    { name: 'Analogous', description: 'Colors adjacent on the color wheel', example: ['#3B82F6', '#8B5CF6', '#EC4899'] },
    { name: 'Triadic', description: 'Three colors equally spaced', example: ['#EF4444', '#EAB308', '#3B82F6'] },
    { name: 'Monochromatic', description: 'Different shades of one color', example: ['#1E40AF', '#3B82F6', '#93C5FD'] }
];

// Design elements
const DESIGN_ELEMENTS = [
    { name: 'Line', description: 'Creates movement, defines shapes, divides space', icon: '/' },
    { name: 'Shape', description: 'Geometric or organic forms that create structure', icon: '□' },
    { name: 'Texture', description: 'Surface quality - smooth, rough, soft, hard', icon: '≋' },
    { name: 'Pattern', description: 'Repeated design elements like stripes, florals', icon: '▣' },
    { name: 'Proportion', description: 'Size relationships between different parts', icon: '⊞' },
    { name: 'Balance', description: 'Visual weight distribution - symmetrical or asymmetrical', icon: '⚖' }
];

// Fashion eras
const FASHION_ERAS = [
    { era: '1920s', name: 'Roaring Twenties', style: 'Flapper dresses, Art Deco, dropped waists', color: '#D4AF37' },
    { era: '1950s', name: 'New Look', style: 'Full skirts, cinched waists, feminine silhouettes', color: '#FF69B4' },
    { era: '1960s', name: 'Mod', style: 'Mini skirts, bold patterns, geometric shapes', color: '#00CED1' },
    { era: '1970s', name: 'Disco', style: 'Bell bottoms, platform shoes, bold colors', color: '#FF4500' },
    { era: '1980s', name: 'Power Dressing', style: 'Shoulder pads, neon, athletic wear', color: '#FF1493' },
    { era: '1990s', name: 'Minimalism', style: 'Grunge, slip dresses, simple lines', color: '#808080' },
    { era: '2000s', name: 'Y2K', style: 'Low-rise jeans, logo mania, metallic', color: '#C0C0C0' },
    { era: '2020s', name: 'Sustainable', style: 'Eco-fashion, vintage revival, comfort', color: '#228B22' }
];

const FashionLab = () => {
    const [activeTab, setActiveTab] = useState('color');
    const [selectedColor, setSelectedColor] = useState(COLOR_WHEEL[0]);

    // Gilewska Pattern Drafting state
    const [measurements, setMeasurements] = useState({ bust: 90, waist: 70, hips: 95 });
    const [patternResult, setPatternResult] = useState(null);
    const [isDrafting, setIsDrafting] = useState(false);
    const [draftError, setDraftError] = useState(null);

    const draftPattern = async () => {
        setIsDrafting(true);
        setDraftError(null);
        setPatternResult(null);
        try {
            const result = await labsService.draftPattern(measurements);
            if (result.success) {
                setPatternResult(result);
            } else {
                setDraftError(result.error);
            }
        } catch (err) {
            setDraftError(err.message || 'Failed to draft pattern');
        } finally {
            setIsDrafting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl">
                        <Palette size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Fashion Lab</h1>
                        <p className="text-sm text-gray-500">Design & Style Principles</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {['color', 'pattern', 'design', 'history'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                ? 'bg-fuchsia-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Color Tab */}
                {activeTab === 'color' && (
                    <div className="space-y-8">
                        {/* Color Wheel */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-lg font-medium text-white mb-4">Color Wheel</h3>
                            <div className="flex flex-wrap gap-4 mb-6">
                                {COLOR_WHEEL.map((color, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedColor(color)}
                                        className={`w-16 h-16 rounded-xl border-4 transition-transform hover:scale-110 ${selectedColor === color ? 'border-white scale-110' : 'border-gray-700'
                                            }`}
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                ))}
                            </div>

                            {selectedColor && (
                                <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-6">
                                    <div
                                        className="w-20 h-20 rounded-xl"
                                        style={{ backgroundColor: selectedColor.hex }}
                                    />
                                    <div>
                                        <h4 className="text-lg font-medium text-white">{selectedColor.name}</h4>
                                        <p className="text-sm text-gray-500">{selectedColor.type} Color</p>
                                        <p className="text-sm text-gray-400 mt-1">{selectedColor.emotion}</p>
                                        <code className="text-xs text-fuchsia-400">{selectedColor.hex}</code>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Color Harmonies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {COLOR_HARMONIES.map((harmony, idx) => (
                                <div key={idx} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                    <h4 className="font-medium text-white mb-2">{harmony.name}</h4>
                                    <p className="text-sm text-gray-500 mb-3">{harmony.description}</p>
                                    <div className="flex gap-2">
                                        {harmony.example.map((color, i) => (
                                            <div
                                                key={i}
                                                className="w-12 h-12 rounded-lg"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Gilewska Pattern Drafting Tab */}
                {activeTab === 'pattern' && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Scissors className="w-6 h-6 text-fuchsia-400" />
                            <h3 className="text-xl font-semibold text-white">
                                Gilewska Pattern Drafting
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Bust (cm)
                                </label>
                                <input
                                    type="number"
                                    value={measurements.bust}
                                    onChange={(e) => setMeasurements(m => ({ ...m, bust: parseFloat(e.target.value) || 0 }))}
                                    className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-fuchsia-500 outline-none text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Waist (cm)
                                </label>
                                <input
                                    type="number"
                                    value={measurements.waist}
                                    onChange={(e) => setMeasurements(m => ({ ...m, waist: parseFloat(e.target.value) || 0 }))}
                                    className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-fuchsia-500 outline-none text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Hips (cm)
                                </label>
                                <input
                                    type="number"
                                    value={measurements.hips}
                                    onChange={(e) => setMeasurements(m => ({ ...m, hips: parseFloat(e.target.value) || 0 }))}
                                    className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-fuchsia-500 outline-none text-white"
                                />
                            </div>
                        </div>

                        <button
                            onClick={draftPattern}
                            disabled={isDrafting}
                            className="mb-6 px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
                        >
                            {isDrafting ? 'Drafting Pattern...' : 'Draft Bodice Pattern'}
                        </button>

                        {patternResult && (
                            <div className="space-y-4 mb-6">
                                <h4 className="text-sm font-medium text-gray-400 uppercase">Pattern Pieces</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {patternResult.pattern_pieces && Object.entries(patternResult.pattern_pieces).map(([key, value], idx) => (
                                        <div key={idx} className="bg-gray-800 p-4 rounded-xl">
                                            <div className="text-xs text-gray-500 uppercase">{key.replace(/_/g, ' ')}</div>
                                            <div className="text-lg font-bold text-fuchsia-400">{value} cm</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DerivationViewer
                            latex={patternResult?.derivation_latex}
                            assumptions={patternResult?.assumptions}
                            evidence={patternResult?.evidence}
                            subject={patternResult?.subject}
                            isLoading={isDrafting}
                            error={draftError}
                        />
                    </div>
                )}

                {/* Design Tab */}
                {activeTab === 'design' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DESIGN_ELEMENTS.map((element, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <div className="text-4xl mb-4 text-fuchsia-400">{element.icon}</div>
                                <h3 className="font-medium text-white mb-2">{element.name}</h3>
                                <p className="text-sm text-gray-400">{element.description}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        {FASHION_ERAS.map((era, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex items-center gap-6"
                            >
                                <div
                                    className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                                    style={{ backgroundColor: era.color }}
                                >
                                    {era.era}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-white">{era.name}</h3>
                                    <p className="text-sm text-gray-400">{era.style}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FashionLab;
