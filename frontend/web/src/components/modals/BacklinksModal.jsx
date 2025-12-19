import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Link2, Ghost, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import apiClient from '../../services/apiClient';

const BacklinksModal = ({ noteId, onSelectNote, onClose }) => {
  const [links, setLinks] = useState({ incoming: [], outgoing: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    if (!noteId) return;
    setIsLoading(true);
    apiClient.get(`/notes/${noteId}/links`)
      .then(response => {
        setLinks(response.data);
        if (response.data.incoming.length === 0 && response.data.outgoing.length > 0) {
          setActiveTab('outgoing');
        }
      })
      .catch(error => {
        console.error('Error fetching links:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [noteId]);

  const handleSelect = (selectedId) => {
    onSelectNote(selectedId);
    onClose();
  };

  const currentLinks = activeTab === 'incoming' ? links.incoming : links.outgoing;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-surface-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-500/20 text-primary-400">
              <Link2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Linked Notes</h3>
              <p className="text-xs text-surface-400">Explore connections within your workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-surface-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-white/5 mx-6 mt-6 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'incoming'
              ? 'bg-primary-500 text-white shadow-lg'
              : 'text-surface-400 hover:text-white hover:bg-white/5'
              }`}
          >
            <ArrowLeft size={16} />
            Backlinks ({links.incoming.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'outgoing'
              ? 'bg-primary-500 text-white shadow-lg'
              : 'text-surface-400 hover:text-white hover:bg-white/5'
              }`}
          >
            Forward Links ({links.outgoing.length})
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-[300px]">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-surface-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              <p className="text-sm">Mapping connections...</p>
            </div>
          ) : currentLinks.length > 0 ? (
            <div className="space-y-3">
              {currentLinks.map((link, idx) => {
                const targetId = activeTab === 'incoming' ? link.sourceNoteId : link.targetNoteId;
                const targetTitle = activeTab === 'incoming' ? link.sourceNoteTitle : link.targetNoteTitle;

                return (
                  <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={`${targetId}-${idx}`}
                    onClick={() => handleSelect(targetId)}
                    className="w-full group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${link.manual ? 'bg-amber-500/20 text-amber-400' : 'bg-primary-500/20 text-primary-400'}`}>
                        <Ghost size={16} />
                      </div>
                      <div>
                        <div className="text-white font-medium group-hover:text-primary-400 transition-colors">
                          {targetTitle}
                        </div>
                        <div className="text-[10px] text-surface-500 flex items-center gap-1 mt-0.5">
                          {link.manual ? 'Manual Link' : `Semantic Link (${Math.round(link.relevanceScore * 100)}% relevant)`}
                        </div>
                      </div>
                    </div>
                    <ExternalLink size={16} className="text-surface-600 group-hover:text-primary-400 transition-colors" />
                  </motion.button>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <Link2 className="w-8 h-8 text-surface-600" />
              </div>
              <h4 className="text-white font-medium mb-1">No links found</h4>
              <p className="text-sm text-surface-500">
                {activeTab === 'incoming'
                  ? "No other notes reference this one yet."
                  : "This note doesn't link to any other notes."}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white/5 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-medium text-surface-300 hover:text-white hover:bg-white/5 transition-all outline-none"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BacklinksModal;

