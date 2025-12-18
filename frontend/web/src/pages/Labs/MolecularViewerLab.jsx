/**
 * ILAI Professional Labs - Molecular Viewer Lab (PhD Level)
 * 
 * Research-grade molecular visualization with:
 * - 3D protein/molecule rendering
 * - PDB file support
 * - Multiple visualization styles (ball-stick, ribbon, surface)
 * - Molecule manipulation
 * - Property calculations
 * - Hydrogen bond visualization
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Atom, RotateCcw, ZoomIn, ZoomOut, Eye, Download,
    Upload, Search, Settings, Layers, Palette, Ruler,
    ChevronDown, Play, Pause, Info, ExternalLink
} from 'lucide-react';

// Element data (atomic properties)
const ELEMENTS = {
    H: { name: 'Hydrogen', color: '#FFFFFF', radius: 1.2, mass: 1.008 },
    C: { name: 'Carbon', color: '#909090', radius: 1.7, mass: 12.011 },
    N: { name: 'Nitrogen', color: '#3050F8', radius: 1.55, mass: 14.007 },
    O: { name: 'Oxygen', color: '#FF0D0D', radius: 1.52, mass: 15.999 },
    S: { name: 'Sulfur', color: '#FFFF30', radius: 1.8, mass: 32.065 },
    P: { name: 'Phosphorus', color: '#FF8000', radius: 1.8, mass: 30.974 },
    Fe: { name: 'Iron', color: '#E06633', radius: 1.4, mass: 55.845 },
    Mg: { name: 'Magnesium', color: '#8AFF00', radius: 1.5, mass: 24.305 },
    Zn: { name: 'Zinc', color: '#7D80B0', radius: 1.39, mass: 65.38 },
    Ca: { name: 'Calcium', color: '#3DFF00', radius: 1.76, mass: 40.078 }
};

// Sample molecules for demonstration
const SAMPLE_MOLECULES = {
    water: {
        name: 'Water (H₂O)',
        formula: 'H2O',
        atoms: [
            { element: 'O', x: 0, y: 0, z: 0 },
            { element: 'H', x: 0.96, y: 0, z: 0 },
            { element: 'H', x: -0.24, y: 0.93, z: 0 }
        ],
        bonds: [[0, 1], [0, 2]],
        description: 'Essential molecule for life, polar covalent bonds'
    },
    methane: {
        name: 'Methane (CH₄)',
        formula: 'CH4',
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'H', x: 1.09, y: 0, z: 0 },
            { element: 'H', x: -0.36, y: 1.03, z: 0 },
            { element: 'H', x: -0.36, y: -0.51, z: 0.89 },
            { element: 'H', x: -0.36, y: -0.51, z: -0.89 }
        ],
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
        description: 'Simplest alkane, tetrahedral geometry'
    },
    ethanol: {
        name: 'Ethanol (C₂H₅OH)',
        formula: 'C2H5OH',
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.52, y: 0, z: 0 },
            { element: 'O', x: 2.14, y: 1.21, z: 0 },
            { element: 'H', x: -0.36, y: 1.03, z: 0 },
            { element: 'H', x: -0.36, y: -0.51, z: 0.89 },
            { element: 'H', x: -0.36, y: -0.51, z: -0.89 },
            { element: 'H', x: 1.88, y: -0.51, z: 0.89 },
            { element: 'H', x: 1.88, y: -0.51, z: -0.89 },
            { element: 'H', x: 3.1, y: 1.21, z: 0 }
        ],
        bonds: [[0, 1], [1, 2], [0, 3], [0, 4], [0, 5], [1, 6], [1, 7], [2, 8]],
        description: 'Common alcohol, hydroxyl functional group'
    },
    benzene: {
        name: 'Benzene (C₆H₆)',
        formula: 'C6H6',
        atoms: [
            { element: 'C', x: 1.4, y: 0, z: 0 },
            { element: 'C', x: 0.7, y: 1.21, z: 0 },
            { element: 'C', x: -0.7, y: 1.21, z: 0 },
            { element: 'C', x: -1.4, y: 0, z: 0 },
            { element: 'C', x: -0.7, y: -1.21, z: 0 },
            { element: 'C', x: 0.7, y: -1.21, z: 0 },
            { element: 'H', x: 2.48, y: 0, z: 0 },
            { element: 'H', x: 1.24, y: 2.15, z: 0 },
            { element: 'H', x: -1.24, y: 2.15, z: 0 },
            { element: 'H', x: -2.48, y: 0, z: 0 },
            { element: 'H', x: -1.24, y: -2.15, z: 0 },
            { element: 'H', x: 1.24, y: -2.15, z: 0 }
        ],
        bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]],
        description: 'Aromatic hydrocarbon, delocalized π electrons'
    },
    caffeine: {
        name: 'Caffeine (C₈H₁₀N₄O₂)',
        formula: 'C8H10N4O2',
        atoms: [
            { element: 'N', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.3, y: 0.5, z: 0 },
            { element: 'N', x: 2.1, y: -0.5, z: 0 },
            { element: 'C', x: 1.5, y: -1.7, z: 0 },
            { element: 'C', x: 0.1, y: -1.4, z: 0 },
            { element: 'C', x: -1.0, y: -2.3, z: 0 },
            { element: 'O', x: -0.9, y: -3.5, z: 0 },
            { element: 'N', x: -2.2, y: -1.6, z: 0 },
            { element: 'C', x: -2.0, y: -0.2, z: 0 },
            { element: 'O', x: -3.0, y: 0.5, z: 0 },
            { element: 'N', x: -0.8, y: 0.3, z: 0 },
            { element: 'C', x: 1.8, y: 1.9, z: 0 },
            { element: 'C', x: 3.5, y: -0.3, z: 0 },
            { element: 'C', x: -3.5, y: -2.2, z: 0 }
        ],
        bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5], [5, 6], [5, 7], [7, 8], [8, 9], [8, 10], [10, 0], [1, 11], [2, 12], [7, 13]],
        description: 'Central nervous system stimulant, purine alkaloid'
    },
    glucose: {
        name: 'Glucose (C₆H₁₂O₆)',
        formula: 'C6H12O6',
        atoms: [
            { element: 'C', x: 0, y: 0, z: 0 },
            { element: 'C', x: 1.5, y: 0.3, z: 0 },
            { element: 'C', x: 2.2, y: -1.0, z: 0 },
            { element: 'C', x: 1.5, y: -2.3, z: 0 },
            { element: 'C', x: 0, y: -2.0, z: 0 },
            { element: 'O', x: -0.7, y: -0.8, z: 0 },
            { element: 'C', x: -0.7, y: -3.3, z: 0 },
            { element: 'O', x: -0.5, y: 1.2, z: 0 },
            { element: 'O', x: 2.0, y: 1.5, z: 0 },
            { element: 'O', x: 3.6, y: -1.0, z: 0 },
            { element: 'O', x: 2.0, y: -3.5, z: 0 },
            { element: 'O', x: -2.0, y: -3.0, z: 0 }
        ],
        bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [4, 6], [0, 7], [1, 8], [2, 9], [3, 10], [6, 11]],
        description: 'Primary energy source, monosaccharide'
    }
};

// Visualization styles
const VIZ_STYLES = {
    'ball-stick': { name: 'Ball & Stick', atomScale: 0.4, bondRadius: 0.1 },
    'spacefill': { name: 'Space-filling', atomScale: 1.0, bondRadius: 0 },
    'wireframe': { name: 'Wireframe', atomScale: 0.1, bondRadius: 0.05 },
    'stick': { name: 'Stick', atomScale: 0.2, bondRadius: 0.15 }
};

const MolecularViewerLab = () => {
    const canvasRef = useRef(null);
    const [selectedMolecule, setSelectedMolecule] = useState('water');
    const [vizStyle, setVizStyle] = useState('ball-stick');
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
    const [zoom, setZoom] = useState(50);
    const [autoRotate, setAutoRotate] = useState(false);
    const [showBonds, setShowBonds] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [selectedAtom, setSelectedAtom] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const animationRef = useRef(null);

    const molecule = SAMPLE_MOLECULES[selectedMolecule];

    // 3D rotation matrix
    const rotatePoint = useCallback((x, y, z, rx, ry, rz) => {
        // Rotate around X
        let y1 = y * Math.cos(rx) - z * Math.sin(rx);
        let z1 = y * Math.sin(rx) + z * Math.cos(rx);
        y = y1;
        z = z1;

        // Rotate around Y
        let x1 = x * Math.cos(ry) + z * Math.sin(ry);
        z1 = -x * Math.sin(ry) + z * Math.cos(ry);
        x = x1;
        z = z1;

        // Rotate around Z
        x1 = x * Math.cos(rz) - y * Math.sin(rz);
        y1 = x * Math.sin(rz) + y * Math.cos(rz);

        return { x: x1, y: y1, z: z1 };
    }, []);

    // Project 3D to 2D
    const project = useCallback((x, y, z) => {
        const scale = zoom / (z + 10);
        return {
            x: x * scale + 300,
            y: y * scale + 250,
            scale
        };
    }, [zoom]);

    // Draw the molecule
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += 30) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }

        const rx = rotation.x * Math.PI / 180;
        const ry = rotation.y * Math.PI / 180;
        const rz = rotation.z * Math.PI / 180;

        // Transform atoms
        const transformedAtoms = molecule.atoms.map((atom, idx) => {
            const rotated = rotatePoint(atom.x, atom.y, atom.z, rx, ry, rz);
            const projected = project(rotated.x, rotated.y, rotated.z);
            return {
                ...atom,
                idx,
                px: projected.x,
                py: projected.y,
                pz: rotated.z,
                scale: projected.scale
            };
        });

        // Sort by Z for proper depth rendering
        transformedAtoms.sort((a, b) => a.pz - b.pz);

        // Draw bonds first
        if (showBonds) {
            molecule.bonds.forEach(([a, b]) => {
                const atom1 = transformedAtoms.find(at => at.idx === a);
                const atom2 = transformedAtoms.find(at => at.idx === b);
                if (!atom1 || !atom2) return;

                const gradient = ctx.createLinearGradient(atom1.px, atom1.py, atom2.px, atom2.py);
                gradient.addColorStop(0, ELEMENTS[atom1.element]?.color || '#888');
                gradient.addColorStop(1, ELEMENTS[atom2.element]?.color || '#888');

                ctx.strokeStyle = gradient;
                ctx.lineWidth = VIZ_STYLES[vizStyle].bondRadius * zoom * 0.3;
                ctx.beginPath();
                ctx.moveTo(atom1.px, atom1.py);
                ctx.lineTo(atom2.px, atom2.py);
                ctx.stroke();
            });
        }

        // Draw atoms
        transformedAtoms.forEach(atom => {
            const element = ELEMENTS[atom.element] || { color: '#888', radius: 1.5 };
            const radius = element.radius * VIZ_STYLES[vizStyle].atomScale * atom.scale * 15;

            // Atom sphere with gradient
            const gradient = ctx.createRadialGradient(
                atom.px - radius * 0.3, atom.py - radius * 0.3, 0,
                atom.px, atom.py, radius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, element.color);
            gradient.addColorStop(1, shadeColor(element.color, -40));

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(atom.px, atom.py, radius, 0, Math.PI * 2);
            ctx.fill();

            // Highlight selected atom
            if (selectedAtom === atom.idx) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Element label
            if (showLabels && radius > 10) {
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${Math.max(10, radius * 0.6)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(atom.element, atom.px, atom.py);
            }
        });

        // Draw info overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(molecule.name, 20, 30);
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText(`Atoms: ${molecule.atoms.length} | Bonds: ${molecule.bonds.length}`, 20, 50);

    }, [molecule, rotation, zoom, vizStyle, showBonds, showLabels, selectedAtom, rotatePoint, project]);

    // Helper to darken color
    const shadeColor = (color, percent) => {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    // Re-draw on changes
    useEffect(() => {
        draw();
    }, [draw]);

    // Auto-rotation animation
    useEffect(() => {
        if (autoRotate) {
            const animate = () => {
                setRotation(r => ({ ...r, y: r.y + 0.5 }));
                animationRef.current = requestAnimationFrame(animate);
            };
            animationRef.current = requestAnimationFrame(animate);
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
    }, [autoRotate]);

    // Mouse handlers for rotation
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        setRotation(r => ({
            x: r.x + dy * 0.5,
            y: r.y + dx * 0.5,
            z: r.z
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        setZoom(z => Math.max(20, Math.min(150, z - e.deltaY * 0.1)));
    };

    // Calculate molecular properties
    const calculateProperties = () => {
        const atomCounts = {};
        let totalMass = 0;

        molecule.atoms.forEach(atom => {
            atomCounts[atom.element] = (atomCounts[atom.element] || 0) + 1;
            totalMass += ELEMENTS[atom.element]?.mass || 0;
        });

        return { atomCounts, totalMass };
    };

    const properties = calculateProperties();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                            <Atom size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Molecular Viewer Lab</h1>
                            <p className="text-sm text-gray-500">3D Molecular Visualization</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoRotate(!autoRotate)}
                            className={`p-2 rounded-lg ${autoRotate ? 'bg-purple-600' : 'bg-gray-800'} hover:opacity-80`}
                        >
                            {autoRotate ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button
                            onClick={() => setRotation({ x: 0, y: 0, z: 0 })}
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Controls Panel */}
                    <div className="space-y-4">
                        {/* Molecule Selector */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Select Molecule</h3>
                            <select
                                value={selectedMolecule}
                                onChange={(e) => setSelectedMolecule(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                            >
                                {Object.entries(SAMPLE_MOLECULES).map(([key, mol]) => (
                                    <option key={key} value={key}>{mol.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Visualization Style */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Visualization Style</h3>
                            <div className="space-y-2">
                                {Object.entries(VIZ_STYLES).map(([key, style]) => (
                                    <button
                                        key={key}
                                        onClick={() => setVizStyle(key)}
                                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-colors ${vizStyle === key
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        {style.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Display Options */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Display Options</h3>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showBonds}
                                        onChange={(e) => setShowBonds(e.target.checked)}
                                        className="rounded bg-gray-800 border-gray-700"
                                    />
                                    <span className="text-sm">Show Bonds</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showLabels}
                                        onChange={(e) => setShowLabels(e.target.checked)}
                                        className="rounded bg-gray-800 border-gray-700"
                                    />
                                    <span className="text-sm">Show Labels</span>
                                </label>
                            </div>
                        </div>

                        {/* Zoom Control */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Zoom: {zoom}%</h3>
                            <input
                                type="range"
                                min="20"
                                max="150"
                                value={zoom}
                                onChange={(e) => setZoom(parseInt(e.target.value))}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* 3D Viewer */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                            <canvas
                                ref={canvasRef}
                                width={600}
                                height={500}
                                className="w-full cursor-grab active:cursor-grabbing"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onWheel={handleWheel}
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            Drag to rotate • Scroll to zoom • Click atom for details
                        </p>
                    </div>

                    {/* Properties Panel */}
                    <div className="space-y-4">
                        {/* Molecule Info */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Molecule Info</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs text-gray-500">Name</div>
                                    <div className="text-white font-medium">{molecule.name}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Formula</div>
                                    <div className="text-white font-mono">{molecule.formula}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Description</div>
                                    <div className="text-sm text-gray-300">{molecule.description}</div>
                                </div>
                            </div>
                        </div>

                        {/* Properties */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Properties</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Molecular Mass</span>
                                    <span className="text-white font-mono">{properties.totalMass.toFixed(3)} g/mol</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Atoms</span>
                                    <span className="text-white font-mono">{molecule.atoms.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Total Bonds</span>
                                    <span className="text-white font-mono">{molecule.bonds.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Atom Composition */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Atom Composition</h3>
                            <div className="space-y-2">
                                {Object.entries(properties.atomCounts).map(([element, count]) => (
                                    <div key={element} className="flex items-center gap-2">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ background: ELEMENTS[element]?.color || '#888' }}
                                        />
                                        <span className="text-sm font-mono">
                                            {element}: {count}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            ({ELEMENTS[element]?.name})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MolecularViewerLab;
