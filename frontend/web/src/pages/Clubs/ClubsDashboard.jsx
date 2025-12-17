import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, ArrowRight, Search, Filter, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllClubs, CLUB_CATEGORIES } from '../../services/clubService';
import CreateClubModal from '../../components/modals/CreateClubModal';

const ClubsDashboard = () => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchClubs = async () => {
        setLoading(true);
        try {
            const data = await getAllClubs(selectedCategory || null, searchQuery || null);
            setClubs(data);
            setError('');
        } catch (err) {
            console.error('Failed to fetch clubs:', err);
            setError('Failed to load clubs');
            // Fallback to mock data for demo
            setClubs([
                { id: 1, name: 'Robotics Club', description: 'Building the future, one bot at a time.', memberCount: 24, category: 'COMPETITION', imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=500&q=60' },
                { id: 2, name: 'Debate Society', description: 'Discussing global issues and sharpening rhetoric.', memberCount: 15, category: 'ACADEMIC', imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=500&q=60' },
                { id: 3, name: 'Chess Club', description: 'Strategy, tactics, and checkmates.', memberCount: 30, category: 'INTEREST', imageUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=500&q=60' },
                { id: 4, name: 'Art & Design', description: 'Express yourself through visual creativity.', memberCount: 18, category: 'CREATIVE', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=500&q=60' },
                { id: 5, name: 'Community Service', description: 'Making a difference in our community.', memberCount: 22, category: 'SERVICE', imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=500&q=60' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClubs();
    }, [selectedCategory]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchClubs();
    };

    const handleClubCreated = (newClub) => {
        setClubs(prev => [newClub, ...prev]);
    };

    const getCategoryInfo = (categoryId) => {
        return CLUB_CATEGORIES.find(c => c.id === categoryId) || { icon: '📚', name: categoryId };
    };

    return (
        <div className="min-h-screen bg-background text-primary p-6 md:p-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-primary mb-2">Student Clubs</h1>
                        <p className="text-secondary">Explore communities and find your passion.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center px-6 py-3 bg-primary text-background font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Club
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                            <input
                                type="text"
                                placeholder="Search clubs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-primary placeholder-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent-glow/50 transition-all"
                            />
                        </div>
                    </form>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedCategory('')}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedCategory === ''
                                    ? 'bg-accent-glow text-background'
                                    : 'bg-white/10 text-secondary hover:bg-white/20'
                                }`}
                        >
                            All
                        </button>
                        {CLUB_CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                        ? 'bg-accent-glow text-background'
                                        : 'bg-white/10 text-secondary hover:bg-white/20'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                <span className="hidden md:inline">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-accent-glow animate-spin" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="text-center py-10 text-secondary">
                        <p>{error}</p>
                    </div>
                )}

                {/* Clubs Grid */}
                {!loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {clubs.map((club, idx) => (
                            <motion.div
                                key={club.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link
                                    to={`/clubs/${club.id}`}
                                    className="block group glass-card rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 hover:border-accent-glow/50 transition-all duration-500 hover:shadow-2xl hover:shadow-accent-glow/10"
                                >
                                    <div className="h-48 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 opacity-80" />
                                        <img
                                            src={club.imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=500&q=60'}
                                            alt={club.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                        />
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className="px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1">
                                                {getCategoryInfo(club.category)?.icon}
                                                {getCategoryInfo(club.category)?.name}
                                            </span>
                                        </div>
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
                                                {club.memberCount || 0} Members
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
                )}

                {/* Empty State */}
                {!loading && clubs.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🏛️</div>
                        <h3 className="text-xl font-bold text-primary mb-2">No clubs found</h3>
                        <p className="text-secondary mb-6">Be the first to create a club!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-6 py-3 bg-accent-glow text-background font-bold rounded-xl hover:bg-accent-glow/90 transition-all"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Club
                        </button>
                    </div>
                )}
            </motion.div>

            {/* Create Club Modal */}
            <CreateClubModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleClubCreated}
            />
        </div>
    );
};

export default ClubsDashboard;

