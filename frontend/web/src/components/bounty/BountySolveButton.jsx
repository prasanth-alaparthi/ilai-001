import { motion } from 'framer-motion';
import { useState } from 'react';
import { AuraLoader } from '../ui/AuraLoader';
import { ThoughtStream } from '../ui/ThoughtStream';

/**
 * BountySolveButton - Multi-state emotive button for bounty solving
 * States: Idle → Analyzing → Calculating → Success → Idle
 */
export const BountySolveButton = ({ bountyId, onSuccess, className = '' }) => {
    const [state, setState] = useState('idle');
    const [rewardPoints, setRewardPoints] = useState(0);
    const [error, setError] = useState(null);

    const handleSolve = async () => {
        try {
            setError(null);
            setState('analyzing');

            // Step 1: AI Analysis
            const analyzeResponse = await fetch('/api/ai/analyze-bounty', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ bountyId })
            });

            if (!analyzeResponse.ok) throw new Error('Analysis failed');

            setState('calculating');

            // Step 2: Compute Engine Solution
            const solveResponse = await fetch('/api/compute/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ bountyId })
            });

            if (!solveResponse.ok) throw new Error('Solution computation failed');

            const data = await solveResponse.json();
            setRewardPoints(data.rewardPoints || 100);
            setState('success');

            // Auto-reset after 5 seconds
            setTimeout(() => {
                setState('idle');
                if (onSuccess) onSuccess(data);
            }, 5000);

        } catch (err) {
            setError(err.message);
            setState('error');
            setTimeout(() => setState('idle'), 3000);
        }
    };

    const stateConfig = {
        idle: {
            text: 'Solve Bounty',
            className: 'btn-alive',
            disabled: false
        },
        analyzing: {
            text: 'Analyzing with AI...',
            className: 'btn-alive opacity-90',
            disabled: true
        },
        calculating: {
            text: 'Computing Solution...',
            className: 'btn-alive opacity-90',
            disabled: true
        },
        success: {
            text: `✓ Reputation +${rewardPoints}`,
            className: 'btn-alive bg-gradient-to-r from-rose-quartz to-lilac-soft',
            disabled: false
        },
        error: {
            text: error || 'Solve Failed',
            className: 'btn-alive bg-red-100',
            disabled: false
        }
    };

    const config = stateConfig[state];

    return (
        <div className="flex flex-col items-center gap-4">
            <motion.button
                whileHover={state === 'idle' || state === 'error' ? { scale: 1.05 } : {}}
                whileTap={state === 'idle' || state === 'error' ? { scale: 0.95 } : {}}
                className={`${config.className} ${className} min-w-[200px] relative overflow-hidden`}
                onClick={handleSolve}
                disabled={config.disabled}
                initial={false}
                animate={{
                    scale: state === 'success' ? [1, 1.1, 1] : 1,
                }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20
                }}
            >
                {/* Loading indicator for analyzing/calculating states */}
                {(state === 'analyzing' || state === 'calculating') && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5">
                            <AuraLoader size={20} />
                        </div>
                    </div>
                )}

                {config.text}
            </motion.button>

            {/* ThoughtStream visualization during calculation */}
            {state === 'calculating' && (
                <ThoughtStream isThinking={true} width={300} height={60} />
            )}
        </div>
    );
};
