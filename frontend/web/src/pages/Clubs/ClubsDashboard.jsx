import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';

const ClubsDashboard = () => {
    const [clubs, setClubs] = useState([]);

    useEffect(() => {
        // Mock data
        setClubs([
            { id: 1, name: 'Robotics Club', description: 'Building the future, one bot at a time.', members: 24, image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=500&q=60' },
            { id: 2, name: 'Debate Society', description: 'Discussing global issues and sharpening rhetoric.', members: 15, image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=500&q=60' },
            { id: 3, name: 'Chess Club', description: 'Strategy, tactics, and checkmates.', members: 30, image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=500&q=60' },
        ]);
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Clubs</h1>
                <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Club
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map((club) => (
                    <Link
                        key={club.id}
                        to={`/clubs/${club.id}`}
                        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all"
                    >
                        <div className="h-40 overflow-hidden relative">
                            <img
                                src={club.image}
                                alt={club.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <h2 className="absolute bottom-4 left-4 text-xl font-bold text-white">{club.name}</h2>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                                {club.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                    <UserGroupIcon className="w-4 h-4 mr-1" />
                                    {club.members} Members
                                </span>
                                <span className="text-purple-600 dark:text-purple-400 font-medium group-hover:translate-x-1 transition-transform">
                                    Enter Club &rarr;
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ClubsDashboard;
