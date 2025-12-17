import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MindMap.css';

/**
 * MindMap Component - Phase 5
 * Interactive mind map visualization with D3-like rendering
 */
const MindMap = ({ content: initialContent, topic: initialTopic }) => {
    const [content, setContent] = useState(initialContent || '');
    const [topic, setTopic] = useState(initialTopic || '');
    const [loading, setLoading] = useState(false);
    const [mindMap, setMindMap] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [zoom, setZoom] = useState(1);
    const canvasRef = useRef(null);

    const generateMindMap = useCallback(async () => {
        if (!content.trim() && !topic.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/notebook/mind-map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': localStorage.getItem('userId') || '1'
                },
                body: JSON.stringify({ content, centralTopic: topic })
            });

            if (!response.ok) throw new Error('Failed to generate mind map');

            const data = await response.json();
            setMindMap(data);
        } catch (err) {
            console.error('Mind map error:', err);
        } finally {
            setLoading(false);
        }
    }, [content, topic]);

    const expandNode = useCallback(async (nodeName) => {
        try {
            const response = await fetch('/api/notebook/mind-map/expand', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': localStorage.getItem('userId') || '1'
                },
                body: JSON.stringify({ nodeName, context: content })
            });

            if (response.ok) {
                const expandedNodes = await response.json();
                // Update mind map with expanded nodes
                console.log('Expanded:', expandedNodes);
            }
        } catch (err) {
            console.error('Expand error:', err);
        }
    }, [content]);

    const renderNode = (node, depth = 0, angle = 0, parentX = 0, parentY = 0) => {
        const radius = 120 + depth * 100;
        const x = depth === 0 ? 400 : parentX + Math.cos(angle) * radius;
        const y = depth === 0 ? 300 : parentY + Math.sin(angle) * radius;

        const nodeTypeStyles = {
            central: 'node-central',
            branch: 'node-branch',
            node: 'node-item',
            subnode: 'node-subitem'
        };

        const angleStep = node.children?.length > 0
            ? (Math.PI * 2) / node.children.length
            : 0;

        return (
            <g key={node.id} className="mind-map-node">
                {/* Connection line to parent */}
                {depth > 0 && (
                    <line
                        x1={parentX}
                        y1={parentY}
                        x2={x}
                        y2={y}
                        className="node-connection"
                    />
                )}

                {/* Node circle and label */}
                <g
                    transform={`translate(${x}, ${y})`}
                    onClick={() => setSelectedNode(node)}
                    onDoubleClick={() => expandNode(node.label)}
                    className={`node-group ${nodeTypeStyles[node.type] || ''} ${selectedNode?.id === node.id ? 'selected' : ''
                        }`}
                >
                    <circle
                        r={node.type === 'central' ? 50 : node.type === 'branch' ? 35 : 25}
                        className="node-circle"
                    />
                    <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="node-label"
                    >
                        {node.label?.length > 15 ? node.label.slice(0, 15) + '...' : node.label}
                    </text>
                </g>

                {/* Render children */}
                {node.children?.map((child, i) =>
                    renderNode(
                        child,
                        depth + 1,
                        angleStep * i - Math.PI / 2,
                        x,
                        y
                    )
                )}
            </g>
        );
    };

    return (
        <div className="mind-map-container">
            <div className="map-header">
                <h2>🧠 Mind Map Generator</h2>
                <p className="subtitle">Visualize concepts and relationships</p>
            </div>

            <div className="map-controls">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Central topic..."
                    className="topic-input"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste content to map..."
                    className="content-input"
                    rows={3}
                />
                <div className="control-buttons">
                    <button
                        onClick={generateMindMap}
                        disabled={loading || (!content.trim() && !topic.trim())}
                        className="generate-btn"
                    >
                        {loading ? '🔄 Generating...' : '🗺️ Generate Map'}
                    </button>
                    <div className="zoom-controls">
                        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>−</button>
                        <span>{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="map-loading">
                    <div className="loading-pulse"></div>
                    <p>Building your mind map...</p>
                </div>
            )}

            {mindMap && (
                <div className="map-canvas-container">
                    <svg
                        ref={canvasRef}
                        className="mind-map-svg"
                        viewBox="0 0 800 600"
                        style={{ transform: `scale(${zoom})` }}
                    >
                        <defs>
                            <radialGradient id="centralGradient">
                                <stop offset="0%" stopColor="#60a5fa" />
                                <stop offset="100%" stopColor="#3b82f6" />
                            </radialGradient>
                            <radialGradient id="branchGradient">
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </radialGradient>
                        </defs>

                        <g className="map-content">
                            {mindMap.central && renderNode(mindMap.central)}
                        </g>
                    </svg>

                    {/* Node details panel */}
                    {selectedNode && (
                        <div className="node-details">
                            <h4>{selectedNode.label}</h4>
                            <span className="node-type">{selectedNode.type}</span>
                            {selectedNode.children?.length > 0 && (
                                <p>{selectedNode.children.length} sub-concepts</p>
                            )}
                            <button
                                onClick={() => expandNode(selectedNode.label)}
                                className="expand-btn"
                            >
                                🔍 Expand Node
                            </button>
                        </div>
                    )}

                    {/* Connections legend */}
                    {mindMap.connections?.length > 0 && (
                        <div className="connections-panel">
                            <h4>🔗 Connections</h4>
                            {mindMap.connections.map((conn, i) => (
                                <div key={i} className="connection-item">
                                    <span>{conn.from}</span>
                                    <span className="connection-arrow">→</span>
                                    <span>{conn.to}</span>
                                    <span className="connection-type">{conn.relationship}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MindMap;
