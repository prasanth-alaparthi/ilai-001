import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

const BulkUploadModal = ({ isOpen, onClose, institutionId }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,email,username,role\nstudent1@example.com,student1,STUDENT\nteacher1@example.com,teacher1,TEACHER";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ilai_bulk_upload_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`/api/auth/institutions/${institutionId}/bulk-upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setStatus({ type: 'success', message: res.data });
            setFile(null);
        } catch (err) {
            console.error("Upload failed", err);
            setStatus({ type: 'error', message: err.response?.data?.message || "Upload failed. Please check the file format." });
        } finally {
            setUploading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                    >
                        <div className="flex justify-between items-center p-6 border-b border-surface-100 dark:border-surface-700">
                            <h3 className="text-xl font-bold text-surface-900 dark:text-surface-50">Bulk User Upload</h3>
                            <button onClick={onClose} className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="text-sm text-surface-600 dark:text-surface-300">
                                Upload a CSV file to add multiple users at once.
                                <br />
                                <button onClick={handleDownloadTemplate} className="text-primary-600 hover:underline font-medium mt-1 inline-flex items-center gap-1">
                                    <DocumentTextIcon className="w-4 h-4" /> Download Template
                                </button>
                            </div>

                            <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors cursor-pointer relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <CloudArrowUpIcon className="w-12 h-12 text-surface-400 mb-3" />
                                <p className="text-sm font-medium text-surface-700 dark:text-surface-200">
                                    {file ? file.name : "Click or drag CSV here"}
                                </p>
                                <p className="text-xs text-surface-400 mt-1">Max 5MB</p>
                            </div>

                            {status && (
                                <div className={`p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {status.message}
                                </div>
                            )}

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-surface-600 font-medium hover:bg-surface-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className={`px-4 py-2 bg-primary-600 text-white font-medium rounded-lg shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-colors ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Users'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BulkUploadModal;
