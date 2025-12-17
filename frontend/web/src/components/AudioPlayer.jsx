import React, { useState, useRef, useCallback } from 'react';
import './AudioPlayer.css';

/**
 * AudioPlayer Component - Phase 5
 * Podcast-style audio overview player
 */
const AudioPlayer = ({ content: initialContent, topic: initialTopic }) => {
    const [content, setContent] = useState(initialContent || '');
    const [topic, setTopic] = useState(initialTopic || '');
    const [loading, setLoading] = useState(false);
    const [script, setScript] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentLine, setCurrentLine] = useState(0);
    const [selectedVoice, setSelectedVoice] = useState('en-US-Journey-D');
    const audioRef = useRef(null);

    const voices = [
        { id: 'en-US-Journey-D', name: 'Alex (Male)', lang: 'en-US' },
        { id: 'en-US-Journey-F', name: 'Sam (Female)', lang: 'en-US' },
        { id: 'en-GB-Neural2-B', name: 'James (British)', lang: 'en-GB' },
        { id: 'en-GB-Neural2-A', name: 'Sophie (British)', lang: 'en-GB' }
    ];

    const generatePodcast = useCallback(async () => {
        if (!content.trim() && !topic.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/notebook/podcast-script', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': localStorage.getItem('userId') || '1'
                },
                body: JSON.stringify({ content, topic })
            });

            if (!response.ok) throw new Error('Failed to generate podcast');

            const data = await response.json();
            setScript(data);
            setCurrentLine(0);
        } catch (err) {
            console.error('Podcast generation error:', err);
        } finally {
            setLoading(false);
        }
    }, [content, topic]);

    const generateAudio = useCallback(async () => {
        if (!script?.fullScript) return;

        try {
            const response = await fetch('/api/notebook/audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': localStorage.getItem('userId') || '1'
                },
                body: JSON.stringify({ script: script.fullScript, voice: selectedVoice })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.audioBase64) {
                    setAudioUrl(`data:audio/mp3;base64,${data.audioBase64}`);
                }
            }
        } catch (err) {
            console.error('Audio generation error:', err);
        }
    }, [script, selectedVoice]);

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getSpeakerColor = (speaker) => {
        return speaker === 'Alex' ? '#60a5fa' : '#f472b6';
    };

    return (
        <div className="audio-player">
            <div className="player-header">
                <h2>🎙️ Audio Overview</h2>
                <p className="subtitle">Turn your notes into podcast-style audio</p>
            </div>

            <div className="player-input">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic for your audio overview..."
                    className="topic-input"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste content to convert to audio..."
                    className="content-input"
                    rows={4}
                />

                <div className="voice-select">
                    <label>Voice:</label>
                    <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                    >
                        {voices.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={generatePodcast}
                    disabled={loading || (!content.trim() && !topic.trim())}
                    className="generate-btn"
                >
                    {loading ? '🔄 Generating Script...' : '📝 Generate Podcast Script'}
                </button>
            </div>

            {loading && (
                <div className="player-loading">
                    <div className="wave-animation">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                    <p>Creating your audio overview...</p>
                </div>
            )}

            {script && (
                <div className="script-section">
                    <div className="script-header">
                        <h3>{script.topic || topic}</h3>
                        <div className="script-meta">
                            <span>⏱️ ~{formatTime(script.estimatedSeconds || 300)}</span>
                            <span>👥 {script.dialogue?.length || 0} exchanges</span>
                        </div>
                    </div>

                    {/* Dialogue Display */}
                    <div className="dialogue-container">
                        {script.dialogue?.map((line, i) => (
                            <div
                                key={i}
                                className={`dialogue-line ${currentLine === i ? 'current' : ''}`}
                                onClick={() => setCurrentLine(i)}
                            >
                                <div
                                    className="speaker-badge"
                                    style={{ backgroundColor: getSpeakerColor(line.speaker) }}
                                >
                                    {line.speaker}
                                </div>
                                <p className="dialogue-text">{line.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Audio Controls */}
                    <div className="audio-controls">
                        <button
                            className="play-btn"
                            onClick={togglePlayback}
                            disabled={!audioUrl}
                        >
                            {isPlaying ? '⏸️' : '▶️'}
                        </button>

                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '0%' }}></div>
                        </div>

                        <span className="time-display">0:00 / {formatTime(script.estimatedSeconds || 0)}</span>

                        <button
                            onClick={generateAudio}
                            className="tts-btn"
                            disabled={!script?.fullScript}
                        >
                            🔊 Generate Audio
                        </button>

                        <button className="download-btn" disabled={!audioUrl}>
                            📥 Download
                        </button>
                    </div>

                    {audioUrl && (
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                        />
                    )}

                    {/* Full Script Toggle */}
                    <details className="full-script">
                        <summary>View Full Script</summary>
                        <pre>{script.fullScript}</pre>
                    </details>
                </div>
            )}
        </div>
    );
};

export default AudioPlayer;
