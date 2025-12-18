/**
 * ILAI Professional Labs - Political Science Lab
 * 
 * Government and political systems:
 * - Government structures
 * - Constitutional concepts
 * - Electoral systems
 * - International relations
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Landmark, Scale, Globe, Users, Vote, BookOpen,
    ChevronRight, Info
} from 'lucide-react';

// Government types
const GOVERNMENT_TYPES = [
    {
        name: 'Democracy',
        description: 'Government by the people, exercised either directly or through elected representatives.',
        examples: ['USA', 'India', 'Germany', 'France'],
        features: ['Free elections', 'Rule of law', 'Civil liberties', 'Separation of powers']
    },
    {
        name: 'Constitutional Monarchy',
        description: 'A monarch shares power with a constitutionally organized government.',
        examples: ['UK', 'Japan', 'Spain', 'Sweden'],
        features: ['Hereditary monarch', 'Elected parliament', 'Written constitution', 'Limited royal power']
    },
    {
        name: 'Federal Republic',
        description: 'Power is divided between a central government and regional governments.',
        examples: ['USA', 'Germany', 'India', 'Brazil'],
        features: ['Division of powers', 'State rights', 'Central government', 'Federal constitution']
    },
    {
        name: 'Parliamentary System',
        description: 'Executive branch derives its legitimacy from the legislature.',
        examples: ['UK', 'Canada', 'Australia', 'Italy'],
        features: ['Prime Minister', 'Parliamentary majority', 'Vote of confidence', 'Fusion of powers']
    },
    {
        name: 'Presidential System',
        description: 'President is both head of state and head of government.',
        examples: ['USA', 'Brazil', 'Mexico', 'South Korea'],
        features: ['Elected president', 'Separation of powers', 'Fixed terms', 'Veto power']
    }
];

// Constitutional principles
const CONSTITUTIONAL_PRINCIPLES = [
    { name: 'Separation of Powers', description: 'Division of government into legislative, executive, and judicial branches.' },
    { name: 'Checks and Balances', description: 'Each branch can limit the powers of the other branches.' },
    { name: 'Federalism', description: 'Power is divided between national and state governments.' },
    { name: 'Rule of Law', description: 'All people and institutions are subject to and accountable to law.' },
    { name: 'Due Process', description: 'Fair treatment through the normal judicial system.' },
    { name: 'Equal Protection', description: 'All persons are entitled to equal protection under the law.' }
];

// International organizations
const INTERNATIONAL_ORGS = [
    { name: 'United Nations', abbr: 'UN', founded: 1945, members: 193, purpose: 'International peace and security' },
    { name: 'European Union', abbr: 'EU', founded: 1993, members: 27, purpose: 'Economic and political union' },
    { name: 'NATO', abbr: 'NATO', founded: 1949, members: 31, purpose: 'Collective defense' },
    { name: 'World Trade Organization', abbr: 'WTO', founded: 1995, members: 164, purpose: 'Trade regulation' },
    { name: 'African Union', abbr: 'AU', founded: 2002, members: 55, purpose: 'African integration' }
];

const PoliticalScienceLab = () => {
    const [activeTab, setActiveTab] = useState('governments');
    const [selectedGovt, setSelectedGovt] = useState(GOVERNMENT_TYPES[0]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Landmark size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Political Science Lab</h1>
                        <p className="text-sm text-gray-500">Government & Politics</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-900 rounded-xl p-1 w-fit">
                    {['governments', 'constitution', 'international'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Governments Tab */}
                {activeTab === 'governments' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-400">Government Types</h3>
                            {GOVERNMENT_TYPES.map((govt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedGovt(govt)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${selectedGovt === govt
                                            ? 'bg-blue-600/10 border-blue-500'
                                            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                                        }`}
                                >
                                    <div className="font-medium text-white">{govt.name}</div>
                                </button>
                            ))}
                        </div>

                        <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 p-6">
                            <h3 className="text-xl font-medium text-white mb-4">{selectedGovt.name}</h3>
                            <p className="text-gray-400 mb-6">{selectedGovt.description}</p>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm text-gray-500 mb-3">Examples</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedGovt.examples.map((ex, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                                {ex}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm text-gray-500 mb-3">Key Features</h4>
                                    <ul className="space-y-2">
                                        {selectedGovt.features.map((feat, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm">
                                                <ChevronRight size={14} className="text-blue-400" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Constitution Tab */}
                {activeTab === 'constitution' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {CONSTITUTIONAL_PRINCIPLES.map((principle, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Scale size={20} className="text-blue-400" />
                                    </div>
                                    <h3 className="font-medium text-white">{principle.name}</h3>
                                </div>
                                <p className="text-sm text-gray-400">{principle.description}</p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* International Tab */}
                {activeTab === 'international' && (
                    <div className="space-y-4">
                        {INTERNATIONAL_ORGS.map((org, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-gray-900 rounded-xl border border-gray-800 p-6 flex items-center gap-6"
                            >
                                <div className="p-4 bg-blue-500/20 rounded-xl">
                                    <Globe size={32} className="text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-medium text-white">{org.name}</h3>
                                        <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-400">{org.abbr}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{org.purpose}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-400">{org.members}</div>
                                    <div className="text-xs text-gray-500">Members</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-medium text-gray-300">{org.founded}</div>
                                    <div className="text-xs text-gray-500">Founded</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PoliticalScienceLab;
