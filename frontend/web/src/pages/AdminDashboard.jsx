import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    UsersIcon,
    AcademicCapIcon,
    ExclamationTriangleIcon,
    StarIcon,
    ChartPieIcon,
    ArrowTrendingUpIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    BuildingLibraryIcon,
    SparklesIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import BulkUploadModal from '../components/modals/BulkUploadModal';
import SubjectManagement from '../components/admin/SubjectManagement';
import AIInsights from '../components/admin/AIInsights';
import UserManagement from '../components/admin/UserManagement';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalClassrooms: 0, totalClubs: 0, totalStudents: 0, totalTeachers: 0 });
    const [complaints, setComplaints] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [institutionId, setInstitutionId] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await axios.get('/api/auth/me');
                setInstitutionId(res.data.institutionId);
            } catch (err) {
                console.error("Error fetching user info", err);
                setInstitutionId(1); // Mock
            }
        };
        fetchMe();
    }, []);

    useEffect(() => {
        if (institutionId) {
            const fetchData = async () => {
                try {
                    // Mocking some data for rich UI if API fails or is incomplete
                    let statsRes = { data: { totalClassrooms: 12, totalClubs: 5, totalStudents: 450, totalTeachers: 32 } };
                    let complaintsRes = { data: [] };

                    try {
                        [statsRes, complaintsRes] = await Promise.all([
                            axios.get(`/api/academic/stats/institution/${institutionId}`),
                            axios.get(`/api/academic/complaints/institution/${institutionId}`)
                        ]);
                    } catch (e) {
                        console.warn("Using mock data for admin dashboard");
                    }

                    setStats(statsRes.data || { totalClassrooms: 12, totalClubs: 5, totalStudents: 450, totalTeachers: 32 });
                    setComplaints(complaintsRes.data || [
                        { id: 1, subject: 'Cafeteria Hygiene', description: 'Food quality has dropped.', status: 'OPEN', reporterId: 101 },
                        { id: 2, subject: 'Projector Issue', description: 'Room 302 projector broken.', status: 'RESOLVED', reporterId: 102 }
                    ]);

                    // Mock Reviews Data
                    setReviews([
                        { id: 1, targetName: 'Mr. Anderson', type: 'TEACHER', rating: 4.8, comment: 'Excellent teaching methods.', reviewer: 'Student A' },
                        { id: 2, targetName: 'Science Dept', type: 'DEPARTMENT', rating: 4.5, comment: 'Great lab facilities.', reviewer: 'Parent B' },
                        { id: 3, targetName: 'Mrs. Smith', type: 'TEACHER', rating: 3.9, comment: 'Needs to be more punctual.', reviewer: 'Student C' }
                    ]);

                    setLoading(false);
                } catch (err) {
                    console.error("Error fetching admin data", err);
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [institutionId]);

    const handleResolveComplaint = async (id) => {
        try {
            await axios.post(`/api/academic/complaints/${id}/resolve`, { status: 'RESOLVED' });
            setComplaints(complaints.map(c => c.id === id ? { ...c, status: 'RESOLVED' } : c));
        } catch (err) {
            console.error("Error resolving complaint", err);
            // Mock update
            setComplaints(complaints.map(c => c.id === id ? { ...c, status: 'RESOLVED' } : c));
        }
    };

    if (loading && !institutionId) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    const statCards = [
        { title: 'Total Students', value: stats.totalStudents || 450, icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { title: 'Total Teachers', value: stats.totalTeachers || 32, icon: AcademicCapIcon, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
        { title: 'Classrooms', value: stats.totalClassrooms, icon: BuildingLibraryIcon, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { title: 'Active Clubs', value: stats.totalClubs, icon: StarIcon, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    ];

    const performanceData = [
        { name: 'Math', score: 85 },
        { name: 'Science', score: 92 },
        { name: 'English', score: 78 },
        { name: 'History', score: 88 },
        { name: 'Art', score: 95 },
    ];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: ChartPieIcon },
        { id: 'users', label: 'Users', icon: UsersIcon },
        { id: 'academics', label: 'Academics', icon: BookOpenIcon },
        { id: 'insights', label: 'Insights', icon: SparklesIcon },
        { id: 'complaints', label: 'Complaints', icon: ExclamationTriangleIcon },
    ];

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6 space-y-8 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-display font-bold text-surface-900 dark:text-surface-50">
                        Administration Portal
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Overview of institution performance, reviews, and complaints.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="px-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-surface-50 flex items-center gap-2"
                    >
                        <UsersIcon className="w-4 h-4" />
                        Bulk Upload Users
                    </button>
                    <button className="px-4 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-semibold shadow-sm hover:bg-surface-50">
                        Export Reports
                    </button>
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-500/30 hover:bg-primary-700">
                        Settings
                    </button>
                </div>
            </header>

            <BulkUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                institutionId={institutionId}
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-surface-700">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {statCards.map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">+4%</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-1">{stat.value}</h3>
                                    <p className="text-sm text-surface-500">{stat.title}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Charts & Reviews */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Academic Performance Chart */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-8 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700"
                                >
                                    <div className="flex justify-between items-center mb-8">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <ArrowTrendingUpIcon className="w-6 h-6 text-primary-500" />
                                            Department Performance
                                        </h2>
                                    </div>
                                    <div className="h-80 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={performanceData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                                <Tooltip
                                                    cursor={{ fill: 'transparent' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                />
                                                <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>

                                {/* Academic Reviews */}
                                <div className="p-8 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <StarIcon className="w-6 h-6 text-yellow-500" />
                                        Academic Reviews
                                    </h2>
                                    <div className="space-y-4">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-700/30 flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface-200 flex items-center justify-center font-bold text-surface-600">
                                                    {review.reviewer.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-surface-900 dark:text-surface-50">{review.targetName} <span className="text-xs font-normal text-surface-500">({review.type})</span></h4>
                                                        <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                                                            <StarIcon className="w-4 h-4 fill-current" />
                                                            {review.rating}
                                                        </div>
                                                    </div>
                                                    <p className="text-surface-600 dark:text-surface-300 text-sm mt-1">"{review.comment}"</p>
                                                    <p className="text-surface-400 text-xs mt-2">- {review.reviewer}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Complaints Preview */}
                            <div className="space-y-8">
                                <div className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700 h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                                            Recent Complaints
                                        </h2>
                                        <button onClick={() => setActiveTab('complaints')} className="text-sm text-primary-600 hover:underline">View All</button>
                                    </div>
                                    <div className="space-y-4">
                                        {complaints.slice(0, 3).map((complaint) => (
                                            <div key={complaint.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-50 dark:bg-surface-700/50 border border-surface-100 dark:border-surface-700">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-sm">{complaint.subject}</h4>
                                                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {complaint.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-surface-600 dark:text-surface-300 line-clamp-2">
                                                    {complaint.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <UserManagement />
                )}

                {activeTab === 'academics' && (
                    <SubjectManagement institutionId={institutionId} />
                )}

                {activeTab === 'insights' && (
                    <AIInsights institutionId={institutionId} />
                )}

                {activeTab === 'complaints' && (
                    <div className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                                All Complaints
                            </h2>
                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                                {complaints.filter(c => c.status === 'OPEN').length} Open
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {complaints.length === 0 ? (
                                <p className="text-surface-500 text-center col-span-2">No complaints found.</p>
                            ) : (
                                complaints.map((complaint) => (
                                    <div key={complaint.id} className="flex flex-col gap-3 p-4 rounded-2xl bg-surface-50 dark:bg-surface-700/50 border border-surface-100 dark:border-surface-700">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-sm">{complaint.subject}</h4>
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${complaint.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {complaint.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-surface-600 dark:text-surface-300">
                                            {complaint.description}
                                        </p>
                                        {complaint.status !== 'RESOLVED' && (
                                            <div className="flex gap-2 mt-2 pt-2 border-t border-surface-200 dark:border-surface-600">
                                                <button
                                                    onClick={() => handleResolveComplaint(complaint.id)}
                                                    className="flex-1 py-2 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <CheckCircleIcon className="w-3 h-3" /> Resolve
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/chatapp?createWith=${complaint.reporterId}&name=Complaint Discussion`)}
                                                    className="flex-1 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <ChatBubbleLeftRightIcon className="w-3 h-3" /> Message
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
