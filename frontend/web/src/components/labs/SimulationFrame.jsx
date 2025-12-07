import React from 'react';

const SimulationFrame = ({ type }) => {
    // In a real app, this would load specific React components or iframes based on 'type'
    // For now, we'll mock a "Solar System" and "Titration" view

    if (type === 'SolarSystem') {
        return (
            <div className="h-full w-full bg-black rounded-xl relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80')] bg-cover opacity-50"></div>
                <div className="relative z-10 text-center">
                    <div className="w-24 h-24 bg-yellow-500 rounded-full blur-lg mx-auto mb-8 animate-pulse"></div>
                    <div className="flex gap-8 items-center justify-center">
                        <div className="w-8 h-8 bg-gray-400 rounded-full animate-spin-slow"></div>
                        <div className="w-12 h-12 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                        <div className="w-10 h-10 bg-red-500 rounded-full"></div>
                    </div>
                    <p className="text-white mt-8 font-mono">Interactive Solar System Simulation Loaded</p>
                </div>
            </div>
        );
    }

    if (type === 'Titration') {
        return (
            <div className="h-full w-full bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <div className="w-32 h-64 border-2 border-gray-400 border-t-0 mx-auto relative bg-blue-50/50 rounded-b-lg">
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-pink-500/30 transition-all duration-1000"></div>
                    </div>
                    <div className="mt-4 space-x-4">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Base</button>
                        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Add Acid</button>
                    </div>
                    <p className="text-gray-500 mt-4">pH Level: 7.0</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-500">
            Simulation Placeholder for {type}
        </div>
    );
};

export default SimulationFrame;
