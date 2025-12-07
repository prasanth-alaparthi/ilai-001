import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserGroupIcon,
    AcademicCapIcon,
    ChatBubbleLeftRightIcon,
    PhoneIcon,
    VideoCameraIcon,
    ClipboardDocumentCheckIcon,
    BellIcon,
    ChartBarIcon,
    BookOpenIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    SparklesIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(null);
    const [academicData, setAcademicData] = useState({
        classrooms: [],
        assignments: [],
        reportCards: [],
        attendance: [],
        clubs: []
    });
    const [loading, setLoading] = useState(true);
    const [showParentNetworkModal, setShowParentNetworkModal] = useState(false);

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const response = await axios.get('/api/parents/children');
                setChildren(response.data);
                if (response.data.length > 0) {
                    setSelectedChild(response.data[0]);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching children:", error);
                // Fallback mock data for demo if API fails
                setChildren([
                    { id: 1, username: 'Alex', gradeLevel: '10' },
                    { id: 2, username: 'Sarah', gradeLevel: '8' }
                ]);
                setSelectedChild({ id: 1, username: 'Alex', gradeLevel: '10' });
                setLoading(false);
            }
        };
        fetchChildren();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            const fetchAcademicData = async () => {
                try {
                    // Try fetching real data, fallback to mocks if endpoints don't exist yet
                    let classroomsRes = { data: [] };
                    let reportCardRes = { data: [] };
                    let attendanceRes = { data: [] };

                    try {
                        [classroomsRes, reportCardRes, attendanceRes] = await Promise.all([
                            axios.get(`/api/academic/classrooms/student/${selectedChild.id}`),
                            axios.get(`/api/academic/students/${selectedChild.id}/report-card`),
                            axios.get(`/api/academic/students/${selectedChild.id}/attendance`)
                        ]);
                    } catch (e) {
                        console.warn("Some APIs failed, using mock data for demonstration");
                    }

                    // Mock data augmentation for rich UI
                    const mockAssignments = [
                        { id: 1, title: 'Math Problem Set 4', subject: 'Mathematics', status: 'PENDING', dueDate: '2024-05-20' },
                        { id: 2, title: 'History Essay', subject: 'History', status: 'COMPLETED', dueDate: '2024-05-18' },
                        { id: 3, title: 'Science Lab Report', subject: 'Science', status: 'PENDING', dueDate: '2024-05-22' }
                    ];

                    const mockClubs = [
                        { id: 1, name: 'Robotics Club', role: 'Member', meetingTime: 'Wed 4 PM' },
                        { id: 2, name: 'Debate Team', role: 'Team Leader', meetingTime: 'Fri 3 PM' }
                    ];

                    setAcademicData({
                        classrooms: classroomsRes.data.length ? classroomsRes.data : [
                            { id: 1, name: 'Mathematics 101', subject: 'Math', teacherId: 101 },
                            { id: 2, name: 'Science 202', subject: 'Physics', teacherId: 102 }
                        ],
                        reportCards: reportCardRes.data.length ? reportCardRes.data : [
                            { exam: { subject: 'Math' }, marksObtained: 85 },
                            { exam: { subject: 'Science' }, marksObtained: 92 },
                            { exam: { subject: 'English' }, marksObtained: 78 },
                            { exam: { subject: 'History' }, marksObtained: 88 }
                        ],
                        attendance: attendanceRes.data.length ? attendanceRes.data : { present: 45, absent: 2, total: 47 },
                        assignments: mockAssignments,
                        clubs: mockClubs
                    });
                } catch (error) {
                    console.error("Error fetching academic data:", error);
                }
            };
            fetchAcademicData();
        }
    }, [selectedChild]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-900 text-primary-500">Loading...</div>;
    }

    if (children.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-900">
                <div className="text-center p-8 bg-white dark:bg-surface-800 rounded-3xl shadow-xl">
                    <h2 className="text-2xl font-bold mb-2">No Children Linked</h2>
                    <p className="text-surface-500">Please contact your institution administrator to link your children.</p>
                </div>
            </div>
        );
    }

    const attendanceData = [
        { name: 'Present', value: academicData.attendance.present || 95, color: '#10B981' },
        { name: 'Absent', value: academicData.attendance.absent || 5, color: '#EF4444' }
    ];

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6 space-y-8 font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
                        Parent Portal
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Comprehensive academic oversight for your family.
                    </p>
                </div>
                <div className="flex gap-4 items-center">
                    <button className="p-3 rounded-full bg-white dark:bg-surface-800 shadow-sm hover:shadow-md transition-all relative">
                        <BellIcon className="w-6 h-6 text-surface-600 dark:text-surface-300" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </button>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500" />
                        <span className="font-semibold text-sm">Parent Account</span>
                    </div>
                </div>
            </header>

            {/* Children Selector */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {children.map((child) => (
                    <motion.button
                        key={child.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedChild(child)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all min-w-[240px] ${selectedChild?.id === child.id
                            ? 'bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-lg shadow-primary-500/30 border-transparent'
                            : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary-300 text-surface-700 dark:text-surface-200'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${selectedChild?.id === child.id ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-600'
                            }`}>
                            {child.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-lg">{child.username}</h3>
                            <p className={`text-sm ${selectedChild?.id === child.id ? 'text-white/80' : 'text-surface-500'}`}>
                                Grade {child.gradeLevel || 'N/A'}
                            </p>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column: Academic Overview (8 cols) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Attendance Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700 flex items-center justify-between relative overflow-hidden"
                        >
                            <div className="z-10">
                                <p className="text-surface-500 text-sm font-medium">Attendance</p>
                                <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mt-1">96%</h3>
                                <p className="text-green-500 text-xs font-semibold mt-2 flex items-center gap-1">
                                    <CheckCircleIcon className="w-3 h-3" /> Excellent
                                </p>
                            </div>
                            <div className="h-20 w-20">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={attendanceData}
                                            innerRadius={25}
                                            outerRadius={35}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {attendanceData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Assignments Pending */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                    <ClockIcon className="w-5 h-5" />
                                </div>
                                <p className="text-surface-500 text-sm font-medium">Pending Tasks</p>
                            </div>
                            <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
                                {academicData.assignments.filter(a => a.status === 'PENDING').length}
                            </h3>
                            <p className="text-surface-400 text-xs mt-2">Assignments due soon</p>
                        </motion.div>

                        {/* Clubs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                                <p className="text-surface-500 text-sm font-medium">Active Clubs</p>
                            </div>
                            <h3 className="text-3xl font-bold text-surface-900 dark:text-surface-50">
                                {academicData.clubs.length}
                            </h3>
                            <p className="text-surface-400 text-xs mt-2">Extracurriculars</p>
                        </motion.div>
                    </div>

                    {/* Performance Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ChartBarIcon className="w-6 h-6 text-primary-500" />
                                Academic Performance
                            </h2>
                        </div>
                        <div className="h-72 w-full">
                            {academicData.reportCards.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={academicData.reportCards.map(rc => ({ name: rc.exam.subject, score: rc.marksObtained }))}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            cursor={{ stroke: '#6366f1', strokeWidth: 2 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="score"
                                            stroke="#6366f1"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                                            activeDot={{ r: 8 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-surface-500">
                                    No exam data available yet.
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Assignments & Homework List */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <ClipboardDocumentCheckIcon className="w-6 h-6 text-orange-500" />
                            Assignments & Homework
                        </h2>
                        <div className="space-y-4">
                            {academicData.assignments.map((assignment) => (
                                <div key={assignment.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${assignment.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                            {assignment.status === 'COMPLETED' ? <CheckCircleIcon className="w-6 h-6" /> : <ClockIcon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-surface-900 dark:text-surface-50">{assignment.title}</h4>
                                            <p className="text-sm text-surface-500">{assignment.subject} • Due {assignment.dueDate}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${assignment.status === 'COMPLETED'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                        }`}>
                                        {assignment.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Classes, Clubs & Actions (4 cols) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate(`/video-call?room=PTM-${selectedChild?.username || 'Meeting'}`)}
                            className="w-full p-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all flex items-center justify-between group transform hover:-translate-y-1"
                        >
                            <span className="font-bold flex items-center gap-3 text-lg">
                                <VideoCameraIcon className="w-7 h-7" />
                                Online PTM
                            </span>
                            <span className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
                                Join
                            </span>
                        </button>

                        {(!selectedChild?.gradeLevel || parseInt(selectedChild.gradeLevel) <= 10) && (
                            <button
                                onClick={() => setShowParentNetworkModal(true)}
                                className="w-full p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-green-500 hover:shadow-md transition-all flex items-center justify-between group"
                            >
                                <span className="font-semibold flex items-center gap-3 text-surface-700 dark:text-surface-200">
                                    <UserGroupIcon className="w-6 h-6 text-green-500" />
                                    Parent Network
                                </span>
                                <span className="text-surface-400 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        )}
                    </div>

                    {/* Classes List */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <BookOpenIcon className="w-6 h-6 text-blue-500" />
                            Classes & Teachers
                        </h2>
                        <div className="space-y-4">
                            {academicData.classrooms.map((classroom) => (
                                <div key={classroom.id} className="p-4 rounded-2xl bg-surface-50 dark:bg-surface-700/30 border border-surface-100 dark:border-surface-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold">{classroom.name}</h3>
                                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                                            {classroom.subject}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/chatapp?createWith=${classroom.teacherId}&contextType=CLASSROOM&contextId=${classroom.id}&name=${encodeURIComponent('Chat - ' + classroom.name)}`)}
                                        className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-white dark:bg-surface-600 text-surface-700 dark:text-surface-200 text-sm font-medium hover:bg-surface-100 dark:hover:bg-surface-500 transition-colors border border-surface-200 dark:border-surface-500"
                                    >
                                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                        Message Teacher
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Clubs & Activities */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <TrophyIcon className="w-6 h-6 text-yellow-500" />
                            Clubs & Activities
                        </h2>
                        <div className="space-y-3">
                            {academicData.clubs.map((club) => (
                                <div key={club.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/30">
                                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600">
                                        <StarIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{club.name}</h4>
                                        <p className="text-xs text-surface-500">{club.role} • {club.meetingTime}</p>
                                    </div>
                                </div>
                            ))}
                            {academicData.clubs.length === 0 && (
                                <p className="text-sm text-surface-500 italic">No active clubs.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Parent Network Modal */}
            <AnimatePresence>
                {showParentNetworkModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowParentNetworkModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-surface-800 p-8 rounded-3xl w-full max-w-lg shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <UserGroupIcon className="w-8 h-8 text-green-500" />
                                    Parent Network
                                </h2>
                                <button onClick={() => setShowParentNetworkModal(false)} className="p-2 hover:bg-surface-100 rounded-full">
                                    <XCircleIcon className="w-6 h-6 text-surface-500" />
                                </button>
                            </div>

                            <p className="text-surface-600 dark:text-surface-300 mb-6">
                                Connect with other parents from <strong>Grade {selectedChild?.gradeLevel}</strong>.
                                Share updates, discuss events, and build a community.
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => navigate(`/chatapp?group=Grade${selectedChild?.gradeLevel}Parents`)}
                                    className="w-full p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-4 hover:bg-green-100 transition-colors"
                                >
                                    <div className="p-3 bg-green-500 text-white rounded-full">
                                        <ChatBubbleLeftRightIcon className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-green-900 dark:text-green-100">Grade {selectedChild?.gradeLevel} Group Chat</h3>
                                        <p className="text-sm text-green-700 dark:text-green-300">Join the general discussion</p>
                                    </div>
                                </button>

                                <div className="text-center text-sm text-surface-400 mt-4">
                                    <p>Only available for parents of students in Grade 10 and below.</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper Icon
const StarIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
);

export default ParentDashboard;
