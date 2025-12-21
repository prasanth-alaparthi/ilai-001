import { motion } from 'framer-motion';

/**
 * ThoughtStream - Visualizes AI reasoning process
 * Shows elegant flowing line during computation
 */
export const ThoughtStream = ({ isThinking = false, width = 400, height = 100 }) => {
    if (!isThinking) return null;

    return (
        <svg
            className="thought-stream mx-auto my-4"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
        >
            <defs>
                <linearGradient id="thought-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F8C3CD" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#E6E6FA" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#D8BFD8" stopOpacity="0.8" />
                </linearGradient>
            </defs>

            <motion.path
                d={`M 0 ${height / 2} Q ${width / 4} ${height * 0.2}, ${width / 2} ${height / 2} T ${width} ${height / 2}`}
                stroke="url(#thought-gradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                    pathLength: [0, 1, 0],
                    opacity: [0, 0.6, 0],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Secondary flowing line for depth */}
            <motion.path
                d={`M 0 ${height / 2} Q ${width / 4} ${height * 0.8}, ${width / 2} ${height / 2} T ${width} ${height / 2}`}
                stroke="url(#thought-gradient)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                    pathLength: [0, 1, 0],
                    opacity: [0, 0.4, 0],
                }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.3,
                }}
            />
        </svg>
    );
};
