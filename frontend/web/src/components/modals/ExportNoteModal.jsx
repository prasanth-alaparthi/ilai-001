import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Download, FileText, FileCode, Loader2, Check, Copy
} from 'lucide-react';
import { notesService } from '../../services/notesService';
import { jsPDF } from 'jspdf';

const ExportNoteModal = ({ note, onClose }) => {
    const [exportFormat, setExportFormat] = useState('markdown');
    const [isExporting, setIsExporting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            if (exportFormat === 'markdown') {
                const markdown = await notesService.exportNoteAsMarkdown(note);
                downloadFile(markdown, `${note.title || 'note'}.md`, 'text/markdown');
            } else if (exportFormat === 'pdf') {
                await exportToPdf(note);
            } else if (exportFormat === 'txt') {
                const markdown = await notesService.exportNoteAsMarkdown(note);
                // Strip markdown syntax for plain text
                const plainText = markdown.replace(/[#*_`\[\]]/g, '');
                downloadFile(plainText, `${note.title || 'note'}.txt`, 'text/plain');
            }
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleCopyMarkdown = async () => {
        const markdown = await notesService.exportNoteAsMarkdown(note);
        navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportToPdf = async (note) => {
        const markdown = await notesService.exportNoteAsMarkdown(note);
        const pdf = new jsPDF();

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(note.title || 'Untitled Note', 20, 20);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);

        // Simple text wrapping
        const lines = pdf.splitTextToSize(markdown.replace(/^#.*\n\n/, ''), 170);
        pdf.text(lines, 20, 35);

        pdf.save(`${note.title || 'note'}.pdf`);
    };

    const formats = [
        { id: 'markdown', label: 'Markdown', icon: FileCode, ext: '.md' },
        { id: 'pdf', label: 'PDF', icon: FileText, ext: '.pdf' },
        { id: 'txt', label: 'Plain Text', icon: FileText, ext: '.txt' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-surface-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary-500/20 text-primary-400">
                            <Download size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Export Note</h3>
                            <p className="text-xs text-surface-400">{note.title || 'Untitled'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Format Selection */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-surface-400 mb-4">Choose export format:</p>

                    <div className="grid grid-cols-3 gap-3">
                        {formats.map((format) => (
                            <button
                                key={format.id}
                                onClick={() => setExportFormat(format.id)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${exportFormat === format.id
                                        ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                                        : 'bg-white/5 border-white/10 text-surface-400 hover:bg-white/10'
                                    }`}
                            >
                                <format.icon size={24} />
                                <span className="text-sm font-medium">{format.label}</span>
                                <span className="text-xs opacity-60">{format.ext}</span>
                            </button>
                        ))}
                    </div>

                    {/* Quick Copy */}
                    <button
                        onClick={handleCopyMarkdown}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-surface-400 hover:bg-white/10 hover:text-white transition-all"
                    >
                        {copied ? (
                            <>
                                <Check size={16} className="text-green-400" />
                                <span className="text-green-400">Copied to clipboard!</span>
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                <span>Copy as Markdown</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-surface-300 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-all"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                Export
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ExportNoteModal;
