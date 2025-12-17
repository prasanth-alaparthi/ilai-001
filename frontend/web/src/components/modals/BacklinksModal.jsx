import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const BacklinksModal = ({ noteId, onSelectNote, onClose }) => {
  const [backlinks, setBacklinks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!noteId) return;
    setIsLoading(true);
    apiClient.get(`/notes/${noteId}/backlinks`)
      .then(response => {
        setBacklinks(response.data);
      })
      .catch(error => {
        console.error('Error fetching backlinks:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [noteId]);

  const handleSelect = (noteId) => {
    onSelectNote(noteId);
    onClose();
  };

  if (isLoading) {
    return <div>Loading backlinks...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">Backlinks</h3>
        <ul className="space-y-2">
          {backlinks.map(link => (
            <li key={link.sourceNoteId} className="p-2 border rounded-md flex justify-between items-center cursor-pointer" onClick={() => handleSelect(link.sourceNoteId)}>
              <div>
                <p className="font-semibold">Note {link.sourceNoteId}</p>
              </div>
            </li>
          ))}
        </ul>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BacklinksModal;
