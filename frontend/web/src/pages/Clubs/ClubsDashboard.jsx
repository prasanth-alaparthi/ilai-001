import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ClubsDashboard = () => {
    const [clubs, setClubs] = useState([]);

    useEffect(() => {
        // Mock data
        setClubs([
            { id: 1, name: 'Robotics Club', description: 'Building the future, one bot at a time.', members: 24, image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=500&q=60' },
            { id: 2, name: 'Debate Society', description: 'Discussing global issues and sharpening rhetoric.', members: 15, image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=500&q=60' },
            { id: 3, name: 'Chess Club', description: 'Strategy, tactics, and checkmates.', members: 30, image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=500&q=60' },
        ]);
    }, []);

    return (
        <div className="min-h-screen bg-background text-primary p-6 md:p-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-primary mb-2">Student Clubs</h1>
                        <p className="text-secondary">Explore communities and find your passion.</p>
                    </div>
                    <button className="flex items-center px-6 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Club
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {clubs.map((club, idx) => (
                        <motion.div
                            key={club.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Link
                                to={`/clubs/${club.id}`}
                                className="block group glass-card rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 hover:border-accent-glow/50 transition-all duration-500 hover:shadow-2xl hover:shadow-accent-glow/10"
                            >
                                <div className="h-48 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-80" />
                                    <img
                                        src={club.image}
                                        alt={club.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                    />
                                    <div className="absolute bottom-4 left-6 z-20">
                                        <h2 className="text-2xl font-bold text-white mb-1">{club.name}</h2>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <p className="text-secondary text-sm mb-6 line-clamp-2 leading-relaxed font-light">
                                        {club.description}
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/10">
                                        <span className="flex items-center text-xs font-bold text-secondary uppercase tracking-wider">
                                            <Users className="w-4 h-4 mr-2" />
                                            {club.members} Members
                                        </span>
                                        <span className="text-accent-glow group-hover:translate-x-1 transition-transform">
                                            <ArrowRight size={20} />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ClubsDashboard;
