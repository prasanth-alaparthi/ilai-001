import React from 'react';
import { motion } from 'framer-motion';
import { Award, BookOpen, Clock, Target, Sparkles, Send } from 'lucide-react';

/**
 * BountyCard Component
 * Modern, high-contrast academic bounty card with "Slate & Electric Blue" palette.
 * 
 * @param {object} bounty The bounty data
 * @param {function} onSolve Action when student clicks "Solve with Note"
 */
const BountyCard = ({ bounty, onSolve }) => {
    // Subject colors mapping (fallback if no specific subject color)
    const getSubjectColor = (subject) => {
        const colors = {
            'Physics': 'text-blue-400',
            'Chemistry': 'text-amber-400',
            'Mathematics': 'text-indigo-400',
            'Biology': 'text-emerald-400',
            'Computer Science': 'text-purple-400',
        };
        return colors[subject] || 'text-accent-blue';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className="group relative bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-accent-blue/50 transition-all duration-300 shadow-xl hover:shadow-accent-blue/10"
        >
            {/* High Contrast Accent Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue via-accent-glow to-accent-blue opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="p-6">
                {/* Header: Subject & Tags */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${getSubjectColor(bounty.subject)}`}>
                        <BookOpen size={14} />
                        {bounty.subject || 'Academic'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-secondary/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        <Clock size={10} />
                        {new Date(bounty.createdAt).toLocaleDateString()}
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-primary mb-3 group-hover:text-accent-blue transition-colors leading-tight">
                    {bounty.title}
                </h3>

                {/* Reward & Info List */}
                <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-accent-blue/5 border border-accent-blue/10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-accent-blue/20 rounded-lg text-accent-blue">
                                <Award size={18} />
                            </div>
                            <span className="text-sm font-medium text-slate-200">Reputation Reward</span>
                        </div>
                        <span className="text-lg font-bold text-accent-blue tracking-tight">+{bounty.rewardPoints || 50} pts</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-secondary/70 px-1">
                        <div className="flex items-center gap-1.5">
                            <Target size={14} className="text-secondary/40" />
                            <span>{bounty.difficulty || 'Intermediate'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={14} className="text-secondary/40" />
                            <span>{bounty.attemptCount || 0} Solvers</span>
                        </div>
                    </div>
                </div>

                {/* Solve Button */}
                <button
                    onClick={() => onSolve(bounty)}
                    className="w-full relative group/btn flex items-center justify-center gap-2 py-3 px-4 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(74,144,226,0.3)] hover:shadow-[0_0_30px_rgba(74,144,226,0.5)] active:scale-[0.98] overflow-hidden"
                >
                    {/* Button Shine Animation */}
                    <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
                    />

                    <Send size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    <span>Solve with Note</span>
                </button>
            </div>

            {/* Creator Badge (Bottom Status) */}
            <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-blue to-accent-green p-[1px]">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] text-accent-blue font-bold">
                            {bounty.creatorName?.charAt(0) || 'U'}
                        </div>
                    </div>
                    <span className="text-[11px] text-secondary font-medium">{bounty.creatorName || 'Student Peer'}</span>
                </div>
                <div className="text-[10px] font-bold text-accent-glow px-2 py-0.5 rounded-md bg-accent-glow/10 uppercase tracking-wider">
                    Open
                </div>
            </div>
        </motion.div>
    );
};

export default BountyCard;
