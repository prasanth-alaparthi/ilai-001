import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw, Link2, Sparkles, FileText } from 'lucide-react';
import apiClient from '../../services/apiClient';

const NoteGraphModal = ({ noteId, onClose, onSelectNote }) => {
    const [data, setData] = useState({ nodes: [], links: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [viewMode, setViewMode] = useState('local'); // 'local' or 'global'
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        const fetchGraph = async () => {
            setIsLoading(true);
            try {
                if (viewMode === 'local') {
                    const response = await apiClient.get(`/notes/${noteId}/links`);
                    const { incoming, outgoing } = response.data;

                    const nodes = [{ id: noteId, title: 'Current Note', type: 'center', x: 0, y: 0 }];
                    const links = [];

                    const angleStepIn = (2 * Math.PI) / (incoming.length || 1);
                    incoming.forEach((link, i) => {
                        const angle = i * angleStepIn;
                        const radius = 200;
                        nodes.push({
                            id: link.sourceNoteId,
                            title: link.sourceNoteTitle,
                            type: link.manual ? 'manual' : 'semantic',
                            x: Math.cos(angle) * radius,
                            y: Math.sin(angle) * radius
                        });
                        links.push({ source: link.sourceNoteId, target: noteId, manual: link.manual });
                    });

                    const angleStepOut = (2 * Math.PI) / (outgoing.length || 1);
                    outgoing.forEach((link, i) => {
                        const angle = i * angleStepOut + (Math.PI / 4); // Offset
                        const radius = 200;
                        const nid = link.targetNoteId;
                        if (!nodes.find(n => n.id === nid)) {
                            nodes.push({
                                id: nid,
                                title: link.targetNoteTitle,
                                type: link.manual ? 'manual' : 'semantic',
                                x: Math.cos(angle) * radius,
                                y: Math.sin(angle) * radius
                            });
                        }
                        links.push({ source: noteId, target: nid, manual: link.manual });
                    });
                    setData({ nodes, links });
                } else {
                    // Global view
                    const response = await apiClient.get('/notes/graph');
                    const { nodes, links } = response.data;

                    // Simple radial layout for results if no force simulation
                    // In a perfect world we'd use d3-force here
                    const globalNodes = nodes.map((n, i) => {
                        const angle = (i / nodes.length) * 2 * Math.PI;
                        const radius = 300 + (Math.random() * 100);
                        return {
                            ...n,
                            type: n.id === noteId ? 'center' : 'manual',
                            x: Math.cos(angle) * radius,
                            y: Math.sin(angle) * radius
                        };
                    });
                    setData({ nodes: globalNodes, links: links.map(l => ({ ...l, manual: true })) });
                }
            } catch (error) {
                console.error("Error fetching graph data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGraph();
    }, [noteId, viewMode]);

    const viewBox = useMemo(() => {
        const w = (dimensions.width || 800) / zoom;
        const h = (dimensions.height || 600) / zoom;
        return `${-w / 2} ${-h / 2} ${w} ${h}`;
    }, [dimensions, zoom]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full max-w-6xl h-[85vh] bg-surface-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Toolbar */}
                <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-3 pointer-events-auto">
                        <div className="p-3 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/20 text-white">
                            <Link2 size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white leading-tight">Knowledge Graph</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <button
                                    onClick={() => setViewMode('local')}
                                    className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${viewMode === 'local' ? 'bg-primary-500 text-white' : 'bg-white/10 text-surface-400 hover:text-white'}`}
                                >
                                    Local
                                </button>
                                <button
                                    onClick={() => setViewMode('global')}
                                    className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${viewMode === 'global' ? 'bg-primary-500 text-white' : 'bg-white/10 text-surface-400 hover:text-white'}`}
                                >
                                    Global
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
                            <button
                                onClick={() => setZoom(z => Math.min(2, z + 0.2))}
                                className="p-2 hover:bg-white/10 rounded-lg text-surface-400 hover:text-white transition-all"
                            >
                                <ZoomIn size={18} />
                            </button>
                            <button
                                onClick={() => setZoom(z => Math.max(0.5, z - 0.2))}
                                className="p-2 hover:bg-white/10 rounded-lg text-surface-400 hover:text-white transition-all"
                            >
                                <ZoomOut size={18} />
                            </button>
                            <div className="w-px bg-white/10 mx-1" />
                            <button
                                onClick={() => setZoom(1)}
                                className="p-2 hover:bg-white/10 rounded-lg text-surface-400 hover:text-white transition-all"
                            >
                                <RefreshCw size={18} />
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-xl bg-white/5 hover:bg-red-500/20 text-surface-400 hover:text-red-400 border border-white/10 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-8 left-8 z-10 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                        <span className="text-xs font-medium text-surface-300">Current Note</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-surface-300">Manual Link</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-surface-500" />
                        <span className="text-xs font-medium text-surface-300">Semantic Link</span>
                    </div>
                </div>

                {/* Graph Container */}
                <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
                    {isLoading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary-400 animate-pulse" />
                            </div>
                            <p className="text-surface-400 font-medium animate-pulse">Calculating neural pathways...</p>
                        </div>
                    ) : (
                        <svg
                            className="w-full h-full"
                            viewBox={viewBox}
                        >
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="25" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.1)" />
                                </marker>
                            </defs>

                            {/* Links */}
                            {data.links.map((link, i) => {
                                const source = data.nodes.find(n => n.id === link.source);
                                const target = data.nodes.find(n => n.id === link.target);
                                if (!source || !target) return null;
                                return (
                                    <motion.line
                                        key={`link-${i}`}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.5 + i * 0.05 }}
                                        x1={source.x} y1={source.y}
                                        x2={target.x} y2={target.y}
                                        stroke={link.manual ? "rgba(245, 158, 11, 0.3)" : "rgba(255, 255, 255, 0.1)"}
                                        strokeWidth={link.manual ? 2 : 1}
                                        markerEnd="url(#arrowhead)"
                                    />
                                );
                            })}

                            {/* Nodes */}
                            {data.nodes.map((node, i) => (
                                <motion.g
                                    key={node.id}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: i * 0.1
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    className="cursor-pointer"
                                    onClick={() => node.id !== noteId && onSelectNote(node.id)}
                                >
                                    {/* Outer Glow */}
                                    <circle
                                        cx={node.x} cy={node.y} r={node.type === 'center' ? 35 : 25}
                                        fill={node.type === 'center' ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.05)"}
                                        className={node.type === 'center' ? "animate-pulse" : ""}
                                    />
                                    {/* Main Circle */}
                                    <circle
                                        cx={node.x} cy={node.y} r={node.type === 'center' ? 25 : 18}
                                        fill={node.type === 'center' ? "#3b82f6" : node.type === 'manual' ? "#f59e0b" : "#374151"}
                                        stroke="rgba(255,255,255,0.2)"
                                        strokeWidth="2"
                                    />
                                    {/* Icon */}
                                    <g transform={`translate(${node.x - 8}, ${node.y - 8})`}>
                                        <FileText size={16} className="text-white/80" />
                                    </g>

                                    {/* Label */}
                                    <text
                                        x={node.x} y={node.y + 45}
                                        textAnchor="middle"
                                        fill="white"
                                        className="text-[10px] font-bold tracking-wide pointer-events-none drop-shadow-lg"
                                    >
                                        {node.title.length > 20 ? node.title.slice(0, 17) + '...' : node.title}
                                    </text>
                                </motion.g>
                            ))}
                        </svg>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default NoteGraphModal;
