import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const NoteVersions = ({ noteId, onRestore }) => {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!noteId) return;
    setIsLoading(true);
    apiClient.get(`/api/notes/${noteId}/versions`)
      .then(response => {
        setVersions(response.data);
      })
      .catch(error => {
        console.error('Error fetching note versions:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [noteId]);

  const handleRestore = async (versionId) => {
    try {
      await apiClient.post(`/api/notes/versions/${versionId}/restore`);
      onRestore();
    } catch (error) {
      console.error('Error restoring note version:', error);
    }
  };

  if (isLoading) {
    return <div>Loading versions...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Note Versions</h3>
      <ul className="space-y-2">
        {versions.map(version => (
          <li key={version.id} className="p-2 border rounded-md flex justify-between items-center">
            <div>
              <p className="font-semibold">{new Date(version.createdAt).toLocaleString()}</p>
              <p className="text-sm text-slate-500">{version.title}</p>
            </div>
            <button
              onClick={() => handleRestore(version.id)}
              className="px-3 py-1 bg-indigo-500 text-white rounded-md"
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NoteVersions;
