import React from 'react';
import { Link } from 'react-router-dom';
import { BeakerIcon, ClockIcon, StarIcon } from '@heroicons/react/24/outline';

const LabCard = ({ lab }) => {
    return (
        <Link
            to={`/labs/view/${lab.id}`}
            className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
            <div className="relative h-48 overflow-hidden">
                <img
                    src={lab.imageUrl || 'https://via.placeholder.com/400x200'}
                    alt={lab.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-purple-600 dark:text-purple-400 shadow-sm">
                    {lab.difficulty}
                </div>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 space-x-2">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                        {lab.subject}
                    </span>
                    <span className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" /> 20m
                    </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {lab.title}
                </h3>

                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                    {lab.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-yellow-500 text-sm">
                        <StarIcon className="w-4 h-4 fill-current" />
                        <span className="ml-1 font-medium">4.8</span>
                    </div>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
                        Start Lab &rarr;
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default LabCard;
