import { motion } from 'framer-motion';

/**
 * BreathingBackground - Creates a living, breathing ambient gradient
 * that subtly shifts colors over 60 seconds to make the app feel alive.
 */
export const BreathingBackground = () => {
    return (
        <motion.div
            className="fixed inset-0 -z-10"
            style={{
                background: 'radial-gradient(circle at 20% 50%, #FDF0F0 0%, #E6E6FA 50%, #F8C3CD 100%)',
                willChange: 'background', // GPU acceleration hint
            }}
            animate={{
                background: [
                    'radial-gradient(circle at 20% 50%, #FDF0F0 0%, #E6E6FA 50%, #F8C3CD 100%)',
                    'radial-gradient(circle at 80% 50%, #E6E6FA 0%, #F8C3CD 50%, #FDF0F0 100%)',
                    'radial-gradient(circle at 50% 80%, #F8C3CD 0%, #FDF0F0 50%, #E6E6FA 100%)',
                    'radial-gradient(circle at 20% 20%, #D8BFD8 0%, #FDF0F0 50%, #E6E6FA 100%)',
                    'radial-gradient(circle at 20% 50%, #FDF0F0 0%, #E6E6FA 50%, #F8C3CD 100%)',
                ],
            }}
            transition={{
                duration: 60,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
};
