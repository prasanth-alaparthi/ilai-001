import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiClock, FiRotateCcw } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { notesService } from '../../services/notesService';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function NoteVersionsModal({ isOpen, onClose, noteId, onRestore }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        isDanger: false
    });

    useEffect(() => {
        if (isOpen && noteId) {
            loadVersions();
        }
    }, [isOpen, noteId]);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const data = await notesService.getNoteVersions(noteId);
            setVersions(data);
        } catch (err) {
            console.error("Failed to load versions", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (versionId) => {
        setConfirmationModal({
            isOpen: true,
            title: "Restore Version",
            message: "Are you sure you want to restore this version? Current changes will be overwritten.",
            isDanger: true,
            onConfirm: async () => {
                try {
                    await notesService.restoreNoteVersion(versionId);
                    onRestore();
                    onClose();
                } catch (err) {
                    console.error("Failed to restore version", err);
                    alert("Failed to restore version.");
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-surface-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
                >
                    <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-800">
                        <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                            <FiClock /> Version History
                        </h3>
                        <button onClick={onClose} className="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="text-center py-8 text-surface-500">Loading versions...</div>
                        ) : versions.length === 0 ? (
                            <div className="text-center py-8 text-surface-500">No previous versions found.</div>
                        ) : (
                            versions.map((version) => (
                                <div key={version.id} className="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                                    <div>
                                        <div className="text-sm font-medium text-surface-900 dark:text-surface-100">
                                            {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                                        </div>
                                        <div className="text-xs text-surface-500">
                                            {new Date(version.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRestore(version.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                                    >
                                        <FiRotateCcw /> Restore
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50 text-right">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
                onConfirm={confirmationModal.onConfirm}
                title={confirmationModal.title}
                message={confirmationModal.message}
                isDanger={confirmationModal.isDanger}
            />
        </AnimatePresence>
    );
}
