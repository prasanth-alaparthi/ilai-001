// src/components/VoiceRecorder.jsx
import React, { useEffect, useRef, useState } from "react";
import apiClient from "../services/apiClient";

export default function VoiceRecorder({ journalId, onUploaded }) {
  const [recording, setRecording] = useState(false);
  const [ready, setReady] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRef.current = new MediaRecorder(stream);
        mediaRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mediaRef.current.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          chunksRef.current = [];
          const localUrl = URL.createObjectURL(blob);
          setAudioUrl(localUrl);
          // upload
          const fd = new FormData();
          fd.append("file", blob, `journal-${journalId || "new"}-${Date.now()}.webm`);
          setUploading(true);
          try {
            const res = await apiClient.post(`/journals/${journalId}/audio`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            onUploaded && onUploaded(res.data);
          } catch {
            console.error("Upload failed");
            alert("Upload failed");
          } finally { setUploading(false); }
        };
        setReady(true);
      } catch {
        console.error("Init failed");
        setReady(false);
      }
    }
    init();
    return () => { try { mediaRef.current?.stream?.getTracks().forEach(t => t.stop()); } catch { console.error("Error stopping media tracks"); } };
  }, [journalId, onUploaded]);

  function start() {
    if (!mediaRef.current) return alert("No mic access");
    chunksRef.current = [];
    mediaRef.current.start();
    setRecording(true);
  }
  function stop() {
    if (!mediaRef.current) return;
    mediaRef.current.stop();
    setRecording(false);
  }

  return (
    <div className="p-3 border rounded-md bg-white dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <button className={`px-3 py-1 rounded ${recording ? "bg-red-500 text-white" : "border"}`} onClick={() => recording ? stop() : start()} disabled={!ready || uploading}>
          {recording ? "Stop" : "Record"}
        </button>
        <div className="text-sm text-gray-500">{uploading ? "Uploading..." : ready ? (recording ? "Recording…" : "Ready") : "Microphone not available"}</div>
      </div>

      {audioUrl && (
        <div className="mt-3">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}