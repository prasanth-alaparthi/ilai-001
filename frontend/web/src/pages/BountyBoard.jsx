import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Award, Filter, Search, Loader2 } from 'lucide-react';
import BountyCard from '../components/social/BountyCard';
import NotePickerModal from '../components/modals/NotePickerModal';
import bountyService from '../services/bountyService';

/**
 * BountyBoard Page
 * Student B interface to browse academic bounties and solve them.
 */
const BountyBoard = () => {
    const [bounties, setBounties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBounty, setSelectedBounty] = useState(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadBounties();
    }, []);

    const loadBounties = async () => {
        setLoading(true);
        try {
            const data = await bountyService.getBounties();
            setBounties(Array.isArray(data) ? data : data.content || []);
        } catch (err) {
            console.error('Failed to load bounties', err);
            // Fallback mock data for demo
            setBounties([
                { id: 1, title: "Quantum Entanglement Problem Set #4", subject: "Physics", rewardPoints: 50, createdAt: new Date().toISOString(), creatorName: "Student A", difficulty: "Hard", attemptCount: 2 },
                { id: 2, title: "Organic Chemistry Synthesis - Aspirin", subject: "Chemistry", rewardPoints: 50, createdAt: new Date().toISOString(), creatorName: "Emily Chen", difficulty: "Medium", attemptCount: 5 },
                { id: 3, title: "Derive Euler's Identity from Taylor Series", subject: "Mathematics", rewardPoints: 50, createdAt: new Date().toISOString(), creatorName: "Xavier W.", difficulty: "Expert", attemptCount: 0 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSolveTrigger = (bounty) => {
        setSelectedBounty(bounty);
        setIsPickerOpen(true);
    };

    const handleConfirmSolve = async (note) => {
        try {
            await bountyService.submitSolution(selectedBounty.id, {
                solutionNoteId: note.id,
                comment: `Solving: ${selectedBounty.title}`
            });

            // Success Visual Feedback
            setToast({
                message: "Success! +50 Reputation Points awarded.",
                type: "success"
            });

            // Remove from local list for effect
            setBounties(prev => prev.filter(b => b.id !== selectedBounty.id));

            // Clear toast after 4s
            setTimeout(() => setToast(null), 4000);
        } catch (err) {
            console.error('Solve failed', err);
            setToast({ message: "Submission failed. Please try again.", type: "error" });
            setTimeout(() => setToast(null), 4000);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 lg:p-10">
            {/* Header Area */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 5 }}
                            >
                                <Trophy className="text-amber-400 w-8 h-8" />
                            </motion.div>
                            <h1 className="text-4xl font-serif font-bold text-primary">Bounty Board</h1>
                        </div>
                        <p className="text-secondary text-lg max-w-xl">
                            The academic stock exchange. Solve problems, share knowledge, and build your scholarly reputation.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl flex items-center gap-3">
                            <Award className="text-accent-blue w-5 h-5" />
                            <div>
                                <div className="text-[10px] text-secondary uppercase font-bold tracking-widest">My Reputation</div>
                                <div className="text-lg font-bold text-primary">1,250 <span className="text-accent-blue">XP</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                        <select className="pl-9 pr-6 py-2 bg-surface border border-border rounded-xl text-sm text-primary appearance-none focus:outline-none focus:border-accent-blue/50">
                            <option>All Subjects</option>
                            <option>Physics</option>
                            <option>Chemistry</option>
                            <option>Mathematics</option>
                        </select>
                    </div>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Find a challenge..."
                            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-sm text-primary focus:outline-none focus:border-accent-blue/50"
                        />
                    </div>
                </div>
            </div>

            {/* Bounties Grid */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 text-accent-blue animate-spin mb-4" />
                        <p className="text-secondary animate-pulse">Scanning the board for fresh bounties...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bounties.map(bounty => (
                            <BountyCard
                                key={bounty.id}
                                bounty={bounty}
                                onSolve={handleSolveTrigger}
                            />
                        ))}
                    </div>
                )}

                {!loading && bounties.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-white/10">
                        <Sparkles className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
                        <p className="text-secondary text-lg">No open bounties at the moment.</p>
                        <p className="text-sm text-secondary/50 mt-1">Check back soon for new challenges!</p>
                    </div>
                )}
            </div>

            {/* Note Picker Modal */}
            <NotePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                onConfirm={handleConfirmSolve}
            />

            {/* Success Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]"
                    >
                        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success'
                                ? 'bg-accent-blue border-white/20 text-white'
                                : 'bg-red-500 border-white/20 text-white'
                            }`}>
                            {toast.type === 'success' ? <Trophy size={20} /> : <AlertCircle size={20} />}
                            <span className="font-bold tracking-tight">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BountyBoard;
