import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BeakerIcon, BookOpenIcon, CalculatorIcon, CpuChipIcon, GlobeAmericasIcon } from '@heroicons/react/24/outline';

const LabsLayout = () => {
    const location = useLocation();

    const navItems = [
        { name: 'All Labs', path: '/labs', icon: BeakerIcon },
        { name: 'Physics', path: '/labs/physics', icon: GlobeAmericasIcon },
        { name: 'Chemistry', path: '/labs/chemistry', icon: BeakerIcon },
        { name: 'Biology', path: '/labs/biology', icon: BookOpenIcon }, // Using BookOpen as generic for now
        { name: 'Maths', path: '/labs/math', icon: CalculatorIcon },
        { name: 'Computer Science', path: '/labs/cs', icon: CpuChipIcon },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                        Muse Labs
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Interactive Learning</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default LabsLayout;
