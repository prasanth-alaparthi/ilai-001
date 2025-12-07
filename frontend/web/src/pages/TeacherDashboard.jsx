import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserGroupIcon,
    PresentationChartLineIcon,
    ClipboardDocumentListIcon,
    PlusIcon,
    ComputerDesktopIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    SparklesIcon,
    BookOpenIcon,
    UsersIcon,
    VideoCameraIcon,
    PencilSquareIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import assignmentService from '../services/assignmentService';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [projectorMode, setProjectorMode] = useState(false);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateClassModal, setShowCreateClassModal] = useState(false);
    const [showCreateClubModal, setShowCreateClubModal] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        isDanger: false,
        showCancel: true,
        confirmText: "Confirm"
    });

    const showAlert = (title, message) => {
        setConfirmationModal({
            isOpen: true,
            title,
            message,
            onConfirm: () => { },
            isDanger: false,
            showCancel: false,
            confirmText: "OK"
        });
    };

    // Mock data for clubs/groups until API is ready
    const [clubs, setClubs] = useState([
        { id: 1, name: 'Science Club', members: 12 },
        { id: 2, name: 'Math Olympiad Group', members: 5 }
    ]);

    useEffect(() => {
        const socket = new SockJS("/ws-academic");
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                console.log("Connected to Smart Class WebSocket");
            },
            onStompError: (frame) => {
                console.error("Broker reported error: " + frame.headers["message"]);
                console.error("Additional details: " + frame.body);
            },
        });
        client.activate();
        setStompClient(client);

        return () => {
            client.deactivate();
        };
    }, []);

    const handleToggleProjector = () => {
        if (!selectedClassId) {
            showAlert("Action Required", "Please select a class first to launch Smart Class.");
            return;
        }
        const newState = !projectorMode;
        setProjectorMode(newState);

        if (stompClient && stompClient.connected) {
            stompClient.publish({
                destination: `/app/smart-class/${selectedClassId}/toggle`,
                body: JSON.stringify({ active: newState, message: newState ? "Projector On" : "Projector Off" })
            });
        }
    };
    const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [teacherId, setTeacherId] = useState(null);
    const [institutionId, setInstitutionId] = useState(null);

    // Form States
    const [assignments, setAssignments] = useState([]);
    const [newClass, setNewClass] = useState({ name: '', subject: '' });
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        type: 'INDIVIDUAL',
        criteria: '',
        dueDate: '',
        maxScore: 100
    });
    const [newClub, setNewClub] = useState({ name: '', description: '' });

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await axios.get('/api/auth/me');
                setTeacherId(res.data.id);
                setInstitutionId(res.data.institutionId);
            } catch (err) {
                console.error("Error fetching user info", err);
                // Fallback for dev
                setTeacherId(101);
                setInstitutionId(1);
            }
        };
        fetchMe();
    }, []);

    useEffect(() => {
        if (teacherId) {
            const fetchClasses = async () => {
                try {
                    const res = await axios.get(`/api/academic/classrooms/teacher/${teacherId}`);
                    setClasses(res.data);
                    setLoading(false);
                } catch (err) {
                    console.error("Error fetching classes", err);
                    // Mock data
                    setClasses([
                        { id: 1, name: 'Math 101', subject: 'Mathematics', studentCount: 25 },
                        { id: 2, name: 'Physics 202', subject: 'Physics', studentCount: 18 }
                    ]);
                    setLoading(false);
                }
            };
            fetchClasses();
        }
    }, [teacherId]);

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/academic/classrooms', {
                ...newClass,
                teacherId,
                institutionId
            });
            setClasses([...classes, res.data]);
            setShowCreateClassModal(false);
            setNewClass({ name: '', subject: '' });
        } catch (err) {
            console.error("Error creating class", err);
            // Mock success
            setClasses([...classes, { id: Date.now(), ...newClass, studentCount: 0 }]);
            setShowCreateClassModal(false);
        }
    };

    // Fetch assignments when a class is selected
    useEffect(() => {
        if (selectedClassId) {
            const fetchAssignments = async () => {
                try {
                    const data = await assignmentService.getAssignmentsByCourse(selectedClassId);
                    setAssignments(data);
                } catch (err) {
                    console.error("Error fetching assignments", err);
                    setAssignments([]);
                }
            };
            fetchAssignments();
        } else {
            setAssignments([]);
        }
    }, [selectedClassId]);

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!selectedClassId) {
            showAlert("Action Required", "Please select a class first.");
            return;
        }
        try {
            const payload = {
                ...newAssignment,
                courseId: selectedClassId,
                teacherId: teacherId
            };
            const createdAssignment = await assignmentService.createAssignment(payload);
            setAssignments([...assignments, createdAssignment]);
            setShowCreateAssignmentModal(false);
            setNewAssignment({
                title: '',
                description: '',
                type: 'INDIVIDUAL',
                criteria: '',
                dueDate: '',
                maxScore: 100
            });
            showAlert("Success", "Assignment created successfully!");
        } catch (err) {
            console.error("Error creating assignment", err);
            showAlert("Error", "Failed to create assignment.");
        }
    };

    const handleCreateClub = (e) => {
        e.preventDefault();
        setClubs([...clubs, { id: Date.now(), ...newClub, members: 0 }]);
        setShowCreateClubModal(false);
        setNewClub({ name: '', description: '' });
    };

    if (loading && !teacherId) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6 space-y-8 relative font-sans">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        Teacher Workspace
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Manage your classes, assignments, and smart classroom.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleToggleProjector}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${projectorMode
                            ? 'bg-red-500 text-white shadow-red-500/30 animate-pulse'
                            : 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700'
                            }`}
                    >
                        <ComputerDesktopIcon className="w-5 h-5" />
                        {projectorMode ? 'Exit Smart Class' : 'Launch Smart Class'}
                    </button>
                </div>
            </header>

            {/* Projector Mode Overlay */}
            <AnimatePresence>
                {projectorMode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-black text-white p-8 rounded-3xl shadow-2xl border border-surface-800 mb-8 aspect-video flex flex-col relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40" />

                        {/* Smart Class UI */}
                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-3xl font-bold tracking-tight">Smart Class Active</h2>
                                    <p className="text-indigo-200">Connected to Classroom 101 Projector</p>
                                </div>
                                <div className="px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm font-bold border border-red-500/30 animate-pulse">
                                    ● LIVE
                                </div>
                            </div>

                            <div className="flex-1 flex items-center justify-center gap-8">
                                <button className="group relative w-48 h-48 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all flex flex-col items-center justify-center gap-4">
                                    <div className="p-4 rounded-full bg-indigo-500/20 text-indigo-300 group-hover:scale-110 transition-transform">
                                        <PencilSquareIcon className="w-10 h-10" />
                                    </div>
                                    <span className="font-semibold text-lg">Whiteboard</span>
                                </button>
                                <button className="group relative w-48 h-48 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all flex flex-col items-center justify-center gap-4">
                                    <div className="p-4 rounded-full bg-purple-500/20 text-purple-300 group-hover:scale-110 transition-transform">
                                        <PresentationChartLineIcon className="w-10 h-10" />
                                    </div>
                                    <span className="font-semibold text-lg">Slides</span>
                                </button>
                                <button className="group relative w-48 h-48 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all flex flex-col items-center justify-center gap-4">
                                    <div className="p-4 rounded-full bg-green-500/20 text-green-300 group-hover:scale-110 transition-transform">
                                        <VideoCameraIcon className="w-10 h-10" />
                                    </div>
                                    <span className="font-semibold text-lg">Video Feed</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Classes & Clubs */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Classes Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <BookOpenIcon className="w-6 h-6 text-indigo-500" />
                                My Classes
                            </h2>
                            <button
                                onClick={() => setShowCreateClassModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors text-sm font-bold"
                            >
                                <PlusIcon className="w-4 h-4" /> New Class
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {classes.length === 0 ? (
                                <p className="text-surface-500 col-span-2 text-center py-8">No classes found. Create one to get started.</p>
                            ) : (
                                classes.map((cls) => (
                                    <motion.div
                                        key={cls.id}
                                        whileHover={{ y: -4 }}
                                        onClick={() => setSelectedClassId(cls.id)}
                                        className={`p-6 rounded-2xl shadow-sm border group cursor-pointer transition-all ${selectedClassId === cls.id
                                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-indigo-500/30'
                                            : 'bg-white dark:bg-surface-800 border-surface-100 dark:border-surface-700 hover:border-indigo-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl ${selectedClassId === cls.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                                <UserGroupIcon className="w-6 h-6" />
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${selectedClassId === cls.id ? 'bg-white/20 text-white' : 'bg-surface-100 text-surface-600'}`}>
                                                {cls.subject}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold mb-1">{cls.name}</h3>
                                        <p className={`text-sm ${selectedClassId === cls.id ? 'text-indigo-100' : 'text-surface-500'}`}>
                                            {cls.studentCount || 0} Students Enrolled
                                        </p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Clubs & Groups Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <SparklesIcon className="w-6 h-6 text-purple-500" />
                                Clubs & Study Groups
                            </h2>
                            <button
                                onClick={() => setShowCreateClubModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors text-sm font-bold"
                            >
                                <PlusIcon className="w-4 h-4" /> New Club
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clubs.map((club) => (
                                <div key={club.id} className="p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-100 dark:border-surface-700 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                            <UsersIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-surface-900 dark:text-surface-50">{club.name}</h3>
                                            <p className="text-sm text-surface-500">{club.members} Members</p>
                                        </div>
                                    </div>
                                    <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-surface-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Assignments & Actions */}
                <div className="space-y-8">
                    {/* Assignments */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <ClipboardDocumentListIcon className="w-6 h-6 text-orange-500" />
                                Assignments
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {assignments.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-3 text-surface-400">
                                        <BookOpenIcon className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm text-surface-500">No assignments found.</p>
                                </div>
                            ) : (
                                assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        onClick={() => navigate(`/grading/${assignment.id}`)}
                                        className="p-4 rounded-xl bg-surface-50 dark:bg-surface-700/50 border border-surface-100 dark:border-surface-700 cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                                    >
                                        <h4 className="font-bold text-sm mb-1">{assignment.title}</h4>
                                        <p className="text-xs text-surface-500 mb-2">
                                            Due: {new Date(assignment.dueDate).toLocaleDateString()} • Max Score: {assignment.maxScore}
                                        </p>
                                        <div className="w-full bg-surface-200 rounded-full h-1.5">
                                            {/* Mock progress for now */}
                                            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                                        </div>
                                        <p className="text-xs text-right mt-1 text-surface-400">0 Submitted</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (selectedClassId) setShowCreateAssignmentModal(true);
                                else showAlert("Action Required", "Select a class first!");
                            }}
                            className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 text-surface-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Create Assignment
                        </button>
                    </div>

                    {/* Quick Comms */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-500/20">
                        <h3 className="font-bold text-lg mb-2">Communication Hub</h3>
                        <p className="text-indigo-100 text-sm mb-6">Quickly reach out to administration or student parents.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/chatapp')}
                                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all flex flex-col items-center gap-2 text-xs font-bold"
                            >
                                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                                Message Admin
                            </button>
                            <button
                                onClick={() => navigate('/video-call?room=ParentMeeting')}
                                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all flex flex-col items-center gap-2 text-xs font-bold"
                            >
                                <UserGroupIcon className="w-6 h-6" />
                                Parent Meeting
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Class Modal */}
            <AnimatePresence>
                {showCreateClassModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-surface-800 p-6 rounded-3xl w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Create New Class</h3>
                                <button onClick={() => setShowCreateClassModal(false)}><XMarkIcon className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleCreateClass} className="space-y-4">
                                <input
                                    type="text" placeholder="Class Name (e.g. Math 101)"
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                                    value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="text" placeholder="Subject"
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                                    value={newClass.subject} onChange={e => setNewClass({ ...newClass, subject: e.target.value })}
                                    required
                                />
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/30">
                                    Create Class
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Assignment Modal */}
            <AnimatePresence>
                {showCreateAssignmentModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-surface-800 p-6 rounded-3xl w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Create Assignment</h3>
                                <button onClick={() => setShowCreateAssignmentModal(false)}><XMarkIcon className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleCreateAssignment} className="space-y-4">
                                <input
                                    type="text" placeholder="Title"
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                                    value={newAssignment.title} onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    required
                                />
                                <select
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                                    value={newAssignment.type} onChange={e => setNewAssignment({ ...newAssignment, type: e.target.value })}
                                >
                                    <option value="INDIVIDUAL">Individual Assignment</option>
                                    <option value="GROUP_PROJECT">Group Project</option>
                                </select>
                                <textarea
                                    placeholder="Description"
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 h-32"
                                    value={newAssignment.description} onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="date"
                                        className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                                        value={newAssignment.dueDate} onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="number" placeholder="Max Score"
                                        className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                                        value={newAssignment.maxScore} onChange={e => setNewAssignment({ ...newAssignment, maxScore: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                                <textarea
                                    placeholder="Grading Criteria / Rubric (Essential for AI Grading)"
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 h-32"
                                    value={newAssignment.criteria} onChange={e => setNewAssignment({ ...newAssignment, criteria: e.target.value })}
                                    required
                                />
                                <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/30">
                                    Create Assignment
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Club Modal */}
            <AnimatePresence>
                {showCreateClubModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-surface-800 p-6 rounded-3xl w-full max-w-md shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold">Create Club / Group</h3>
                                <button onClick={() => setShowCreateClubModal(false)}><XMarkIcon className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleCreateClub} className="space-y-4">
                                <input
                                    type="text" placeholder="Club Name (e.g. Science Club)"
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
                                    value={newClub.name} onChange={e => setNewClub({ ...newClub, name: e.target.value })}
                                    required
                                />
                                <textarea
                                    placeholder="Description & Goals"
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 h-32"
                                    value={newClub.description} onChange={e => setNewClub({ ...newClub, description: e.target.value })}
                                    required
                                />
                                <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/30">
                                    Create Club
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
                isDanger={confirmationModal.isDanger}
                showCancel={confirmationModal.showCancel}
                confirmText={confirmationModal.confirmText}
            />
        </div>
    );
};

export default TeacherDashboard;
