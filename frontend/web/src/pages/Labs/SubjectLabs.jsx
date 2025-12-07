import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LabCard from '../../components/labs/LabCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const SubjectLabs = () => {
    const { subject } = useParams();
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Mock fetch - replace with API call
        // fetch(`/api/labs?subject=${subject}`)
        const mockLabs = [
            {
                id: 1,
                title: 'Solar System Simulation',
                description: 'Explore the solar system and understand planetary orbits.',
                subject: 'Astronomy',
                difficulty: 'Easy',
                imageUrl: 'https://images.unsplash.com/photo-1614730341194-75c6074065db?auto=format&fit=crop&w=500&q=60'
            },
            {
                id: 2,
                title: 'Acid-Base Titration',
                description: 'Simulate a titration experiment to determine concentration.',
                subject: 'Chemistry',
                difficulty: 'Medium',
                imageUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=500&q=60'
            },
            {
                id: 3,
                title: 'Intro to Python: Variables',
                description: 'Learn how to declare and use variables in Python.',
                subject: 'Python',
                difficulty: 'Easy',
                imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=500&q=60'
            }
        ];

        // Filter mock labs based on subject param (very rough mock)
        const filtered = subject === 'all' ? mockLabs : mockLabs.filter(l =>
            subject === 'cs' ? l.subject === 'Python' :
                subject === 'physics' ? l.subject === 'Astronomy' :
                    subject === 'chemistry' ? l.subject === 'Chemistry' : true
        );

        setLabs(filtered);
        setLoading(false);
    }, [subject]);

    const displayLabs = labs.filter(lab =>
        lab.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const subjectTitle = subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : 'All Labs';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{subjectTitle} Labs</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Browse our collection of interactive {subjectTitle} experiments.
                    </p>
                </div>

                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search labs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full md:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayLabs.map(lab => (
                        <LabCard key={lab.id} lab={lab} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubjectLabs;
