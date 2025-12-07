import React from 'react';
import Modal from './Modal';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, showCancel = true }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="mt-2">
                <div className="flex items-start gap-4">
                    {isDanger && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        </div>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {message}
                    </p>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                {showCancel && (
                    <button
                        type="button"
                        className="inline-flex justify-center rounded-lg border border-transparent bg-slate-100 dark:bg-surface-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-surface-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 transition-colors"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                )}
                <button
                    type="button"
                    className={`inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-colors ${isDanger
                        ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500'
                        : 'bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500'
                        }`}
                    onClick={() => {
                        if (onConfirm) onConfirm();
                        onClose();
                    }}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
}
