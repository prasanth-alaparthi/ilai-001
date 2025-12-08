import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Video, BookOpen, Calendar, ArrowRight, User } from 'lucide-react';
import { motion } from 'framer-motion';

const ClassroomDashboard = () => {
    const [classes, setClasses] = useState([]);

    useEffect(() => {
        // Mock data for now
        setClasses([
            { id: 1, name: 'Physics 101', subject: 'Physics', teacher: 'Dr. Smith', schedule: 'Mon 10:00 AM', active: true },
            { id: 2, name: 'Chemistry Lab', subject: 'Chemistry', teacher: 'Prof. Doe', schedule: 'Wed 2:00 PM', active: false },
            { id: 3, name: 'Calculus II', subject: 'Math', teacher: 'Mrs. Johnson', schedule: 'Fri 11:00 AM', active: false },
        ]);
    }, []);

    return (
        <div className="min-h-screen bg-background text-primary p-6 md:p-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto"
            >
                <div className="mb-12">
                    <h1 className="text-4xl font-serif font-bold text-primary mb-2">My Classrooms</h1>
                    <p className="text-secondary">Access your course materials and join live sessions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((cls, idx) => (
                        <motion.div
                            key={cls.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card rounded-2xl p-6 border border-black/5 dark:border-white/10 flex flex-col group hover:border-accent-glow/30 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-primary group-hover:text-accent-glow transition-colors">{cls.name}</h2>
                                    <p className="text-sm font-medium text-secondary/70">{cls.subject}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${cls.active ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse' : 'bg-surface-800 text-secondary border border-black/5 dark:border-white/10'}`}>
                                    {cls.active ? 'Live Now' : 'Scheduled'}
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                <div className="flex items-center text-sm text-secondary">
                                    <User className="w-4 h-4 mr-3 text-accent-blue" />
                                    {cls.teacher}
                                </div>
                                <div className="flex items-center text-sm text-secondary">
                                    <Calendar className="w-4 h-4 mr-3 text-accent-blue" />
                                    {cls.schedule}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto">
                                <Link
                                    to={`/classroom/${cls.id}`}
                                    className="flex-1 py-2.5 text-center rounded-xl bg-surface-800 text-secondary hover:text-primary hover:bg-surface-700 transition-colors text-sm font-medium"
                                >
                                    View Materials
                                </Link>
                                {cls.active && (
                                    <Link
                                        to={`/classroom/${cls.id}/live`}
                                        className="flex-1 py-2.5 text-center rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-red-900/20"
                                    >
                                        <Video className="w-4 h-4" />
                                        Join Class
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ClassroomDashboard;
