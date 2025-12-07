import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VideoCameraIcon, BookOpenIcon, CalendarIcon } from '@heroicons/react/24/outline';

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
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Classrooms</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <div key={cls.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{cls.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{cls.subject}</p>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-semibold ${cls.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {cls.active ? 'LIVE NOW' : 'Scheduled'}
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 flex-1">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <BookOpenIcon className="w-4 h-4 mr-2" />
                                {cls.teacher}
                            </div>
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                {cls.schedule}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <Link
                                to={`/classroom/${cls.id}`}
                                className="flex-1 py-2 text-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                View Materials
                            </Link>
                            {cls.active && (
                                <Link
                                    to={`/classroom/${cls.id}/live`}
                                    className="flex-1 py-2 text-center rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                                >
                                    <VideoCameraIcon className="w-4 h-4 mr-2" />
                                    Join Class
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClassroomDashboard;
