import React, { useEffect, useState } from "react";
import FlashcardDrill from "../components/FlashcardDrill";
import apiClient from "../services/apiClient";
import { BoltIcon } from '@heroicons/react/24/outline';

export default function FlashcardsPage() {
  const [journalId, setJournalId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecentJournal() {
      try {
        // Try to fetch journals or notes that might have flashcards
        // For now, we'll try to get the most recent note/journal
        const res = await apiClient.get('/notes?sort=updatedAt,desc&size=1');
        const items = res.data?.content || res.data?.items || res.data || [];

        if (items.length > 0) {
          setJournalId(items[0].id);
        } else {
          // If no notes, we can't really show flashcards yet
          setError("Create a note or journal entry first to generate flashcards.");
        }
      } catch (err) {
        console.error("Failed to fetch recent content:", err);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchRecentJournal();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <div className="text-surface-500 dark:text-surface-400">Loading flashcards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
          <BoltIcon className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">Flashcards</h1>
        <p className="text-surface-500 dark:text-surface-400 mb-6">{error}</p>
        <button
          onClick={() => window.location.href = '/notes'}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Notes
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <BoltIcon className="w-8 h-8 text-amber-500" />
          Flashcards
        </h1>
        <p className="text-surface-500 dark:text-surface-400">Review key concepts from your recent notes.</p>
      </div>

      <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 min-h-[400px]">
        <FlashcardDrill journalId={journalId} />
      </div>
    </div>
  );
}