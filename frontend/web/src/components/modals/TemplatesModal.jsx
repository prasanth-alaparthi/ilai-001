import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

const TemplatesModal = ({ onSelect, onClose }) => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiClient.get('/notes/templates')
      .then(response => {
        setTemplates(response.data);
      })
      .catch(error => {
        console.error('Error fetching templates:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSelect = (template) => {
    onSelect(template.content);
    onClose();
  };

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">Note Templates</h3>
        <ul className="space-y-2">
          {templates.map(template => (
            <li key={template.id} className="p-2 border rounded-md flex justify-between items-center cursor-pointer" onClick={() => handleSelect(template)}>
              <div>
                <p className="font-semibold">{template.name}</p>
                <p className="text-sm text-slate-500">{template.description}</p>
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

export default TemplatesModal;
