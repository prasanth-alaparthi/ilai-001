import { motion } from 'framer-motion';

/**
 * AuraLoader - A calm, rotating circle of light
 * Replaces frantic spinners with serene loading state
 */
export const AuraLoader = ({ size = 80 }) => {
    return (
        <div className="flex items-center justify-center">
            <motion.div
                className="relative"
                style={{ width: size, height: size }}
            >
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(248, 195, 205, 0.3), rgba(230, 230, 250, 0.5), transparent)',
                        filter: 'blur(8px)',
                    }}
                    animate={{
                        rotate: 360,
                        scale: [1, 1.2, 1],
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{
                        rotate: { duration: 3, repeat: Infinity, ease: 'linear' },
                        scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                        opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                    }}
                />
                <motion.div
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                        borderColor: 'rgba(216, 191, 216, 0.3)',
                        borderTopColor: '#F8C3CD',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            </motion.div>
        </div>
    );
};
