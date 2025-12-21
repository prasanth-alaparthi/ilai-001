/**
 * 3D Molecule Viewer Component
 * Uses 3Dmol.js to render SMILES strings from Chemistry Lab
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Atom, RotateCcw, Camera, Download, Maximize2, Loader2 } from 'lucide-react';

// 3Dmol.js will be loaded from CDN
let $3Dmol = null;

const load3Dmol = async () => {
    if ($3Dmol) return $3Dmol;

    if (window.$3Dmol) {
        $3Dmol = window.$3Dmol;
        return $3Dmol;
    }

    // Load jQuery (required by 3Dmol)
    await new Promise((resolve, reject) => {
        if (window.jQuery) {
            resolve();
            return;
        }
        const jq = document.createElement('script');
        jq.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
        jq.onload = resolve;
        jq.onerror = reject;
        document.head.appendChild(jq);
    });

    // Load 3Dmol
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://3dmol.org/build/3Dmol-min.js';
        script.onload = () => {
            $3Dmol = window.$3Dmol;
            resolve($3Dmol);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * Fetch SDF/MOL data from PubChem for a SMILES string
 */
const fetchMoleculeData = async (smiles) => {
    try {
        // Use PubChem's REST API to convert SMILES to 3D structure
        const response = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF?record_type=3d`,
            { headers: { 'Accept': 'chemical/x-mdl-sdfile' } }
        );

        if (response.ok) {
            return await response.text();
        }

        // Fallback: try 2D structure
        const response2d = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF`,
            { headers: { 'Accept': 'chemical/x-mdl-sdfile' } }
        );

        if (response2d.ok) {
            return await response2d.text();
        }

        return null;
    } catch (error) {
        console.error('PubChem fetch error:', error);
        return null;
    }
};

/**
 * MoleculeViewer Component
 */
const MoleculeViewer = ({
    smiles,
    formula,
    molecularWeight,
    style = 'stick', // 'stick' | 'sphere' | 'cartoon' | 'surface'
    backgroundColor = '#111827',
    onCapture,
    className = ''
}) => {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStyle, setCurrentStyle] = useState(style);

    // Initialize viewer
    useEffect(() => {
        if (!smiles || !containerRef.current) return;

        let mounted = true;

        const initViewer = async () => {
            try {
                setIsLoading(true);
                setError(null);

                await load3Dmol();

                if (!mounted) return;

                // Clear previous viewer
                if (viewerRef.current) {
                    viewerRef.current.clear();
                }

                // Create new viewer
                const config = { backgroundColor };
                viewerRef.current = $3Dmol.createViewer(containerRef.current, config);

                // Fetch molecule data
                const molData = await fetchMoleculeData(smiles);

                if (!mounted) return;

                if (molData) {
                    viewerRef.current.addModel(molData, 'sdf');
                } else {
                    // Fallback: try direct SMILES (limited support)
                    setError('Could not load 3D structure from PubChem');
                    setIsLoading(false);
                    return;
                }

                // Apply style
                applyStyle(currentStyle);

                // Render
                viewerRef.current.zoomTo();
                viewerRef.current.render();

                // Enable rotation
                viewerRef.current.setStyle({}, { stick: {} });
                viewerRef.current.spin(true);

                // Stop spin after 3 seconds
                setTimeout(() => {
                    if (viewerRef.current) {
                        viewerRef.current.spin(false);
                    }
                }, 3000);

                setIsLoading(false);
            } catch (err) {
                if (mounted) {
                    setError(err.message);
                    setIsLoading(false);
                }
            }
        };

        initViewer();

        return () => {
            mounted = false;
            if (viewerRef.current) {
                viewerRef.current.clear();
            }
        };
    }, [smiles, backgroundColor]);

    // Apply rendering style
    const applyStyle = (styleName) => {
        if (!viewerRef.current) return;

        viewerRef.current.setStyle({}, {});

        switch (styleName) {
            case 'sphere':
                viewerRef.current.setStyle({}, { sphere: { radius: 0.5 } });
                break;
            case 'surface':
                viewerRef.current.setStyle({}, { stick: {} });
                viewerRef.current.addSurface($3Dmol.SurfaceType.VDW, {
                    opacity: 0.7,
                    color: 'white'
                });
                break;
            case 'cartoon':
                viewerRef.current.setStyle({}, { cartoon: { color: 'spectrum' } });
                break;
            case 'stick':
            default:
                viewerRef.current.setStyle({}, { stick: { radius: 0.15 }, sphere: { radius: 0.3 } });
        }

        viewerRef.current.render();
        setCurrentStyle(styleName);
    };

    // Reset view
    const handleReset = () => {
        if (viewerRef.current) {
            viewerRef.current.zoomTo();
            viewerRef.current.render();
        }
    };

    // Capture screenshot
    const handleCapture = () => {
        if (!viewerRef.current) return null;

        try {
            const dataUrl = viewerRef.current.pngURI();

            if (onCapture) {
                onCapture(dataUrl);
            }

            return dataUrl;
        } catch (err) {
            console.error('Capture failed:', err);
            return null;
        }
    };

    // Download as PNG
    const handleDownload = () => {
        const dataUrl = handleCapture();
        if (dataUrl) {
            const link = document.createElement('a');
            link.download = `molecule_${formula || 'unknown'}.png`;
            link.href = dataUrl;
            link.click();
        }
    };

    if (!smiles) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden ${className}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                <div className="flex items-center gap-2">
                    <Atom className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">
                        {formula || smiles.substring(0, 20)}
                        {molecularWeight && (
                            <span className="text-gray-500 ml-2">
                                ({molecularWeight.toFixed(2)} g/mol)
                            </span>
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {/* Style buttons */}
                    <select
                        value={currentStyle}
                        onChange={(e) => applyStyle(e.target.value)}
                        className="text-xs bg-gray-700 text-gray-300 rounded px-2 py-1 border border-gray-600"
                    >
                        <option value="stick">Stick & Ball</option>
                        <option value="sphere">Space-Fill</option>
                        <option value="surface">Surface</option>
                    </select>
                    <button
                        onClick={handleReset}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Reset View"
                    >
                        <RotateCcw className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Download Image"
                    >
                        <Download className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            {/* 3D Viewer Container */}
            <div className="relative">
                <div
                    ref={containerRef}
                    className="w-full h-64"
                    style={{ minHeight: '250px', position: 'relative' }}
                />

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading 3D structure...</span>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="px-4 py-2 bg-yellow-500/10 border-t border-yellow-500/30">
                    <p className="text-xs text-yellow-400">{error}</p>
                </div>
            )}

            {/* SMILES String */}
            <div className="px-4 py-2 bg-gray-800/30 border-t border-gray-700/30">
                <p className="text-xs text-gray-500 font-mono truncate" title={smiles}>
                    SMILES: {smiles}
                </p>
            </div>
        </motion.div>
    );
};

export default MoleculeViewer;
