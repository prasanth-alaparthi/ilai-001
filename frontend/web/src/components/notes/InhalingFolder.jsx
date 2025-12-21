import { motion } from 'framer-motion';

/**
 * InhalingFolder - Folder that "breathes" when new content arrives
 * Creates a calming inhale/exhale animation with rose-quartz glow
 */
export const InhalingFolder = ({ isInhaling, children, onClick }) => {
    return (
        <motion.div
            animate={isInhaling ? {
                scale: [1, 1.03, 1, 1.03, 1],
                boxShadow: [
                    '0 0 0px rgba(248, 195, 205, 0)',
                    '0 0 25px rgba(248, 195, 205, 0.6)',
                    '0 0 0px rgba(248, 195, 205, 0)',
                    '0 0 25px rgba(248, 195, 205, 0.6)',
                    '0 0 0px rgba(248, 195, 205, 0)',
                ],
                backgroundColor: [
                    'transparent',
                    'rgba(248, 195, 205, 0.08)',
                    'transparent',
                    'rgba(248, 195, 205, 0.08)',
                    'transparent',
                ],
            } : {}}
            transition={{
                duration: 4,
                repeat: isInhaling ? Infinity : 0,
                ease: 'easeInOut',
            }}
            className="folder-item rounded-3xl p-3 cursor-pointer transition-all"
            onClick={onClick}
            whileHover={!isInhaling ? {
                backgroundColor: 'rgba(230, 230, 250, 0.1)',
            } : {}}
        >
            {children}
        </motion.div>
    );
};
