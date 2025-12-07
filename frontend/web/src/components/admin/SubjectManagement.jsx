import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function SubjectManagement({ institutionId }) {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: '', code: '', description: '', department: '', credits: 3, facultyName: '' });
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        isDanger: false
    });

    useEffect(() => {
        fetchSubjects();
    }, [institutionId]);

    const fetchSubjects = async () => {
        try {
            const res = await axios.get(`/api/academic/subjects/institution/${institutionId}`);
            setSubjects(res.data);
        } catch (err) {
            console.error("Error fetching subjects", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/academic/subjects', { ...newSubject, institutionId });
            setShowModal(false);
            setNewSubject({ name: '', code: '', description: '', department: '', credits: 3, facultyName: '' });
            fetchSubjects();
        } catch (err) {
            console.error("Error creating subject", err);
            alert("Failed to create subject");
        }
    };

    const handleDelete = async (id) => {
        setConfirmationModal({
            isOpen: true,
            title: "Delete Subject",
            message: "Are you sure you want to delete this subject?",
            isDanger: true,
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/academic/subjects/${id}`);
                    fetchSubjects();
                } catch (err) {
                    console.error("Error deleting subject", err);
                    alert("Failed to delete subject");
                }
            }
        });
    };

    if (loading) return <div className="p-4 text-center">Loading subjects...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Subject Management</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Subject
                </button>
            </div>

            <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-slate-200 dark:border-surface-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-surface-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Faculty</th>
                            <th className="px-6 py-4">Credits</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-surface-700">
                        {subjects.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                    No subjects found. Add one to get started.
                                </td>
                            </tr>
                        ) : (
                            subjects.map((subject) => (
                                <tr key={subject.id} className="hover:bg-slate-50 dark:hover:bg-surface-700/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{subject.code}</td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{subject.name}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{subject.department}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{subject.facultyName || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{subject.credits}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(subject.id)}
                                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                            title="Delete"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Add New Subject</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Code</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. CS101"
                                    value={newSubject.code}
                                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. Intro to Computer Science"
                                    value={newSubject.name}
                                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. Computer Science"
                                    value={newSubject.department}
                                    onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Faculty Name</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                                    placeholder="e.g. Dr. Smith"
                                    value={newSubject.facultyName}
                                    onChange={(e) => setNewSubject({ ...newSubject, facultyName: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Credits</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                                        value={newSubject.credits}
                                        onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-surface-600 bg-white dark:bg-surface-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
                                    rows="3"
                                    value={newSubject.description}
                                    onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-surface-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    Create Subject
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
                isDanger={confirmationModal.isDanger}
            />
        </div>
    );
}
