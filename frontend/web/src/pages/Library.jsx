// File: src/pages/LibraryPage.jsx
import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import FileUploader from '../components/FileUploader';

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/library/me');
        if (mounted) setItems([].concat(res.data || []));
      } catch (e) {
        console.error(e);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => (mounted = false);
  }, []);

  async function onUploaded(meta) {
    try {
      const payload = {
        title: meta.title || meta.key.split('/').pop(),
        description: meta.description || '',
        fileUrl: meta.fileUrl || meta.getUrl || '',
        mimeType: meta.mimeType,
        sizeBytes: meta.sizeBytes,
        libraryType: 'PERSONAL'
      };
      const res = await apiClient.post('/library', payload);
      setItems(prev => [res.data, ...prev]);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 p-4 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold">My Library</h2>
        <p className="text-sm text-gray-600">Upload files or add resources to your personal library.</p>

        <div className="mt-4">
          <FileUploader onUploaded={onUploaded} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <div>Loading...</div> : items.map(it => (
          <div key={it.id} className="bg-white/80 p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{it.title}</h3>
                <p className="text-sm text-gray-600">{it.mimeType} • {it.sizeBytes} bytes</p>
              </div>
              <a href={it.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600">Open</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
