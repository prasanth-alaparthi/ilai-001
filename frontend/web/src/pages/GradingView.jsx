import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import assignmentService from '../services/assignmentService';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const GradingView = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [grade, setGrade] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch assignment details (mocking getById via course list again or assuming we have it)
                // Ideally we'd have getAssignmentById. 
                // Let's assume we can get it from the submissions list or similar.
                // For now, let's fetch submissions first.
                const subs = await assignmentService.getSubmissionsByAssignment(assignmentId);
                setSubmissions(subs);

                // Fetch assignment details if possible, or just use ID
                // We'll just display ID or fetch if we can.
                // Let's try to fetch from course 1 again as fallback
                const assignments = await assignmentService.getAssignmentsByCourse(1);
                const found = assignments.find(a => a.id === parseInt(assignmentId));
                setAssignment(found);
            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [assignmentId]);

    const handleViewSubmission = async (submission) => {
        setSelectedSubmission(submission);
        // Fetch grade if exists
        try {
            const gradeResult = await assignmentService.getGrade(submission.id);
            setGrade(gradeResult);
        } catch (err) {
            setGrade(null); // No grade yet
        }
    };

    const handleAutoGrade = async () => {
        if (!selectedSubmission) return;
        try {
            const gradeResult = await assignmentService.gradeSubmission(selectedSubmission.id);
            setGrade(gradeResult);
        } catch (err) {
            console.error("Error grading", err);
            alert("Failed to auto-grade.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-500 hover:text-indigo-600 transition-colors mb-6">
                    <ArrowLeftIcon className="w-4 h-4" /> Back to Dashboard
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Submissions List */}
                    <div className="bg-white dark:bg-surface-800 rounded-3xl p-6 shadow-sm border border-surface-100 dark:border-surface-700 h-[calc(100vh-100px)] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Submissions</h2>
                        <p className="text-sm text-surface-500 mb-4">{assignment?.title || `Assignment #${assignmentId}`}</p>

                        <div className="space-y-2">
                            {submissions.length === 0 ? (
                                <p className="text-surface-500 text-center py-8">No submissions yet.</p>
                            ) : (
                                submissions.map(sub => (
                                    <div
                                        key={sub.id}
                                        onClick={() => handleViewSubmission(sub)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all ${selectedSubmission?.id === sub.id
                                            ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                            : 'bg-surface-50 dark:bg-surface-700/50 border-transparent hover:bg-surface-100'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-surface-900 dark:text-surface-100">Student #{sub.studentId}</span>
                                            <span className="text-xs text-surface-500">{new Date(sub.submissionDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Grading Area */}
                    <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-3xl p-8 shadow-sm border border-surface-100 dark:border-surface-700 h-[calc(100vh-100px)] overflow-y-auto">
                        {!selectedSubmission ? (
                            <div className="h-full flex flex-col items-center justify-center text-surface-400">
                                <p>Select a submission to view and grade.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100">Student Submission</h3>
                                    <div className="bg-surface-50 dark:bg-surface-700/50 p-6 rounded-xl border border-surface-200 dark:border-surface-700 whitespace-pre-wrap">
                                        {selectedSubmission.content}
                                    </div>
                                </div>

                                <div className="border-t border-surface-200 dark:border-surface-700 pt-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100">Grading</h3>
                                        {grade ? (
                                            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
                                                <CheckCircleIcon className="w-5 h-5" /> Graded
                                            </div>
                                        ) : (
                                            <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold flex items-center gap-2">
                                                <XCircleIcon className="w-5 h-5" /> Pending
                                            </div>
                                        )}
                                    </div>

                                    {grade ? (
                                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-indigo-900 dark:text-indigo-100">AI Score</span>
                                                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{grade.score} <span className="text-lg text-surface-400">/ {assignment?.maxScore || 100}</span></span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-indigo-900 dark:text-indigo-100 block mb-2">Feedback</span>
                                                <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{grade.feedback}</p>
                                            </div>
                                            <div className="pt-4 flex justify-end">
                                                <button className="text-sm text-indigo-600 hover:underline">Override Grade</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-surface-50 dark:bg-surface-700/50 rounded-xl border border-dashed border-surface-300 dark:border-surface-600">
                                            <p className="text-surface-500 mb-4">No grade generated yet.</p>
                                            <button
                                                onClick={handleAutoGrade}
                                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                                            >
                                                Run AI Auto-Grader
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradingView;
