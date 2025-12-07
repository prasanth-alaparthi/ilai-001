import React, { useState } from 'react';
import apiClient from '../services/apiClient';

export default function FileUploader({ onUploaded }) {
  const [_selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setSelected(f);
    setError(null);
    setProgress(0);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('files', f);
      formData.append('visibility', 'PUBLIC'); // Or get from user input

      const res = await apiClient.post('/feed/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: p => setProgress(Math.round((p.loaded / p.total) * 100)),
      });

      const createdPost = res.data;
      if (onUploaded) {
        onUploaded(createdPost.mediaUrls ? createdPost.mediaUrls[0] : null);
      }
    } catch (err) {
      console.error("File upload failed:", err);
      let errorMessage = "File upload failed: ";
      if (err.response) {
        errorMessage += `Server responded with status ${err.response.status} - ${err.response.data?.message || err.response.statusText}`;
      } else if (err.request) {
        errorMessage += "No response from server. Check network or backend status.";
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="border border-dashed rounded-lg p-4">
      <label className="flex flex-col items-center gap-2 cursor-pointer">
        <div className="p-4 rounded-full bg-indigo-50">
          <svg className="w-8 h-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" /></svg>
        </div>
        <div className="text-sm text-gray-600">Click to upload or drag and drop</div>
        <input type="file" className="hidden" onChange={handleFile} />
      </label>

      {uploading && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-sm text-gray-500 mt-1">Uploading... {progress}%</div>
        </div>
      )}

      {error && (
        <div className="mt-3 text-sm text-red-500">
          Error: {error}
        </div>
      )}
    </div>
  );
}
