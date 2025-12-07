import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { SparklesIcon, AcademicCapIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline';

export default function AIInsights({ institutionId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`/api/academic/stats/advanced/institution/${institutionId}`);
                setStats(res.data);
            } catch (err) {
                console.error("Error fetching advanced stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [institutionId]);

    if (loading) return <div className="p-8 text-center animate-pulse">Analyzing institutional data...</div>;
    if (!stats) return <div className="p-8 text-center text-slate-500">No insights available.</div>;

    const retentionData = [
        {
            name: 'Retention Rate',
            uv: stats.retentionRate,
            fill: '#8884d8',
        },
        {
            name: 'Target',
            uv: 100,
            fill: '#f3f4f6',
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="w-6 h-6 text-primary-600" />
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">AI Institutional Insights</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Retention Card */}
                <div className="bg-white dark:bg-surface-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-surface-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <UserGroupIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Retention Rate</h3>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.retentionRate}%</div>
                    <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>↑ 2.1%</span> from last semester
                    </div>
                    <div className="h-24 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={10} data={retentionData} startAngle={90} endAngle={-270}>
                                <RadialBar minAngle={15} background clockWise dataKey="uv" cornerRadius={10} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GPA Card */}
                <div className="bg-white dark:bg-surface-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-surface-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AcademicCapIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Avg. GPA</h3>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.averageGPA}</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Across all departments
                    </div>
                    <div className="mt-4 w-full bg-slate-100 dark:bg-surface-700 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${(stats.averageGPA / 4.0) * 100}%` }}></div>
                    </div>
                </div>

                {/* Satisfaction Card */}
                <div className="bg-white dark:bg-surface-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-surface-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <StarIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Student Satisfaction</h3>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.studentSatisfaction}/5</div>
                    <div className="text-xs text-green-600 mt-1">
                        Excellent
                    </div>
                    <div className="flex gap-1 mt-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon key={star} className={`w-5 h-5 ${star <= Math.round(stats.studentSatisfaction) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                        ))}
                    </div>
                </div>

                {/* Faculty Performance Card */}
                <div className="bg-white dark:bg-surface-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-surface-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AcademicCapIcon className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Faculty Performance</h3>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats.facultyPerformance}/5</div>
                    <div className="text-xs text-slate-500 mt-1">
                        Based on student reviews
                    </div>
                    <div className="mt-4 w-full bg-slate-100 dark:bg-surface-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(stats.facultyPerformance / 5.0) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* AI Prediction Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <SparklesIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-1">AI Predictive Analysis</h3>
                        <p className="text-white/90 text-sm mb-4">
                            Based on current trends, the institution is on track to improve overall student retention by <strong>3.5%</strong> in the next academic year.
                            Recommended action: Increase support for "Computer Science" department freshmen.
                        </p>
                        <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors">
                            View Detailed Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
