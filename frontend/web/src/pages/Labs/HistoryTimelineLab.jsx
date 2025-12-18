/**
 * ILAI Professional Labs - History Timeline Lab (PhD Level)
 * 
 * Interactive historical timeline with:
 * - Multiple civilizations
 * - Event explorer
 * - Era comparison
 * - Interactive timeline
 * - Source citations
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Calendar, ChevronLeft, ChevronRight, Search,
    Filter, BookOpen, Globe, Landmark, Users, Swords,
    Lightbulb, Crown, Scroll, ZoomIn, ZoomOut
} from 'lucide-react';

// Historical eras
const ERAS = [
    { id: 'ancient', name: 'Ancient History', start: -3000, end: 500, color: '#f59e0b' },
    { id: 'medieval', name: 'Medieval Period', start: 500, end: 1500, color: '#8b5cf6' },
    { id: 'early-modern', name: 'Early Modern', start: 1500, end: 1800, color: '#3b82f6' },
    { id: 'modern', name: 'Modern Era', start: 1800, end: 2000, color: '#22c55e' },
    { id: 'contemporary', name: 'Contemporary', start: 2000, end: 2024, color: '#ec4899' }
];

// Historical events database
const EVENTS = [
    // Ancient History
    { year: -3000, title: 'Rise of Egyptian Civilization', category: 'civilization', era: 'ancient', region: 'Africa', description: 'Unification of Upper and Lower Egypt under first pharaohs' },
    { year: -2560, title: 'Great Pyramid of Giza Built', category: 'architecture', era: 'ancient', region: 'Africa', description: 'Construction of the oldest and largest of the Giza pyramids' },
    { year: -1792, title: "Hammurabi's Code", category: 'law', era: 'ancient', region: 'Middle East', description: 'One of the oldest deciphered writings of significant length' },
    { year: -776, title: 'First Olympic Games', category: 'culture', era: 'ancient', region: 'Europe', description: 'Ancient Olympic Games held in Olympia, Greece' },
    { year: -509, title: 'Roman Republic Founded', category: 'politics', era: 'ancient', region: 'Europe', description: 'End of Roman Kingdom, beginning of Roman Republic' },
    { year: -323, title: 'Death of Alexander the Great', category: 'military', era: 'ancient', region: 'Middle East', description: 'End of Macedonian Empire, beginning of Hellenistic period' },
    { year: -221, title: 'Qin Dynasty Unifies China', category: 'civilization', era: 'ancient', region: 'Asia', description: 'First unified Chinese empire under Qin Shi Huang' },
    { year: -27, title: 'Roman Empire Begins', category: 'politics', era: 'ancient', region: 'Europe', description: 'Augustus becomes first Roman Emperor' },
    { year: 476, title: 'Fall of Western Roman Empire', category: 'politics', era: 'ancient', region: 'Europe', description: 'Romulus Augustulus deposed, end of Western Roman Empire' },

    // Medieval Period
    { year: 622, title: 'Hijra - Islam Founded', category: 'religion', era: 'medieval', region: 'Middle East', description: "Muhammad's migration from Mecca to Medina" },
    { year: 800, title: 'Charlemagne Crowned Emperor', category: 'politics', era: 'medieval', region: 'Europe', description: 'Holy Roman Empire founded' },
    { year: 1066, title: 'Norman Conquest of England', category: 'military', era: 'medieval', region: 'Europe', description: 'William the Conqueror defeats Harold II at Hastings' },
    { year: 1215, title: 'Magna Carta Signed', category: 'law', era: 'medieval', region: 'Europe', description: 'Foundation of constitutional law in England' },
    { year: 1271, title: 'Marco Polo Travels to China', category: 'exploration', era: 'medieval', region: 'Asia', description: 'Famous journey along the Silk Road' },
    { year: 1347, title: 'Black Death Arrives in Europe', category: 'disaster', era: 'medieval', region: 'Europe', description: 'Plague kills 30-60% of European population' },
    { year: 1453, title: 'Fall of Constantinople', category: 'military', era: 'medieval', region: 'Middle East', description: 'Ottoman conquest ends Byzantine Empire' },

    // Early Modern
    { year: 1492, title: 'Columbus Reaches Americas', category: 'exploration', era: 'early-modern', region: 'Americas', description: 'Beginning of European colonization of Americas' },
    { year: 1517, title: 'Protestant Reformation Begins', category: 'religion', era: 'early-modern', region: 'Europe', description: 'Martin Luther posts 95 Theses' },
    { year: 1543, title: 'Copernican Revolution', category: 'science', era: 'early-modern', region: 'Europe', description: 'Heliocentric model of the solar system proposed' },
    { year: 1588, title: 'Spanish Armada Defeated', category: 'military', era: 'early-modern', region: 'Europe', description: 'England defeats Spanish naval invasion' },
    { year: 1607, title: 'Jamestown Founded', category: 'colonization', era: 'early-modern', region: 'Americas', description: 'First permanent English settlement in Americas' },
    { year: 1687, title: 'Newton Publishes Principia', category: 'science', era: 'early-modern', region: 'Europe', description: 'Laws of motion and universal gravitation' },
    { year: 1776, title: 'American Independence', category: 'politics', era: 'early-modern', region: 'Americas', description: 'Declaration of Independence signed' },
    { year: 1789, title: 'French Revolution Begins', category: 'politics', era: 'early-modern', region: 'Europe', description: 'Storming of the Bastille' },

    // Modern Era
    { year: 1804, title: 'Napoleon Becomes Emperor', category: 'politics', era: 'modern', region: 'Europe', description: 'Napoleon Bonaparte crowns himself Emperor of France' },
    { year: 1859, title: 'Origin of Species Published', category: 'science', era: 'modern', region: 'Europe', description: "Darwin's theory of evolution" },
    { year: 1861, title: 'American Civil War Begins', category: 'military', era: 'modern', region: 'Americas', description: 'War between Union and Confederate states' },
    { year: 1869, title: 'Suez Canal Opens', category: 'engineering', era: 'modern', region: 'Africa', description: 'Major shipping route connecting Mediterranean to Red Sea' },
    { year: 1876, title: 'Telephone Invented', category: 'technology', era: 'modern', region: 'Americas', description: 'Alexander Graham Bell patents the telephone' },
    { year: 1903, title: 'First Powered Flight', category: 'technology', era: 'modern', region: 'Americas', description: 'Wright Brothers fly at Kitty Hawk' },
    { year: 1914, title: 'World War I Begins', category: 'military', era: 'modern', region: 'Europe', description: 'Assassination of Archduke Franz Ferdinand' },
    { year: 1929, title: 'Wall Street Crash', category: 'economics', era: 'modern', region: 'Americas', description: 'Beginning of Great Depression' },
    { year: 1939, title: 'World War II Begins', category: 'military', era: 'modern', region: 'Europe', description: 'Germany invades Poland' },
    { year: 1945, title: 'Atomic Bombs Dropped', category: 'military', era: 'modern', region: 'Asia', description: 'Nuclear weapons used on Hiroshima and Nagasaki' },
    { year: 1947, title: 'Indian Independence', category: 'politics', era: 'modern', region: 'Asia', description: 'India gains independence from British rule' },
    { year: 1969, title: 'Moon Landing', category: 'technology', era: 'modern', region: 'Space', description: 'Apollo 11 lands on the Moon' },
    { year: 1989, title: 'Fall of Berlin Wall', category: 'politics', era: 'modern', region: 'Europe', description: 'Symbol of end of Cold War' },
    { year: 1991, title: 'Soviet Union Dissolves', category: 'politics', era: 'modern', region: 'Europe', description: 'End of Cold War, new nations emerge' },

    // Contemporary
    { year: 2001, title: 'September 11 Attacks', category: 'terrorism', era: 'contemporary', region: 'Americas', description: 'Terrorist attacks on World Trade Center and Pentagon' },
    { year: 2008, title: 'Global Financial Crisis', category: 'economics', era: 'contemporary', region: 'Global', description: 'Worst financial crisis since Great Depression' },
    { year: 2011, title: 'Arab Spring', category: 'politics', era: 'contemporary', region: 'Middle East', description: 'Wave of protests across Middle East and North Africa' },
    { year: 2020, title: 'COVID-19 Pandemic', category: 'disaster', era: 'contemporary', region: 'Global', description: 'Global pandemic affecting billions worldwide' },
    { year: 2022, title: 'Russia-Ukraine War', category: 'military', era: 'contemporary', region: 'Europe', description: 'Major conflict in Eastern Europe' }
];

// Category icons
const CATEGORY_ICONS = {
    civilization: Globe,
    politics: Landmark,
    military: Swords,
    science: Lightbulb,
    religion: BookOpen,
    technology: Lightbulb,
    architecture: Landmark,
    exploration: Globe,
    culture: Users,
    law: Scroll,
    disaster: Crown,
    economics: Crown,
    colonization: Globe,
    engineering: Lightbulb,
    terrorism: Swords
};

const HistoryTimelineLab = () => {
    const [selectedEra, setSelectedEra] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(null);
    const [viewRange, setViewRange] = useState({ start: -3000, end: 2024 });
    const timelineRef = useRef(null);

    // Filter events
    const filteredEvents = EVENTS.filter(event => {
        if (selectedEra && event.era !== selectedEra) return false;
        if (categoryFilter && event.category !== categoryFilter) return false;
        if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (event.year < viewRange.start || event.year > viewRange.end) return false;
        return true;
    }).sort((a, b) => a.year - b.year);

    // Get unique categories
    const categories = [...new Set(EVENTS.map(e => e.category))];

    // Format year display
    const formatYear = (year) => {
        if (year < 0) return `${Math.abs(year)} BCE`;
        return `${year} CE`;
    };

    // Get era color
    const getEraColor = (year) => {
        const era = ERAS.find(e => year >= e.start && year <= e.end);
        return era?.color || '#888';
    };

    // Calculate position on timeline
    const getTimelinePosition = (year) => {
        const totalRange = viewRange.end - viewRange.start;
        const position = ((year - viewRange.start) / totalRange) * 100;
        return Math.max(0, Math.min(100, position));
    };

    // Zoom controls
    const zoomIn = () => {
        const center = (viewRange.start + viewRange.end) / 2;
        const newRange = (viewRange.end - viewRange.start) * 0.7;
        setViewRange({
            start: Math.max(-3000, center - newRange / 2),
            end: Math.min(2024, center + newRange / 2)
        });
    };

    const zoomOut = () => {
        const center = (viewRange.start + viewRange.end) / 2;
        const newRange = (viewRange.end - viewRange.start) * 1.4;
        setViewRange({
            start: Math.max(-3000, center - newRange / 2),
            end: Math.min(2024, center + newRange / 2)
        });
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl">
                            <Clock size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">History Timeline Lab</h1>
                            <p className="text-sm text-gray-500">Explore Human History</p>
                        </div>
                    </div>

                    {/* Search and Zoom */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search events..."
                                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-yellow-500 w-64"
                            />
                        </div>
                        <div className="flex gap-1">
                            <button onClick={zoomIn} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                                <ZoomIn size={18} />
                            </button>
                            <button onClick={zoomOut} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                                <ZoomOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Era Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setSelectedEra(null)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!selectedEra ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        All Eras
                    </button>
                    {ERAS.map(era => (
                        <button
                            key={era.id}
                            onClick={() => setSelectedEra(selectedEra === era.id ? null : era.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedEra === era.id
                                    ? 'text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            style={selectedEra === era.id ? { backgroundColor: era.color } : {}}
                        >
                            {era.name}
                        </button>
                    ))}
                </div>

                {/* Timeline Visualization */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
                    {/* Era bars */}
                    <div className="relative h-8 mb-4 rounded-lg overflow-hidden">
                        {ERAS.map(era => {
                            const startPos = getTimelinePosition(era.start);
                            const endPos = getTimelinePosition(era.end);
                            const width = endPos - startPos;
                            if (width <= 0) return null;
                            return (
                                <div
                                    key={era.id}
                                    className="absolute h-full flex items-center justify-center text-xs font-medium text-white/80"
                                    style={{
                                        left: `${startPos}%`,
                                        width: `${width}%`,
                                        backgroundColor: era.color
                                    }}
                                >
                                    {width > 10 && era.name}
                                </div>
                            );
                        })}
                    </div>

                    {/* Event markers */}
                    <div className="relative h-40 bg-gray-800/50 rounded-lg" ref={timelineRef}>
                        {filteredEvents.map((event, idx) => {
                            const pos = getTimelinePosition(event.year);
                            return (
                                <motion.button
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    onClick={() => setSelectedEvent(event)}
                                    className="absolute w-3 h-3 rounded-full border-2 border-white cursor-pointer hover:scale-150 transition-transform"
                                    style={{
                                        left: `${pos}%`,
                                        top: `${20 + (idx % 5) * 20}px`,
                                        backgroundColor: getEraColor(event.year),
                                        transform: 'translateX(-50%)'
                                    }}
                                    title={`${event.title} (${formatYear(event.year)})`}
                                />
                            );
                        })}
                    </div>

                    {/* Year markers */}
                    <div className="flex justify-between mt-4 text-xs text-gray-500">
                        <span>{formatYear(viewRange.start)}</span>
                        <span>{formatYear(Math.floor((viewRange.start + viewRange.end) / 2))}</span>
                        <span>{formatYear(viewRange.end)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Category Filter */}
                    <div className="space-y-4">
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Categories</h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setCategoryFilter(null)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!categoryFilter ? 'bg-yellow-600/20 text-yellow-400' : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                >
                                    All Categories ({EVENTS.length})
                                </button>
                                {categories.map(cat => {
                                    const Icon = CATEGORY_ICONS[cat] || BookOpen;
                                    const count = EVENTS.filter(e => e.category === cat).length;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${categoryFilter === cat ? 'bg-yellow-600/20 text-yellow-400' : 'text-gray-400 hover:bg-gray-800'
                                                }`}
                                        >
                                            <Icon size={14} />
                                            <span className="capitalize">{cat}</span>
                                            <span className="ml-auto text-xs text-gray-500">({count})</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                            <h3 className="text-sm font-medium text-gray-400 mb-3">Statistics</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Total Events</span>
                                    <span className="text-white">{EVENTS.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Filtered Events</span>
                                    <span className="text-yellow-400">{filteredEvents.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Time Span</span>
                                    <span className="text-white">{Math.abs(viewRange.end - viewRange.start)} years</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Events List */}
                    <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-4 max-h-[600px] overflow-y-auto">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">
                            Events ({filteredEvents.length})
                        </h3>
                        <div className="space-y-3">
                            {filteredEvents.map((event, idx) => {
                                const Icon = CATEGORY_ICONS[event.category] || BookOpen;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => setSelectedEvent(event)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedEvent === event
                                                ? 'bg-yellow-600/10 border-yellow-600'
                                                : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="p-2 rounded-lg"
                                                style={{ backgroundColor: `${getEraColor(event.year)}20` }}
                                            >
                                                <Icon size={18} style={{ color: getEraColor(event.year) }} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-white">{event.title}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                                        {formatYear(event.year)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-400">{event.description}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-xs text-gray-500 capitalize">{event.category}</span>
                                                    <span className="text-xs text-gray-600">•</span>
                                                    <span className="text-xs text-gray-500">{event.region}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryTimelineLab;
