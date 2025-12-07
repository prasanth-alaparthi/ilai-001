import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import assignmentService from "../services/assignmentService";
import { useUser } from "../state/UserContext";
import {
  PlusIcon,
  DocumentTextIcon,
  SparklesIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  BellIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  BookmarkIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser(); // Use user from context

  // profile & xp
  const [profile, setProfile] = useState(null);
  const [xp, setXp] = useState(null);
  // lists
  const [recentNotes, setRecentNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [query, setQuery] = useState("");
  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Infinite scroll for feed
  const mainContentRef = useRef(null);
  const [feedItems, setFeedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingFeed, setIsFetchingFeed] = useState(false);

  // fetchMoreFeed function
  const fetchMoreFeed = async () => {
    if (isFetchingFeed || !hasMore) return;

    setIsFetchingFeed(true);
    try {
      const res = await apiClient.get(`/feed/recommend?page=${page + 1}&limit=10`);
      const newItems = Array.isArray(res.data) ? res.data : res.data?.results || [];

      if (newItems.length > 0) {
        setFeedItems(prevItems => [...prevItems, ...newItems]);
        setPage(prevPage => prevPage + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch more feed items", err);
      setHasMore(false);
    } finally {
      setIsFetchingFeed(false);
    }
  };

  // load profile (me), then related lists
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      try {
        // Use user from context if available, but we might need fresh data
        const pRes = await apiClient.get("/auth/me").catch(() => null);

        if (!mounted) return;
        if (pRes && pRes.data) {
          setProfile(pRes.data);
          // try xp endpoint
          try {
            const xpRes = await apiClient.get(`/users/${pRes.data.username}/xp`);
            setXp(xpRes.data?.xp ?? 0);
          } catch {
            // ignore
          }

          // fetch recent notes for user
          try {
            const notesRes = await apiClient.get("/notes");
            setRecentNotes(Array.isArray(notesRes.data) ? notesRes.data : notesRes.data?.items || []);
          } catch {
            setRecentNotes([]);
          }

          // fetch assignments (mocking course ID 1 for now)
          try {
            // In a real app, we'd fetch the student's enrolled courses first, then assignments for each.
            // Or have a dedicated /api/assignments/me endpoint.
            // For MVP, we'll try to fetch assignments for a known course or all assignments if possible.
            // Let's try fetching for course 1.
            const assignRes = await assignmentService.getAssignmentsByCourse(1);
            setAssignments(assignRes || []);
          } catch (e) {
            console.log("Failed to fetch assignments", e);
            setAssignments([]);
          }

          // fetch recommended feed (initial load)
          try {
            const recRes = await apiClient.get("/feed/recommend?page=1&limit=10");
            const initialFeed = Array.isArray(recRes.data) ? recRes.data : recRes.data?.results || [];
            setFeedItems(initialFeed);
            setHasMore(initialFeed.length === 10);
          } catch {
            setFeedItems([]);
            setHasMore(false);
          }

          // fetch bookmarks count
          try {
            const bRes = await apiClient.get("/feed/bookmarks");
            setBookmarksCount(bRes.data?.total || (bRes.data?.items?.length ?? 0));
          } catch {
            setBookmarksCount(0);
          }
        } else {
          // no profile (anon)
          try {
            const recRes = await apiClient.get("/feed/recommend?page=1&limit=10");
            const initialFeed = Array.isArray(recRes.data) ? recRes.data : recRes.data?.results || [];
            setFeedItems(initialFeed);
            setHasMore(initialFeed.length === 10);
          } catch (err) {
            setFeedItems([]);
            setHasMore(false);
          }
        }

        // notifications count
        try {
          const nRes = await apiClient.get("/notifications/unread-count");
          setNotificationsCount(nRes.data?.count || 0);
        } catch {
          // ignore
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      // We need to attach this to the main scrollable area, which is likely the window or the main layout container
      // But since we are inside the layout, we might rely on window scroll if the layout uses body scroll
      // OR if the layout has a specific scroll container.
      // Based on AppLayout, the main tag has overflow-y-auto.
      // We can't easily access that ref here without context or passing refs.
      // For now, let's assume the user scrolls the window or we check if we are near bottom.

      // Actually, AppLayout has <main className="flex-1 overflow-y-auto ...">
      // So window scroll events won't fire. We need to listen to the scroll event on the parent.
      // A simple hack is to listen on the closest scrollable parent or just rely on a "Load More" button for now to be safe,
      // OR try to find the scroll parent.

      // Let's stick to a "Load More" button for reliability if infinite scroll is tricky without ref access.
    };
    // ...
  }, []);

  // Quick actions
  const createNewNote = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post("/notes", { title: "Untitled", content: "", visibility: "private" });
      const id = res.data.id;
      navigate(`/notes/${id}/edit`);
    } catch (e) {
      console.error("Create note failed", e);
      navigate("/notes");
    } finally {
      setActionLoading(false);
    }
  };

  const createNewJournal = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.post("/notes", { title: "Journal - " + new Date().toLocaleDateString(), content: "", visibility: "private" });
      navigate(`/notes/${res.data.id}/edit`);
    } catch (e) {
      console.error("Create journal failed", e);
      navigate("/notes");
    } finally {
      setActionLoading(false);
    }
  };

  const startQuickQuiz = () => navigate("/quiz");
  const openFlashcards = () => navigate("/flashcards");
  const goToBookmarks = () => navigate("/feed/bookmarks");

  const onSearch = (e) => {
    e.preventDefault();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const recPreview = useMemo(() => feedItems.slice(0, 2), [feedItems]);

  // Helper to safely extract text from content (string or JSON)
  const getPreviewText = (content) => {
    if (!content) return "";
    if (typeof content === 'string') {
      // If it's a string, strip HTML tags
      return content.replace(/<[^>]+>/g, "");
    }
    if (typeof content === 'object') {
      // If it's a JSON object (Tiptap/ProseMirror), try to extract text
      // This is a simplified extraction. For full support, we'd traverse the JSON.
      try {
        if (content.content && Array.isArray(content.content)) {
          return content.content.map(node => {
            if (node.type === 'text') return node.text;
            if (node.content) return getPreviewText(node); // Recursive simple case
            return "";
          }).join(" ");
        }
        return JSON.stringify(content); // Fallback
      } catch (e) {
        return "";
      }
    }
    return "";
  };

  return (
    <div className="min-h-full p-4 md:p-8 max-w-7xl mx-auto space-y-8">

      {/* Hero / Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-900 dark:to-secondary-900 shadow-xl text-white p-6 md:p-10">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold shadow-inner border border-white/10">
            {profile?.displayName?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || "M"}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Welcome back, {profile?.displayName || user?.username || "Guest"}!
            </h1>
            <p className="mt-2 text-indigo-100 text-lg max-w-2xl">
              Ready to continue your learning journey? You have {notificationsCount} new notifications and {recentNotes.length} recent notes.
            </p>

            {/* Search Bar inside Hero */}
            <form onSubmit={onSearch} className="mt-6 max-w-xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-indigo-200 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20 transition-all backdrop-blur-md"
                  placeholder="Search notes, flashcards, people..."
                />
                <button type="submit" className="absolute inset-y-1 right-1 px-4 rounded-lg bg-white text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors shadow-sm">
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Stats / XP */}
          <div className="hidden lg:flex flex-col gap-3 min-w-[140px]">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Current XP</div>
              <div className="text-3xl font-bold mt-1">{xp ?? 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="text-xs text-indigo-200 uppercase tracking-wider font-semibold">Streak</div>
              <div className="text-3xl font-bold mt-1">3 Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={createNewNote} disabled={actionLoading} className="group relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-all text-left">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PlusIcon className="w-24 h-24 text-indigo-600 dark:text-indigo-400 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
              <PlusIcon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">New Note</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Create a fresh page</p>
          </div>
        </button>

        <button onClick={() => navigate('/journal')} disabled={actionLoading} className="group relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-all text-left">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DocumentTextIcon className="w-24 h-24 text-pink-600 dark:text-pink-400 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-lg bg-pink-50 dark:bg-pink-900/30 flex items-center justify-center mb-4 text-pink-600 dark:text-pink-400">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Journal</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Log your thoughts</p>
          </div>
        </button>

        <button onClick={openFlashcards} className="group relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-all text-left">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BoltIcon className="w-24 h-24 text-amber-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-500">
              <BoltIcon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Flashcards</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Review & practice</p>
          </div>
        </button>

        <button onClick={startQuickQuiz} className="group relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-all text-left">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <SparklesIcon className="w-24 h-24 text-emerald-500 transform rotate-12 translate-x-4 -translate-y-4" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-500">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-surface-100">Quick Quiz</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Test your knowledge</p>
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Recent Notes Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-surface-500" />
                Recent Notes
              </h2>
              <Link to="/notes" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid gap-4">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-xl bg-surface-100 dark:bg-surface-800 animate-pulse" />
                ))
              ) : recentNotes.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <p className="text-surface-500 dark:text-surface-400">No notes yet. Start writing!</p>
                  <button onClick={createNewNote} className="mt-2 text-indigo-600 font-medium hover:underline">Create Note</button>
                </div>
              ) : (
                recentNotes.slice(0, 5).map(note => (
                  <Link key={note.id} to={`/notes/${note.id}`} className="group block p-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {note.title || "Untitled Note"}
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-1">
                          {getPreviewText(note.content) || "No content"}
                        </p>
                      </div>
                      <span className="text-xs text-surface-400 dark:text-surface-500 whitespace-nowrap ml-4">
                        {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          {/* Feed Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-surface-500" />
                Recommended for You
              </h2>
              <Link to="/feed" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
                Explore Feed <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid gap-4">
              {feedItems.length === 0 && !loading ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                  <p className="text-surface-500 dark:text-surface-400">No recommendations yet.</p>
                </div>
              ) : (
                feedItems.slice(0, 5).map(item => (
                  <Link key={item.id} to={`/feed/${item.id}`} className="block p-5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:shadow-md transition-all">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-700 flex-shrink-0 flex items-center justify-center text-2xl">
                        {/* Placeholder for feed image/icon */}
                        📚
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-surface-900 dark:text-surface-100 truncate">{item.title}</h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                          {getPreviewText(item.content).slice(0, 150)}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-xs text-surface-400">
                          <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{item.author || "Community"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}

              {hasMore && (
                <button
                  onClick={fetchMoreFeed}
                  disabled={isFetchingFeed}
                  className="w-full py-3 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors text-sm font-medium"
                >
                  {isFetchingFeed ? "Loading..." : "Load More"}
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Right Sidebar Column */}
        <aside className="space-y-6">
          {/* Calendar Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                Today's Schedule
              </h3>
              <Link to="/calendar" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                View Calendar
              </Link>
            </div>
            <div className="space-y-3">
              {/* Placeholder for now, would fetch from calendarService */}
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50 border-l-4 border-green-500">
                <div className="text-xs font-semibold text-green-600 dark:text-green-400">09:00 AM - 10:00 AM</div>
                <div className="text-sm font-medium text-surface-900 dark:text-surface-100">Math Class</div>
              </div>
              <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50 border-l-4 border-purple-500">
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400">All Day</div>
                <div className="text-sm font-medium text-surface-900 dark:text-surface-100">Study Streak (Day 4)</div>
              </div>
            </div>
          </div>

          {/* Assignments Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-orange-500" />
                Assignments
              </h3>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                {assignments.length}
              </span>
            </div>
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-sm text-surface-500 dark:text-surface-400">No pending assignments.</p>
              ) : (
                assignments.slice(0, 3).map(assignment => (
                  <Link key={assignment.id} to={`/assignments/${assignment.id}`} className="block p-3 rounded-lg bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                    <div className="text-sm font-medium text-surface-900 dark:text-surface-100">{assignment.title}</div>
                    <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Bookmarks Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <BookmarkIcon className="w-5 h-5 text-indigo-500" />
                Bookmarks
              </h3>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                {bookmarksCount}
              </span>
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
              Quick access to your saved notes and resources.
            </p>
            <button onClick={goToBookmarks} className="w-full py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors">
              View Bookmarks
            </button>
          </div>

          {/* Leaderboard Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-amber-500" />
                Leaderboard
              </h3>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((pos) => (
                <div key={pos} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pos === 1 ? 'bg-amber-100 text-amber-700' :
                    pos === 2 ? 'bg-slate-100 text-slate-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                    {pos}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-20 mb-1" />
                  </div>
                  <div className="text-xs font-medium text-surface-500">12{4 - pos}0 XP</div>
                </div>
              ))}
            </div>
            <Link to="/leaderboard" className="block mt-4 text-center text-sm text-surface-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              View Full Leaderboard
            </Link>
          </div>

          {/* Quick Links */}
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm">
            <h3 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/journal" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 text-sm text-surface-600 dark:text-surface-300 transition-colors">
                <span className="flex items-center gap-2"><BookOpenIcon className="w-4 h-4" /> My Journal</span>
                <ArrowRightIcon className="w-3 h-3 opacity-50" />
              </Link>
              <Link to="/chatapp" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 text-sm text-surface-600 dark:text-surface-300 transition-colors">
                <span className="flex items-center gap-2"><ChatBubbleLeftRightIcon className="w-4 h-4" /> AI Chat</span>
                <ArrowRightIcon className="w-3 h-3 opacity-50" />
              </Link>
              <Link to="/notifications" className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700/50 text-sm text-surface-600 dark:text-surface-300 transition-colors">
                <span className="flex items-center gap-2"><BellIcon className="w-4 h-4" /> Notifications</span>
                <span className="text-xs bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">{notificationsCount}</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
