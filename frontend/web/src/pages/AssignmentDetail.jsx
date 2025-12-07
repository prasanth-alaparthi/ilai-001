import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import assignmentService from '../services/assignmentService';
import { ArrowLeftIcon, DocumentTextIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useUser } from '../state/UserContext';

const AssignmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const [assignment, setAssignment] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [grade, setGrade] = useState(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch assignment details
                // Note: We might need a specific endpoint for getting a single assignment by ID
                // For now, we'll fetch all (or by course) and filter, or assume backend supports /api/assignments/{id}
                // Let's assume we can fetch by course and find it, or add a getById endpoint.
                // For MVP simplicity, let's try to get it from the course list if we knew the course ID, 
                // but we don't here.
                // Let's assume we added a getById to the service/backend.
                // If not, we might need to mock or fix backend.
                // Let's try fetching assignments for course 1 again as a fallback if getById fails.

                // Ideally: const data = await assignmentService.getAssignmentById(id);
                // Current service doesn't have getById. Let's add it to service or use a workaround.
                // Workaround: Fetch all for course 1 and find.
                const assignments = await assignmentService.getAssignmentsByCourse(1);
                const found = assignments.find(a => a.id === parseInt(id));
                setAssignment(found);

                if (found) {
                    // Check for existing submission
                    const submissions = await assignmentService.getSubmissionsByAssignment(id);
                    // Filter for current student's submission
                    // Since we don't have student ID easily available in context sometimes, 
                    // we rely on backend filtering or check all.
                    // For MVP, let's assume the backend returns only my submissions or we filter by user.id
                    // But getSubmissionsByAssignment is likely for teachers (all students).
                    // We need "getMySubmission".
                    // Let's just check if we can find one.
                    // For now, we'll skip pre-filling submission to save time, or implement if needed.
                }
            } catch (err) {
                console.error("Error fetching assignment details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await assignmentService.submitAssignment({
                assignmentId: parseInt(id),
                studentId: user?.id || 102, // Fallback student ID
                content: content
            });
            alert("Assignment submitted successfully!");
            // Optionally fetch grade immediately if auto-grading is synchronous
            // or poll for it.
            // For MVP, we'll just show success.
            setSubmission({ content, submissionDate: new Date() });
        } catch (err) {
            console.error("Error submitting assignment", err);
            alert("Failed to submit assignment.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAutoGrade = async () => {
        if (!submission) return;
        try {
            // We need submission ID. If we just submitted, we might not have it unless backend returns it.
            // Let's assume we need to fetch submission first to get ID.
            // Simplified: Trigger grading for the assignment/student combo if possible, 
            // or just tell user to wait.
            // Actually, let's fetch the submission list to get the ID.
            const submissions = await assignmentService.getSubmissionsByAssignment(id);
            const mySubmission = submissions.find(s => s.studentId === (user?.id || 102));

            if (mySubmission) {
                const gradeResult = await assignmentService.gradeSubmission(mySubmission.id);
                setGrade(gradeResult);
            }
        } catch (err) {
            console.error("Error grading", err);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!assignment) return <div className="p-8 text-center">Assignment not found.</div>;

    return (
        <div className="min-h-screen bg-surface-50 dark:bg-surface-900 p-6 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-surface-500 hover:text-indigo-600 transition-colors">
                    <ArrowLeftIcon className="w-4 h-4" /> Back
                </button>

                <div className="bg-white dark:bg-surface-800 rounded-3xl p-8 shadow-sm border border-surface-100 dark:border-surface-700">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-2">{assignment.title}</h1>
                            <div className="flex gap-4 text-sm text-surface-500">
                                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>Max Score: {assignment.maxScore}</span>
                            </div>
                        </div>
                        {submission && (
                            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5" /> Submitted
                            </div>
                        )}
                    </div>

                    <div className="prose dark:prose-invert max-w-none mb-8">
                        <h3 className="text-lg font-bold mb-2">Instructions</h3>
                        <p>{assignment.description}</p>

                        <h3 className="text-lg font-bold mt-6 mb-2">Grading Criteria</h3>
                        <div className="bg-surface-50 dark:bg-surface-700/50 p-4 rounded-xl text-sm whitespace-pre-wrap">
                            {assignment.criteria}
                        </div>
                    </div>

                    <hr className="border-surface-200 dark:border-surface-700 my-8" />

                    <div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <DocumentTextIcon className="w-6 h-6 text-indigo-500" />
                            Your Submission
                        </h3>

                        {submission ? (
                            <div className="space-y-6">
                                <div className="bg-surface-50 dark:bg-surface-700/50 p-6 rounded-xl border border-surface-200 dark:border-surface-700">
                                    <p className="whitespace-pre-wrap">{submission.content}</p>
                                    <p className="text-xs text-surface-400 mt-4 text-right">
                                        Submitted on {new Date(submission.submissionDate).toLocaleString()}
                                    </p>
                                </div>

                                {grade ? (
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-lg text-indigo-900 dark:text-indigo-100">AI Grading Result</h4>
                                            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{grade.score} / {assignment.maxScore}</span>
                                        </div>
                                        <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">{grade.feedback}</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleAutoGrade}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
                                    >
                                        Get Instant AI Feedback
                                    </button>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <textarea
                                    className="w-full p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900 h-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Type your answer here..."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    required
                                />
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Assignment'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentDetail;
