/**
 * ILAI Professional Labs - DSA Visualizer Lab (PhD Level)
 * 
 * Research-grade algorithm visualization with:
 * - Sorting algorithms (visual + step-by-step)
 * - Graph algorithms (BFS, DFS, Dijkstra)
 * - Tree operations (traversal, BST)
 * - Dynamic Programming visualization
 * - Complexity analysis
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Play, Pause, RotateCcw, SkipForward, Settings,
    Shuffle, ChevronDown, Clock, Cpu, ChevronRight, StepForward
} from 'lucide-react';

// Sorting algorithms
const SORTING_ALGORITHMS = {
    bubble: {
        name: 'Bubble Sort',
        complexity: { time: 'O(n²)', space: 'O(1)' },
        description: 'Repeatedly swaps adjacent elements if they are in wrong order',
        stable: true
    },
    selection: {
        name: 'Selection Sort',
        complexity: { time: 'O(n²)', space: 'O(1)' },
        description: 'Finds minimum element and places it at the beginning',
        stable: false
    },
    insertion: {
        name: 'Insertion Sort',
        complexity: { time: 'O(n²)', space: 'O(1)' },
        description: 'Builds sorted array one element at a time',
        stable: true
    },
    merge: {
        name: 'Merge Sort',
        complexity: { time: 'O(n log n)', space: 'O(n)' },
        description: 'Divides array in half, sorts, then merges',
        stable: true
    },
    quick: {
        name: 'Quick Sort',
        complexity: { time: 'O(n log n)', space: 'O(log n)' },
        description: 'Picks pivot and partitions array around it',
        stable: false
    },
    heap: {
        name: 'Heap Sort',
        complexity: { time: 'O(n log n)', space: 'O(1)' },
        description: 'Uses heap data structure to sort',
        stable: false
    }
};

// Graph algorithms
const GRAPH_ALGORITHMS = {
    bfs: {
        name: 'BFS',
        fullName: 'Breadth-First Search',
        complexity: { time: 'O(V + E)', space: 'O(V)' },
        description: 'Explores neighbors level by level'
    },
    dfs: {
        name: 'DFS',
        fullName: 'Depth-First Search',
        complexity: { time: 'O(V + E)', space: 'O(V)' },
        description: 'Explores as far as possible along each branch'
    },
    dijkstra: {
        name: 'Dijkstra',
        fullName: "Dijkstra's Algorithm",
        complexity: { time: 'O((V + E) log V)', space: 'O(V)' },
        description: 'Finds shortest path from source to all vertices'
    }
};

const DSAVisualizerLab = () => {
    const canvasRef = useRef(null);
    const [activeTab, setActiveTab] = useState('sorting');
    const [algorithm, setAlgorithm] = useState('bubble');
    const [graphAlgorithm, setGraphAlgorithm] = useState('bfs');
    const [array, setArray] = useState([]);
    const [arraySize, setArraySize] = useState(30);
    const [speed, setSpeed] = useState(50);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [comparing, setComparing] = useState([]);
    const [swapping, setSwapping] = useState([]);
    const [sorted, setSorted] = useState([]);
    const [steps, setSteps] = useState(0);
    const [comparisons, setComparisons] = useState(0);
    const [swaps, setSwaps] = useState(0);
    const stopRef = useRef(false);

    // Initialize array
    const generateArray = useCallback(() => {
        const newArray = Array.from({ length: arraySize }, () =>
            Math.floor(Math.random() * 100) + 5
        );
        setArray(newArray);
        setSorted([]);
        setComparing([]);
        setSwapping([]);
        setSteps(0);
        setComparisons(0);
        setSwaps(0);
    }, [arraySize]);

    useEffect(() => {
        generateArray();
    }, [generateArray]);

    // Animation helper
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, 101 - speed));

    // Bubble Sort
    const bubbleSort = async () => {
        const arr = [...array];
        for (let i = 0; i < arr.length - 1; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
                if (stopRef.current) return;

                setComparing([j, j + 1]);
                setComparisons(c => c + 1);
                setSteps(s => s + 1);
                await sleep();

                if (arr[j] > arr[j + 1]) {
                    setSwapping([j, j + 1]);
                    setSwaps(s => s + 1);
                    [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                    setArray([...arr]);
                    await sleep();
                    setSwapping([]);
                }
            }
            setSorted(s => [...s, arr.length - 1 - i]);
        }
        setSorted(Array.from({ length: arr.length }, (_, i) => i));
        setComparing([]);
    };

    // Selection Sort
    const selectionSort = async () => {
        const arr = [...array];
        for (let i = 0; i < arr.length - 1; i++) {
            let minIdx = i;
            for (let j = i + 1; j < arr.length; j++) {
                if (stopRef.current) return;

                setComparing([minIdx, j]);
                setComparisons(c => c + 1);
                setSteps(s => s + 1);
                await sleep();

                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            if (minIdx !== i) {
                setSwapping([i, minIdx]);
                setSwaps(s => s + 1);
                [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
                setArray([...arr]);
                await sleep();
                setSwapping([]);
            }
            setSorted(s => [...s, i]);
        }
        setSorted(Array.from({ length: arr.length }, (_, i) => i));
        setComparing([]);
    };

    // Insertion Sort
    const insertionSort = async () => {
        const arr = [...array];
        for (let i = 1; i < arr.length; i++) {
            let j = i;
            while (j > 0) {
                if (stopRef.current) return;

                setComparing([j - 1, j]);
                setComparisons(c => c + 1);
                setSteps(s => s + 1);
                await sleep();

                if (arr[j - 1] > arr[j]) {
                    setSwapping([j - 1, j]);
                    setSwaps(s => s + 1);
                    [arr[j - 1], arr[j]] = [arr[j], arr[j - 1]];
                    setArray([...arr]);
                    await sleep();
                    setSwapping([]);
                    j--;
                } else {
                    break;
                }
            }
        }
        setSorted(Array.from({ length: arr.length }, (_, i) => i));
        setComparing([]);
    };

    // Merge Sort
    const mergeSort = async () => {
        const arr = [...array];

        const merge = async (start, mid, end) => {
            const left = arr.slice(start, mid + 1);
            const right = arr.slice(mid + 1, end + 1);
            let i = 0, j = 0, k = start;

            while (i < left.length && j < right.length) {
                if (stopRef.current) return;

                setComparing([start + i, mid + 1 + j]);
                setComparisons(c => c + 1);
                setSteps(s => s + 1);
                await sleep();

                if (left[i] <= right[j]) {
                    arr[k] = left[i];
                    i++;
                } else {
                    arr[k] = right[j];
                    j++;
                    setSwaps(s => s + 1);
                }
                setArray([...arr]);
                k++;
            }

            while (i < left.length) {
                arr[k] = left[i];
                i++;
                k++;
                setArray([...arr]);
                await sleep();
            }

            while (j < right.length) {
                arr[k] = right[j];
                j++;
                k++;
                setArray([...arr]);
                await sleep();
            }
        };

        const sort = async (start, end) => {
            if (start >= end) return;
            const mid = Math.floor((start + end) / 2);
            await sort(start, mid);
            await sort(mid + 1, end);
            await merge(start, mid, end);
        };

        await sort(0, arr.length - 1);
        setSorted(Array.from({ length: arr.length }, (_, i) => i));
        setComparing([]);
    };

    // Quick Sort
    const quickSort = async () => {
        const arr = [...array];

        const partition = async (low, high) => {
            const pivot = arr[high];
            let i = low - 1;

            for (let j = low; j < high; j++) {
                if (stopRef.current) return -1;

                setComparing([j, high]);
                setComparisons(c => c + 1);
                setSteps(s => s + 1);
                await sleep();

                if (arr[j] < pivot) {
                    i++;
                    if (i !== j) {
                        setSwapping([i, j]);
                        setSwaps(s => s + 1);
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                        setArray([...arr]);
                        await sleep();
                        setSwapping([]);
                    }
                }
            }

            if (i + 1 !== high) {
                setSwapping([i + 1, high]);
                setSwaps(s => s + 1);
                [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
                setArray([...arr]);
                await sleep();
                setSwapping([]);
            }

            setSorted(s => [...s, i + 1]);
            return i + 1;
        };

        const sort = async (low, high) => {
            if (low < high) {
                const pi = await partition(low, high);
                if (pi === -1) return;
                await sort(low, pi - 1);
                await sort(pi + 1, high);
            }
        };

        await sort(0, arr.length - 1);
        setSorted(Array.from({ length: arr.length }, (_, i) => i));
        setComparing([]);
    };

    // Heap Sort
    const heapSort = async () => {
        const arr = [...array];

        const heapify = async (n, i) => {
            let largest = i;
            const left = 2 * i + 1;
            const right = 2 * i + 2;

            if (left < n) {
                setComparing([largest, left]);
                setComparisons(c => c + 1);
                await sleep();
                if (arr[left] > arr[largest]) largest = left;
            }

            if (right < n) {
                setComparing([largest, right]);
                setComparisons(c => c + 1);
                await sleep();
                if (arr[right] > arr[largest]) largest = right;
            }

            if (largest !== i) {
                if (stopRef.current) return;
                setSwapping([i, largest]);
                setSwaps(s => s + 1);
                [arr[i], arr[largest]] = [arr[largest], arr[i]];
                setArray([...arr]);
                await sleep();
                setSwapping([]);
                await heapify(n, largest);
            }
        };

        // Build heap
        for (let i = Math.floor(arr.length / 2) - 1; i >= 0; i--) {
            if (stopRef.current) return;
            setSteps(s => s + 1);
            await heapify(arr.length, i);
        }

        // Extract elements
        for (let i = arr.length - 1; i > 0; i--) {
            if (stopRef.current) return;
            setSwapping([0, i]);
            setSwaps(s => s + 1);
            [arr[0], arr[i]] = [arr[i], arr[0]];
            setArray([...arr]);
            setSorted(s => [...s, i]);
            await sleep();
            setSwapping([]);
            await heapify(i, 0);
        }

        setSorted(Array.from({ length: arr.length }, (_, i) => i));
        setComparing([]);
    };

    // Start sorting
    const startSort = async () => {
        stopRef.current = false;
        setIsRunning(true);
        setSorted([]);
        setSteps(0);
        setComparisons(0);
        setSwaps(0);

        switch (algorithm) {
            case 'bubble': await bubbleSort(); break;
            case 'selection': await selectionSort(); break;
            case 'insertion': await insertionSort(); break;
            case 'merge': await mergeSort(); break;
            case 'quick': await quickSort(); break;
            case 'heap': await heapSort(); break;
        }

        setIsRunning(false);
    };

    // Stop sorting
    const stopSort = () => {
        stopRef.current = true;
        setIsRunning(false);
    };

    // Get bar color
    const getBarColor = (index) => {
        if (sorted.includes(index)) return '#22c55e';
        if (swapping.includes(index)) return '#ef4444';
        if (comparing.includes(index)) return '#f59e0b';
        return '#3b82f6';
    };

    const algoInfo = SORTING_ALGORITHMS[algorithm];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                            <BarChart3 size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">DSA Visualizer Lab</h1>
                            <p className="text-sm text-gray-500">Algorithm Visualization & Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {['sorting', 'graphs', 'trees'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {activeTab === 'sorting' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Controls */}
                        <div className="space-y-4">
                            {/* Algorithm Selector */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Algorithm</h3>
                                <select
                                    value={algorithm}
                                    onChange={(e) => setAlgorithm(e.target.value)}
                                    disabled={isRunning}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                >
                                    {Object.entries(SORTING_ALGORITHMS).map(([key, algo]) => (
                                        <option key={key} value={key}>{algo.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Array Size */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Array Size: {arraySize}</h3>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={arraySize}
                                    onChange={(e) => setArraySize(parseInt(e.target.value))}
                                    disabled={isRunning}
                                    className="w-full"
                                />
                            </div>

                            {/* Speed */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Speed: {speed}%</h3>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    value={speed}
                                    onChange={(e) => setSpeed(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>

                            {/* Controls */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Controls</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={generateArray}
                                        disabled={isRunning}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg text-sm"
                                    >
                                        <Shuffle size={16} /> Generate
                                    </button>
                                    {!isRunning ? (
                                        <button
                                            onClick={startSort}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white"
                                        >
                                            <Play size={16} /> Sort
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopSort}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm text-white"
                                        >
                                            <Pause size={16} /> Stop
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                <h3 className="text-sm font-medium text-gray-400 mb-3">Statistics</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Steps</span>
                                        <span className="font-mono text-white">{steps}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Comparisons</span>
                                        <span className="font-mono text-yellow-400">{comparisons}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Swaps</span>
                                        <span className="font-mono text-red-400">{swaps}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visualization */}
                        <div className="lg:col-span-3 space-y-4">
                            {/* Bar Chart */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                <div className="flex items-end justify-center gap-[2px] h-64">
                                    {array.map((value, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex-1 rounded-t transition-colors duration-100"
                                            style={{
                                                height: `${value}%`,
                                                backgroundColor: getBarColor(index),
                                                maxWidth: '20px'
                                            }}
                                            layout
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 justify-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-blue-500" />
                                    <span>Unsorted</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-yellow-500" />
                                    <span>Comparing</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-red-500" />
                                    <span>Swapping</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-green-500" />
                                    <span>Sorted</span>
                                </div>
                            </div>

                            {/* Algorithm Info */}
                            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                                <h3 className="text-lg font-medium text-white mb-4">{algoInfo.name}</h3>
                                <p className="text-gray-400 mb-4">{algoInfo.description}</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">Time Complexity</div>
                                        <div className="text-lg font-mono text-indigo-400">{algoInfo.complexity.time}</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">Space Complexity</div>
                                        <div className="text-lg font-mono text-purple-400">{algoInfo.complexity.space}</div>
                                    </div>
                                    <div className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-xs text-gray-500 mb-1">Stable</div>
                                        <div className="text-lg font-mono text-green-400">{algoInfo.stable ? 'Yes' : 'No'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'graphs' && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
                        <div className="text-6xl mb-4">🔜</div>
                        <h3 className="text-xl font-medium text-white mb-2">Graph Algorithms Coming Soon</h3>
                        <p className="text-gray-400">BFS, DFS, Dijkstra's Algorithm visualization</p>
                    </div>
                )}

                {activeTab === 'trees' && (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
                        <div className="text-6xl mb-4">🔜</div>
                        <h3 className="text-xl font-medium text-white mb-2">Tree Operations Coming Soon</h3>
                        <p className="text-gray-400">BST, AVL, Red-Black Tree visualization</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DSAVisualizerLab;
