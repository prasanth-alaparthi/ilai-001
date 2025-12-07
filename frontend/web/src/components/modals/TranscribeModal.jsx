import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMic, FiSquare, FiUpload, FiCheck } from "react-icons/fi";
import { notesService } from "../../services/notesService";

export default function TranscribeModal({ isOpen, onClose, onTranscriptionComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [transcribing, setTranscribing] = useState(false);
    const [error, setError] = useState("");
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        if (!isOpen) {
            setAudioBlob(null);
            setError("");
            setIsRecording(false);
        }
    }, [isOpen]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                setAudioBlob(blob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setError("");
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioBlob(file);
            setError("");
        }
    };

    const handleTranscribe = async () => {
        if (!audioBlob) return;

        setTranscribing(true);
        setError("");
        try {
            // Create a File object from the blob if it's a recording
            let fileToUpload = audioBlob;
            if (!(audioBlob instanceof File)) {
                fileToUpload = new File([audioBlob], "recording.webm", { type: "audio/webm" });
            }

            const result = await notesService.transcribe(fileToUpload);
            if (result && result.transcription) {
                onTranscriptionComplete(result.transcription);
                onClose();
            } else {
                setError("No transcription received.");
            }
        } catch (err) {
            console.error("Transcription failed:", err);
            setError("Failed to transcribe audio. Please try again.");
        } finally {
            setTranscribing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-surface-200 dark:border-surface-700"
                >
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100">
                                Voice to Text
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 transition-colors"
                            >
                                <FiX />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col items-center gap-6 py-4">
                            {!audioBlob ? (
                                <>
                                    <button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording
                                                ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                                                : "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50"
                                            }`}
                                    >
                                        {isRecording ? <FiSquare className="w-8 h-8" /> : <FiMic className="w-8 h-8" />}
                                    </button>
                                    <p className="text-surface-500 text-sm">
                                        {isRecording ? "Recording... Tap to stop" : "Tap to record"}
                                    </p>

                                    <div className="w-full flex items-center gap-4">
                                        <div className="h-px bg-surface-200 dark:bg-surface-700 flex-1" />
                                        <span className="text-xs text-surface-400 font-medium uppercase">Or upload</span>
                                        <div className="h-px bg-surface-200 dark:bg-surface-700 flex-1" />
                                    </div>

                                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-sm font-medium text-surface-600 dark:text-surface-300">
                                        <FiUpload />
                                        Choose Audio File
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                </>
                            ) : (
                                <div className="w-full space-y-4">
                                    <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                                <FiMic />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                                                    Audio Recorded
                                                </p>
                                                <p className="text-xs text-surface-500">Ready to transcribe</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setAudioBlob(null)}
                                            className="text-xs text-red-500 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleTranscribe}
                                        disabled={transcribing}
                                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium shadow-lg shadow-primary-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {transcribing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Transcribing...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheck /> Start Transcription
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
