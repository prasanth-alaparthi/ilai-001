import { useState, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';

/**
 * Hook for doubt solver functionality
 */
export function useDoubtSolver() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    const solveDoubt = useCallback(async (question, subject = null, noteContexts = null) => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.post('/api/doubt-solver/solve', {
                question,
                subject,
                noteContexts,
                userId: JSON.parse(localStorage.getItem('user') || '{}')?.id
            });

            const data = response.data;
            setResult(data);

            // Add to history
            setHistory(prev => [{
                question,
                answer: data.answer,
                subject: data.subject,
                timestamp: new Date(),
                citations: data.citations
            }, ...prev].slice(0, 10)); // Keep last 10

            return data;
        } catch (err) {
            console.error('Doubt solver error:', err);
            setError(err.response?.data?.error || 'Failed to solve doubt');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const detectSubject = useCallback(async (question) => {
        try {
            const response = await apiClient.post('/api/doubt-solver/detect-subject', { question });
            return response.data.subject;
        } catch (err) {
            console.error('Subject detection error:', err);
            return 'general';
        }
    }, []);

    const getFollowUpQuestions = useCallback(async (question, answer) => {
        try {
            const response = await apiClient.post('/api/doubt-solver/follow-up', { question, answer });
            return response.data.followUpQuestions || [];
        } catch (err) {
            console.error('Follow-up error:', err);
            return [];
        }
    }, []);

    const clearResult = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return {
        solveDoubt,
        detectSubject,
        getFollowUpQuestions,
        clearResult,
        loading,
        result,
        error,
        history
    };
}

/**
 * Hook for voice transcription
 */
export function useVoiceTranscription() {
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);
    const [transcription, setTranscription] = useState(null);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start(1000); // Collect data every second
            mediaRecorderRef.current = mediaRecorder;
            setRecording(true);
            setError(null);
        } catch (err) {
            console.error('Failed to start recording:', err);
            setError('Microphone access denied');
        }
    }, []);

    const stopRecording = useCallback(async () => {
        return new Promise((resolve) => {
            if (mediaRecorderRef.current && recording) {
                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    resolve(audioBlob);
                };
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                setRecording(false);
            } else {
                resolve(null);
            }
        });
    }, [recording]);

    const transcribeAudio = useCallback(async (audioBlob, language = 'auto') => {
        if (!audioBlob) {
            setError('No audio to transcribe');
            return null;
        }

        try {
            setTranscribing(true);
            setError(null);

            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('language', language);

            const response = await apiClient.post('/api/voice/transcribe', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const data = response.data;
            setTranscription(data.transcription);
            return data;
        } catch (err) {
            console.error('Transcription error:', err);
            setError(err.response?.data?.error || 'Transcription failed');
            return null;
        } finally {
            setTranscribing(false);
        }
    }, []);

    const recordAndTranscribe = useCallback(async (language = 'auto') => {
        const audioBlob = await stopRecording();
        if (audioBlob) {
            return await transcribeAudio(audioBlob, language);
        }
        return null;
    }, [stopRecording, transcribeAudio]);

    const extractKeyPoints = useCallback(async (text) => {
        try {
            const response = await apiClient.post('/api/voice/extract-key-points', {
                transcription: text || transcription
            });
            return response.data;
        } catch (err) {
            console.error('Key points extraction error:', err);
            return null;
        }
    }, [transcription]);

    const convertToNotes = useCallback(async (text, title) => {
        try {
            const response = await apiClient.post('/api/voice/to-notes', {
                transcription: text || transcription,
                title
            });
            return response.data;
        } catch (err) {
            console.error('Notes conversion error:', err);
            return null;
        }
    }, [transcription]);

    const clearTranscription = useCallback(() => {
        setTranscription(null);
        setError(null);
    }, []);

    return {
        // Recording
        recording,
        startRecording,
        stopRecording,
        recordAndTranscribe,

        // Transcription
        transcribing,
        transcription,
        transcribeAudio,

        // Processing
        extractKeyPoints,
        convertToNotes,

        // State
        error,
        clearTranscription
    };
}

export default useDoubtSolver;
