import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import LabCard from '../../components/labs/LabCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import labsService from '../../services/labsService';

const SubjectLabs = () => {
    const { subject } = useParams();
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                setLoading(true);
                const subjectParam = subject === 'all' ? null : subject?.toUpperCase();
                const data = await labsService.getLabsBySubject(subjectParam);
                setLabs(data || []);
            } catch (error) {
                console.error('Failed to fetch labs:', error);
                // Fallback to empty array
                setLabs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLabs();
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
