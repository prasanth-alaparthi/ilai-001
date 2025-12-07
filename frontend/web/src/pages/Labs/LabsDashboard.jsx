import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const LabsDashboard = () => {
    const [stats, setStats] = useState({
        completed: 0,
        inProgress: 0,
        totalTime: '0h'
    });

    // Mock stats for now
    useEffect(() => {
        // Fetch stats from API later
        setStats({ completed: 3, inProgress: 2, totalTime: '5h 30m' });
    }, []);

    const subjects = [
        {
            name: 'Physics',
            description: 'Mechanics, Thermodynamics, and Electromagnetism simulations.',
            color: 'from-blue-500 to-cyan-400',
            path: '/labs/physics',
            image: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80'
        },
        {
            name: 'Chemistry',
            description: 'Virtual titrations, molecular building, and reaction balancing.',
            color: 'from-green-500 to-emerald-400',
            path: '/labs/chemistry',
            image: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=80'
        },
        {
            name: 'Computer Science',
            description: 'Interactive coding environments for Python, Java, and Web Dev.',
            color: 'from-purple-500 to-pink-400',
            path: '/labs/cs',
            image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80'
        },
        {
            name: 'Mathematics',
            description: 'Graphing calculators, geometry tools, and algebra solvers.',
            color: 'from-orange-500 to-yellow-400',
            path: '/labs/math',
            image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white shadow-xl">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Welcome to Muse Labs</h1>
                    <p className="text-indigo-100 max-w-xl text-lg">
                        Dive into interactive simulations and coding challenges. Master complex concepts through hands-on practice.
                    </p>

                    <div className="mt-8 flex gap-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[120px]">
                            <div className="text-3xl font-bold">{stats.completed}</div>
                            <div className="text-sm text-indigo-200">Labs Completed</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[120px]">
                            <div className="text-3xl font-bold">{stats.inProgress}</div>
                            <div className="text-sm text-indigo-200">In Progress</div>
                        </div>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-40 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl"></div>
            </div>

            {/* Subjects Grid */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Explore Subjects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {subjects.map((subject) => (
                        <Link
                            key={subject.name}
                            to={subject.path}
                            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${subject.color}"></div>
                            <div className="flex h-full">
                                <div className="w-1/3 relative">
                                    <img
                                        src={subject.image}
                                        alt={subject.name}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-r ${subject.color} opacity-60 mix-blend-multiply`}></div>
                                </div>
                                <div className="w-2/3 p-6 flex flex-col justify-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {subject.name}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                        {subject.description}
                                    </p>
                                    <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400">
                                        Start Learning <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LabsDashboard;
