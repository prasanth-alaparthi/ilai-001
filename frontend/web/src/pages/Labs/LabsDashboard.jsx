import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Terminal, Cpu, Beaker, Calculator, ChevronRight,
    Code, Activity, Play, Lock, Radio, Atom, Leaf,
    // Arts Labs icons
    MessageSquare, BookOpen, Palette, Globe2,
    // Social Labs icons
    MapPin, Landmark, TrendingUp, Clock
} from 'lucide-react';
import labsService from '../../services/labsService';

const LabsDashboard = () => {
    const [stats, setStats] = useState({
        completed: 0,
        inProgress: 0,
        totalTime: '00:00:00'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await labsService.getStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch lab stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const subjects = [
        {
            id: 'physics',
            name: 'PHYSICS_SIM',
            description: 'Mechanics, Thermodynamics, Electromagnetism.',
            icon: Activity,
            color: 'text-cyan-400',
            borderColor: 'border-cyan-400/30',
            bgHover: 'hover:bg-cyan-400/10',
            path: '/labs/physics',
            progress: 45
        },
        {
            id: 'chemistry',
            name: 'CHEM_LAB',
            description: 'Titrations, Molecular Building, Reactions.',
            icon: Beaker,
            color: 'text-emerald-400',
            borderColor: 'border-emerald-400/30',
            bgHover: 'hover:bg-emerald-400/10',
            path: '/labs/chemistry',
            progress: 30
        },
        {
            id: 'cs',
            name: 'DEV_ENV',
            description: 'Python, Java, Web Development Environment.',
            icon: Code,
            color: 'text-fuchsia-400',
            borderColor: 'border-fuchsia-400/30',
            bgHover: 'hover:bg-fuchsia-400/10',
            path: '/labs/cs',
            progress: 60
        },
        {
            id: 'math',
            name: 'MATH_CORE',
            description: 'Graphing, Geometry, Algebra Solvers.',
            icon: Calculator,
            color: 'text-amber-400',
            borderColor: 'border-amber-400/30',
            bgHover: 'hover:bg-amber-400/10',
            path: '/labs/math',
            progress: 25
        },
        {
            id: 'quantum',
            name: 'QUANTUM_SIM',
            description: 'Quantum Circuits, Qubits, Entanglement.',
            icon: Atom,
            color: 'text-violet-400',
            borderColor: 'border-violet-400/30',
            bgHover: 'hover:bg-violet-400/10',
            path: '/labs/quantum',
            progress: 15,
            isNew: true
        },
        {
            id: 'biology',
            name: 'BIO_LAB',
            description: 'Cell Structure, DNA, Heart, Ecosystems.',
            icon: Leaf,
            color: 'text-green-400',
            borderColor: 'border-green-400/30',
            bgHover: 'hover:bg-green-400/10',
            path: '/labs/biology',
            progress: 20,
            isNew: true
        },
        // Arts Labs
        {
            id: 'languages',
            name: 'LANG_LAB',
            description: 'Language Learning, Grammar, Vocabulary Builder.',
            icon: MessageSquare,
            color: 'text-rose-400',
            borderColor: 'border-rose-400/30',
            bgHover: 'hover:bg-rose-400/10',
            path: '/labs/languages',
            progress: 0,
            isNew: true,
            category: 'arts'
        },
        {
            id: 'literature',
            name: 'LIT_LAB',
            description: 'Poetry Analysis, Story Writing, Literary Devices.',
            icon: BookOpen,
            color: 'text-pink-400',
            borderColor: 'border-pink-400/30',
            bgHover: 'hover:bg-pink-400/10',
            path: '/labs/literature',
            progress: 0,
            isNew: true,
            category: 'arts'
        },
        {
            id: 'fashion',
            name: 'FASHION_LAB',
            description: 'Design Principles, Color Theory, Textile Arts.',
            icon: Palette,
            color: 'text-fuchsia-400',
            borderColor: 'border-fuchsia-400/30',
            bgHover: 'hover:bg-fuchsia-400/10',
            path: '/labs/fashion',
            progress: 0,
            isNew: true,
            category: 'arts'
        },
        {
            id: 'culture',
            name: 'CULTURE_LAB',
            description: 'World Cultures, Traditions, Art History.',
            icon: Globe2,
            color: 'text-orange-400',
            borderColor: 'border-orange-400/30',
            bgHover: 'hover:bg-orange-400/10',
            path: '/labs/culture',
            progress: 0,
            isNew: true,
            category: 'arts'
        },
        // Social Labs
        {
            id: 'geography',
            name: 'GEO_LAB',
            description: 'Maps, Continents, Climate, Physical Geography.',
            icon: MapPin,
            color: 'text-teal-400',
            borderColor: 'border-teal-400/30',
            bgHover: 'hover:bg-teal-400/10',
            path: '/labs/geography',
            progress: 0,
            isNew: true,
            category: 'social'
        },
        {
            id: 'political-science',
            name: 'POLI_SCI_LAB',
            description: 'Governance, Constitutions, Political Systems.',
            icon: Landmark,
            color: 'text-blue-400',
            borderColor: 'border-blue-400/30',
            bgHover: 'hover:bg-blue-400/10',
            path: '/labs/political-science',
            progress: 0,
            isNew: true,
            category: 'social'
        },
        {
            id: 'economics',
            name: 'ECON_LAB',
            description: 'Markets, Supply & Demand, Economic Models.',
            icon: TrendingUp,
            color: 'text-lime-400',
            borderColor: 'border-lime-400/30',
            bgHover: 'hover:bg-lime-400/10',
            path: '/labs/economics',
            progress: 0,
            isNew: true,
            category: 'social'
        },
        {
            id: 'history',
            name: 'HISTORY_LAB',
            description: 'Timeline Explorer, Civilizations, Historical Events.',
            icon: Clock,
            color: 'text-yellow-400',
            borderColor: 'border-yellow-400/30',
            bgHover: 'hover:bg-yellow-400/10',
            path: '/labs/history',
            progress: 0,
            isNew: true,
            category: 'social'
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-mono p-4 md:p-8 relative overflow-x-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header Section */}
                <header className="mb-12 border-b border-gray-800 pb-8">
                    <div className="flex items-center gap-3 text-emerald-500 mb-2 animate-pulse">
                        <Terminal size={20} />
                        <span className="text-sm tracking-widest">SYSTEM_READY</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500 mb-4 tracking-tighter">
                        NEURAL LABS v2.0
                    </h1>
                    <p className="text-gray-500 max-w-xl text-lg">
                        Select a simulation environment to begin training.
                    </p>
                </header>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Stats Module */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1 space-y-6"
                    >
                        <div className="bg-[#111] border border-gray-800 p-6 rounded-lg relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50" />
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                                <Cpu size={14} /> Performance Metrics
                            </h3>

                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="text-sm text-gray-400">Total Runtime</div>
                                    <div className="text-2xl font-bold text-white font-mono">{stats.totalTime}</div>
                                </div>
                                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[65%]" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">COMPLETED</div>
                                        <div className="text-xl font-bold text-white">{stats.completed}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">RUNNING</div>
                                        <div className="text-xl font-bold text-emerald-400 animate-pulse">{stats.inProgress}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#111] border border-gray-800 p-6 rounded-lg">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                <Radio size={14} /> System Notices
                            </h3>
                            <div className="space-y-3 text-xs text-gray-400 font-mono">
                                <div className="flex gap-2">
                                    <span className="text-emerald-500">[INFO]</span>
                                    <span>Physics engine update v2.4 installed.</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-amber-500">[WARN]</span>
                                    <span>High latency detected in Chem_Lab module.</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-emerald-500">[INFO]</span>
                                    <span>New Python libraries available in Dev_Env.</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Modules Grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.map((subject, idx) => (
                            <Link
                                key={subject.id}
                                to={subject.path}
                                className={`group bg-[#111] border border-gray-800 hover:border-gray-600 p-6 rounded-lg transition-all duration-300 relative overflow-hidden ${subject.bgHover}`}
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-3 rounded-md bg-gray-900 border border-gray-800 ${subject.color}`}>
                                            <subject.icon size={24} />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-mono text-gray-600 group-hover:text-gray-400">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            ONLINE
                                        </div>
                                    </div>

                                    <h3 className={`text-xl font-bold mb-2 tracking-tight ${subject.color}`}>
                                        {subject.name}
                                        {subject.isNew && (
                                            <span className="ml-2 text-xs font-normal bg-violet-500 text-white px-2 py-0.5 rounded-full">
                                                NEW
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4 font-sans">
                                        {subject.description}
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-500">Progress</span>
                                            <span className={subject.color}>{subject.progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${subject.id === 'quantum' ? 'from-violet-500 to-purple-500' :
                                                    subject.id === 'physics' ? 'from-cyan-500 to-blue-500' :
                                                        subject.id === 'chemistry' ? 'from-emerald-500 to-green-500' :
                                                            subject.id === 'cs' ? 'from-fuchsia-500 to-pink-500' :
                                                                'from-amber-500 to-orange-500'
                                                    }`}
                                                style={{ width: `${subject.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center text-xs font-bold tracking-wider text-gray-400 group-hover:text-white transition-colors">
                                        {subject.progress > 0 ? 'CONTINUE' : 'INITIALIZE'} <ChevronRight size={14} className="ml-1" />
                                    </div>

                                    {/* Decoration */}
                                    <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <subject.icon size={120} />
                                    </div>
                                </motion.div>
                            </Link>
                        ))}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabsDashboard;
