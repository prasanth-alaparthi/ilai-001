import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../services/apiClient';
import FileUploader from './FileUploader';
import { FiImage, FiVideo, FiSmile, FiSend, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatePost({ onPostCreated }) {
  const [contentText, setContentText] = useState('');
  const [media, setMedia] = useState([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [isStudySession, setIsStudySession] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        // Only collapse if empty to avoid losing work
        if (!contentText.trim() && media.length === 0) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contentText, media]);

  const handleMediaUploaded = (fileUrl) => {
    if (!fileUrl) return;
    const isVideo = fileUrl.match(/\.(mp4|webm|ogg)$/i);
    const type = isVideo ? 'VIDEO' : 'IMAGE';

    setMedia((prevMedia) => [...prevMedia, {
      type: type,
      url: fileUrl,
      mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
      title: 'Uploaded Media',
    }]);
    setIsExpanded(true);
  };

  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!contentText.trim() && media.length === 0) {
      setError('Post cannot be empty.');
      return;
    }

    setPosting(true);
    try {
      const mediaUrls = media.map(m => m.url);
      let mediaType = 'TEXT';
      if (media.length > 1) {
        mediaType = 'CAROUSEL';
      } else if (media.length === 1) {
        mediaType = media[0].type;
      }

      const tags = [];
      if (isStudySession) tags.push('StudyWithMe');

      const formData = new FormData();
      formData.append('content', contentText.trim() || '');
      tags.forEach(tag => formData.append('tags', tag));
      formData.append('visibility', 'PUBLIC');
      mediaUrls.forEach(url => formData.append('mediaUrls', url));
      formData.append('mediaType', mediaType);

      await apiClient.post('/feed/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setContentText('');
      setMedia([]);
      setIsExpanded(false);
      if (onPostCreated) onPostCreated();
    } catch (err) {
      console.error('Failed to create post:', err);
      setError('Failed to post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <motion.div
      ref={containerRef}
      layout
      className="bg-white dark:bg-black border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="p-4">
        {error && <div className="text-red-500 text-sm mb-2 px-2">{error}</div>}

        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0"></div>
          <div className="flex-1">
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="What's on your mind?"
              rows={isExpanded ? 3 : 1}
              className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-500 resize-none text-base py-2"
            ></textarea>
          </div>
        </div>

        {/* Media Previews */}
        <AnimatePresence>
          {media.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 overflow-x-auto py-2 pl-12 scrollbar-hide"
            >
              {media.map((m, index) => (
                <div key={index} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden group">
                  {m.type === 'VIDEO' ? (
                    <video src={m.url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} alt="preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions Bar */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between mt-3 pl-12 border-t border-slate-100 dark:border-slate-800 pt-3"
            >
              <div className="flex items-center gap-4">
                <div className="relative overflow-hidden">
                  <FileUploader onUploaded={handleMediaUploaded} />
                  <div className="absolute inset-0 pointer-events-none flex items-center gap-2 text-indigo-500 font-medium text-sm">
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-500 hover:text-indigo-500 transition-colors">
                  <input
                    type="checkbox"
                    checked={isStudySession}
                    onChange={(e) => setIsStudySession(e.target.checked)}
                    className="hidden"
                  />
                  <span className={`px-3 py-1 rounded-full border ${isStudySession ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-500'}`}>
                    📚 Study Session
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={posting || (!contentText.trim() && media.length === 0)}
                className="px-6 py-2 rounded-full bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}