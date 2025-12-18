/**
 * ILAI Professional Labs - Culture Lab
 * 
 * World cultures and traditions:
 * - Cultural regions
 * - Art movements
 * - World heritage
 * - Cultural practices
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Globe2, Music, Utensils, Palette, Building, Users,
    ChevronRight, MapPin, Calendar
} from 'lucide-react';

// World cultures
const WORLD_CULTURES = [
    {
        region: 'East Asia',
        countries: ['China', 'Japan', 'Korea'],
        traditions: ['Tea ceremonies', 'Calligraphy', 'Martial arts'],
        festivals: ['Lunar New Year', 'Cherry Blossom Festival'],
        color: '#EF4444'
    },
    {
        region: 'South Asia',
        countries: ['India', 'Pakistan', 'Bangladesh'],
        traditions: ['Yoga', 'Classical dance', 'Spice cuisine'],
        festivals: ['Diwali', 'Holi', 'Eid'],
        color: '#F59E0B'
    },
    {
        region: 'Middle East',
        countries: ['UAE', 'Saudi Arabia', 'Turkey'],
        traditions: ['Arabic hospitality', 'Calligraphy', 'Carpet weaving'],
        festivals: ['Ramadan', 'Nowruz'],
        color: '#22C55E'
    },
    {
        region: 'Europe',
        countries: ['Italy', 'France', 'Spain'],
        traditions: ['Classical music', 'Fine dining', 'Architecture'],
        festivals: ['Carnival', 'Oktoberfest', 'La Tomatina'],
        color: '#3B82F6'
    },
    {
        region: 'Africa',
        countries: ['Nigeria', 'Kenya', 'South Africa'],
        traditions: ['Tribal art', 'Drum music', 'Storytelling'],
        festivals: ['Kwanzaa', 'Timkat', 'Cape Town Carnival'],
        color: '#8B5CF6'
    },
    {
        region: 'Americas',
        countries: ['USA', 'Brazil', 'Mexico'],
        traditions: ['Jazz music', 'Carnival', 'Day of the Dead'],
        festivals: ['Thanksgiving', 'Mardi Gras', 'Día de los Muertos'],
        color: '#EC4899'
    }
];

// Art movements
const ART_MOVEMENTS = [
    { name: 'Renaissance', period: '14th-17th c.', origin: 'Italy', artists: ['Leonardo da Vinci', 'Michelangelo'] },
    { name: 'Impressionism', period: '19th c.', origin: 'France', artists: ['Monet', 'Renoir'] },
    { name: 'Cubism', period: '20th c.', origin: 'France', artists: ['Picasso', 'Braque'] },
    { name: 'Pop Art', period: '1950s-60s', origin: 'USA/UK', artists: ['Warhol', 'Lichtenstein'] },
    { name: 'Ukiyo-e', period: '17th-19th c.', origin: 'Japan', artists: ['Hokusai', 'Hiroshige'] },
    { name: 'Islamic Art', period: '7th c.-present', origin: 'Middle East', artists: ['Geometric patterns', 'Calligraphy'] }
];

// World Heritage Sites
const HERITAGE_SITES = [
    { name: 'Taj Mahal', location: 'India', type: 'Cultural', year: 1983 },
    { name: 'Machu Picchu', location: 'Peru', type: 'Cultural', year: 1983 },
    { name: 'Great Wall of China', location: 'China', type: 'Cultural', year: 1987 },
    { name: 'Colosseum', location: 'Italy', type: 'Cultural', year: 1980 },
    { name: 'Petra', location: 'Jordan', type: 'Cultural', year: 1985 },
    { name: 'Pyramids of Giza', location: 'Egypt', type: 'Cultural', year: 1979 }
];

const CultureLab = () => {
    const [activeTab, setActiveTab] = useState('cultures');
    const [selectedCulture, setSelectedCulture] = useState(WORLD_CULTURES[0]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                        <Globe2 size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Culture Lab</h1>
                        <p className="text-sm text-gray-500">World Cultures & Traditions</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {['cultures', 'art', 'heritage'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-orange-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Cultures Tab */}
                {activeTab === 'cultures' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-400">World Regions</h3>
                            {WORLD_CULTURES.map((culture, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedCulture(culture)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${selectedCulture === culture
                                            ? 'border-orange-500'
                                            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                                        }`}
                                    style={selectedCulture === culture ? { backgroundColor: `${culture.color}20` } : {}}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: culture.color }}
                                    />
                                    <span className="font-medium text-white">{culture.region}</span>
                                </button>
                            ))}
                        </div>

                        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <div
                                className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white mb-4"
                                style={{ backgroundColor: selectedCulture.color }}
                            >
                                {selectedCulture.region}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                                        <MapPin size={14} /> Countries
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCulture.countries.map((country, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                                                {country}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                                        <Users size={14} /> Traditions
                                    </h4>
                                    <ul className="space-y-2">
                                        {selectedCulture.traditions.map((tradition, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm">
                                                <ChevronRight size={14} className="text-orange-400" />
                                                {tradition}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="md:col-span-2">
                                    <h4 className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                                        <Calendar size={14} /> Major Festivals
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCulture.festivals.map((festival, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 rounded-full text-sm"
                                                style={{ backgroundColor: `${selectedCulture.color}30`, color: selectedCulture.color }}
                                            >
                                                {festival}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Art Tab */}
                {activeTab === 'art' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ART_MOVEMENTS.map((movement, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-orange-500/20 rounded-lg">
                                        <Palette size={20} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{movement.name}</h3>
                                        <p className="text-xs text-gray-500">{movement.period}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">Origin: {movement.origin}</p>
                                <div className="flex flex-wrap gap-1">
                                    {movement.artists.map((artist, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-800 rounded">
                                            {artist}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Heritage Tab */}
                {activeTab === 'heritage' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {HERITAGE_SITES.map((site, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-orange-500/20 rounded-lg">
                                        <Building size={20} className="text-orange-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-white">{site.name}</h3>
                                        <p className="text-xs text-gray-500">{site.location}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">{site.type}</span>
                                    <span className="text-orange-400">UNESCO {site.year}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CultureLab;
