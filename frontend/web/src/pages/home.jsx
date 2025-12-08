import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import apiClient from "../services/apiClient";
import assignmentService from "../services/assignmentService";
import { useUser } from "../state/UserContext";
import {
  Plus,
  PenTool,
  Zap,
  BookOpen,
  Search,
  Bell,
  Trophy,
  Bookmark,
  ArrowRight,
  Calendar,
  ClipboardList,
  Sparkles,
  Beaker,
  Users,
  GraduationCap
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [profile, setProfile] = useState(null);
  const [xp, setXp] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      setLoading(true);
      try {
        const pRes = await apiClient.get("/auth/me").catch(() => null);
        if (!mounted) return;
        if (pRes?.data) {
          setProfile(pRes.data);
          try {
            const xpRes = await apiClient.get(`/users/${pRes.data.username}/xp`);
            setXp(xpRes.data?.xp ?? 0);
          } catch { }
          try {
            const notesRes = await apiClient.get("/notes");
            setRecentNotes(Array.isArray(notesRes.data) ? notesRes.data : notesRes.data?.items || []);
          } catch { }
          try {
            const assignRes = await assignmentService.getAssignmentsByCourse(1);
            setAssignments(assignRes || []);
          } catch { }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  const createNewNote = async () => {
    try {
      const res = await apiClient.post("/notes", { title: "Untitled", content: "", visibility: "private" });
      navigate(`/notes/${res.data.id}/edit`);
    } catch (e) {
      console.error(e);
      navigate("/notes");
    }
  };

  const getPreviewText = (content) => {
    if (!content) return "";
    if (typeof content === 'string') return content.replace(/<[^>]+>/g, "");
    // Simple fallback for JSON content
    return "Click to view content...";
  };

  const ActionButton = ({ icon: Icon, label, sub, onClick, colorClass }) => (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-card p-6 text-left group relative overflow-hidden`}
    >
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorClass} bg-opacity-10`}>
          <Icon size={24} className={colorClass.replace('text-', '')} />
        </div>
        <h3 className="text-lg font-serif font-medium text-primary">{label}</h3>
        <p className="text-sm text-secondary mt-1 font-light">{sub}</p>
      </div>
    </motion.button>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-12"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-12 border-none">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/20 to-accent-green/10 z-0" />
        <div className="relative z-10 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-serif font-medium leading-tight mb-4"
          >
            Good Morning, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-glow">
              {profile?.displayName || user?.username || "Scholar"}
            </span>
          </motion.h1>
          <p className="text-lg text-secondary font-light mb-8 max-w-xl">
            You have <span className="text-primary font-medium">{assignments.length} assignments</span> due soon and <span className="text-primary font-medium">{xp ?? 0} XP</span> to earn today.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${query}`); }} className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search everything..."
              className="w-full bg-surface/50 border border-border rounded-full py-3.5 pl-12 pr-6 text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-accent-glow/50 transition-all font-light"
            />
          </form>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionButton
          icon={Plus}
          label="New Note"
          sub="Create a fresh page"
          onClick={createNewNote}
          colorClass="text-indigo-400"
        />
        <ActionButton
          icon={BookOpen}
          label="Journal"
          sub="Log your thoughts"
          onClick={() => navigate('/journal')}
          colorClass="text-pink-400"
        />
        <ActionButton
          icon={Zap}
          label="Flashcards"
          sub="Review & practice"
          onClick={() => navigate('/flashcards')}
          colorClass="text-amber-400"
        />
        <ActionButton
          icon={Sparkles}
          label="Quiz"
          sub="Test knowledge"
          onClick={() => navigate('/quiz')}
          colorClass="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed / Notes */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-medium">Recent Notes</h2>
              <Link to="/notes" className="text-sm font-light text-secondary hover:text-primary transition-colors flex items-center gap-1 group">
                View all <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4">
              {loading ? (
                [1, 2].map(i => <div key={i} className="h-24 glass-card animate-pulse" />)
              ) : recentNotes.length === 0 ? (
                <div className="glass-card p-8 text-center border-dashed">
                  <p className="text-secondary font-light">No notes yet.</p>
                </div>
              ) : (
                recentNotes.slice(0, 4).map((note, i) => (
                  <motion.div variants={itemVariants} key={note.id}>
                    <Link to={`/notes/${note.id}`} className="glass-card p-6 block hover:scale-[1.01] transition-transform group">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium mb-1 group-hover:text-accent-glow transition-colors">{note.title || "Untitled"}</h3>
                          <p className="text-sm text-secondary font-light line-clamp-2">{getPreviewText(note.content)}</p>
                        </div>
                        <span className="text-xs text-secondary/50 font-mono">
                          {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Explore Modules */}
          <section>
            <h2 className="text-2xl font-serif font-medium mb-6">Explore</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/labs" className="glass-card p-6 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform group hover:bg-zinc-800/50">
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <Beaker size={24} />
                </div>
                <span className="font-medium text-primary">Labs</span>
              </Link>
              <Link to="/classroom" className="glass-card p-6 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform group hover:bg-zinc-800/50">
                <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <GraduationCap size={24} />
                </div>
                <span className="font-medium text-primary">Classroom</span>
              </Link>
              <Link to="/clubs" className="glass-card p-6 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform group hover:bg-zinc-800/50">
                <div className="p-3 rounded-full bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  <Users size={24} />
                </div>
                <span className="font-medium text-primary">Clubs</span>
              </Link>
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <aside className="space-y-6">
          {/* Agenda */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-medium flex items-center gap-2">
                <Calendar size={18} /> Agenda
              </h3>
              <Link to="/calendar" className="text-xs text-secondary hover:text-primary">View</Link>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-1 h-full min-h-[40px] bg-accent-blue rounded-full" />
                <div>
                  <div className="text-xs text-secondary font-mono mb-1">09:00 AM</div>
                  <div className="text-sm font-medium">Math Class</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-1 h-full min-h-[40px] bg-accent-green rounded-full" />
                <div>
                  <div className="text-xs text-secondary font-mono mb-1">ALL DAY</div>
                  <div className="text-sm font-medium">Study Streak</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Assignments */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif font-medium flex items-center gap-2">
                <ClipboardList size={18} /> Tasks
              </h3>
              <span className="text-xs bg-surface border border-border px-2 py-0.5 rounded-full">{assignments.length}</span>
            </div>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.slice(0, 3).map(a => (
                  <div key={a.id} className="p-3 rounded-lg bg-surface/50 border border-border/50">
                    <div className="text-sm font-medium truncate">{a.title}</div>
                    <div className="text-xs text-secondary mt-1">Due {new Date(a.dueDate).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-secondary font-light">All caught up!</div>
            )}
          </motion.div>
        </aside>
      </div >
    </motion.div >
  );
}
