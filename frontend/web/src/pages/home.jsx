import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../services/apiClient";
import assignmentService from "../services/assignmentService";
import { useUser } from "../state/UserContext";
import { useNotificationStore } from "../stores/notificationStore";
import { AuraLoader } from "../components/ui/AuraLoader";
import heroImg from "../assets/hero_brain.png";
import {
  Plus,
  BookOpen,
  Zap,
  Sparkles,
  Search,
  ArrowRight,
  Calendar,
  ClipboardList,
  Beaker,
  Users,
  GraduationCap,
  TrendingUp,
  BrainCircuit,
  Star
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.3, ease: "easeOut" }
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [profile, setProfile] = useState(null);
  const [xp, setXp] = useState(0);
  const [recentNotes, setRecentNotes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        const pRes = await apiClient.get("/auth/me").catch(() => null);
        if (!mounted) return;

        if (pRes?.data) {
          setProfile(pRes.data);
          // Parallel fetches for speed
          const [xpRes, notesRes, assignRes] = await Promise.allSettled([
            apiClient.get(`/gamification/stats/${pRes.data.id}`),
            apiClient.get("/notes"),
            assignmentService.getAssignmentsByCourse(1)
          ]);

          if (mounted) {
            if (xpRes.status === 'fulfilled') setXp(xpRes.value.data?.xp ?? 0);
            if (notesRes.status === 'fulfilled') {
              const data = notesRes.value.data;
              setRecentNotes(Array.isArray(data) ? data : (data?.content || data?.items || []));
            }
            if (assignRes.status === 'fulfilled') {
              const data = assignRes.value;
              setAssignments(Array.isArray(data) ? data : (data?.content || data?.items || []));
            }
          }
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
      const res = await apiClient.post("/notes", {
        title: "Untitled",
        content: { type: "doc", content: [] },
        visibility: "private"
      });
      useNotificationStore.getState().addNotification({
        message: "Knowledge node initialized",
        type: "success",
        isToast: true
      });
      navigate(`/notes/${res.data.id}/edit`);
    } catch (e) {
      useNotificationStore.getState().addNotification({
        message: "Failed to initialize note",
        type: "error",
        isToast: true
      });
      navigate("/notes");
    }
  };

  const [isOptimizing, setIsOptimizing] = useState(false);
  const optimizeSchedule = async () => {
    setIsOptimizing(true);
    // Simulate AI optimization
    await new Promise(r => setTimeout(r, 2000));
    setIsOptimizing(false);
    useNotificationStore.getState().addNotification({
      message: "Schedule optimized for peak focus",
      type: "success",
      isToast: true
    });
  };

  const [flippedMissions, setFlippedMissions] = useState(false);

  const getDisplayName = () => {
    if (profile?.displayName) return profile.displayName;
    const name = user?.username || "Scholar";
    if (name.includes('@')) {
      const localPart = name.split('@')[0];
      return localPart.charAt(0).toUpperCase() + localPart.slice(1).replace(/[0-9._]/g, ' ');
    }
    return name;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12"
    >
      {/* Premium Hero Section */}
      <motion.section
        variants={itemVariants}
        className="relative min-h-[400px] flex items-center overflow-hidden rounded-[3rem] glass-panel bg-white/20 p-8 md:p-16 border-none shadow-bloom"
      >
        <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block overflow-hidden">
          <motion.img
            initial={{ scale: 1.2, opacity: 0, rotate: 5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={heroImg}
            alt="AI Catalyst"
            className="w-full h-full object-cover mix-blend-overlay filter blur-[1px] opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#FDF0F0]" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-8">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-quartz/20 text-charcoal-warm text-sm font-medium border border-rose-quartz/30"
            >
              <Sparkles size={16} className="text-rose-quartz" />
              <span>AI-Powered Learning Alive</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-serif font-bold text-charcoal-warm leading-[1.1] tracking-tight">
              Welcome back, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lilac-soft via-slate-soft to-charcoal-warm">
                {getDisplayName()}
              </span>
            </h1>

            <p className="text-lg text-slate-soft font-light max-w-lg leading-relaxed">
              Your academic journey is flowing beautifully. You've conquered <span className="font-medium text-charcoal-warm">{xp} XP</span> this semester. Ready for the next breakthrough?
            </p>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${query}`); }}
            className="relative max-w-md group"
          >
            <div className="absolute inset-0 bg-rose-quartz/10 blur-xl group-focus-within:bg-rose-quartz/20 transition-all rounded-full" />
            <div className="relative flex items-center">
              <Search className="absolute left-5 text-slate-soft group-focus-within:text-charcoal-warm transition-colors" size={20} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, papers, or clubs..."
                className="w-full input-alive pl-14 pr-6 py-4 border-none shadow-soft hover:shadow-lifted transition-all text-lg"
              />
            </div>
          </form>
        </div>
      </motion.section>

      {/* Dynamic Action Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: Plus, label: "New Note", sub: "Start fresh", path: "create", color: "bg-blue-500/10 text-blue-500", action: createNewNote },
          { icon: BookOpen, label: "Journal", sub: "Reflection", path: "journal", color: "bg-pink-500/10 text-pink-500" },
          { icon: Zap, label: "Flashcards", sub: "Mastery", path: "flashcards", color: "bg-amber-500/10 text-amber-500" },
          { icon: Sparkles, label: "Study AI", sub: "Catalyst", path: "quiz", color: "bg-purple-500/10 text-purple-500" }
        ].map((item, id) => (
          <motion.div
            key={id}
            variants={itemVariants}
            whileHover={{ scale: 1.05, filter: "drop-shadow(0 0 12px rgba(139, 92, 246, 0.2))" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              try {
                item.action ? item.action() : navigate(`/${item.path}`);
              } catch (err) {
                useNotificationStore.getState().addNotification({
                  message: "Action interrupted",
                  type: "error",
                  isToast: true
                });
              }
            }}
            className="emotive-card cursor-pointer group flex flex-col items-center text-center gap-4 p-8"
          >
            <div className={`p-4 rounded-3xl ${item.color} group-hover:scale-110 transition-transform duration-500`}>
              <item.icon size={32} />
            </div>
            <div>
              <h3 className="font-semibold text-charcoal-warm">{item.label}</h3>
              <p className="text-xs text-slate-soft mt-1">{item.sub}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Intelligence & Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-12">
          {/* Recent Breakthroughs (Notes) */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <BrainCircuit className="text-rose-quartz" size={28} />
                <h2 className="text-3xl font-serif font-bold text-charcoal-warm">Recent Notes</h2>
              </div>
              <Link to="/notes" className="group flex items-center gap-2 text-sm font-medium text-slate-soft hover:text-charcoal-warm transition-colors">
                Explore Library <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {loading ? (
                  [1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 glass-panel animate-pulse bg-white/10" />
                  ))
                ) : recentNotes.length === 0 ? (
                  <div className="col-span-full glass-panel p-20 text-center border-dashed border-lilac-soft/50">
                    <p className="text-slate-soft font-light text-lg">Your knowledge garden is empty. Start planting ideas!</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={createNewNote}
                      className="btn-alive mt-6"
                    >
                      Create First Note
                    </motion.button>
                  </div>
                ) : (
                  recentNotes.slice(0, 4).map((note) => (
                    <motion.div
                      key={note.id}
                      variants={itemVariants}
                      whileHover={{ y: -5 }}
                      className="glass-panel p-6 hover:bg-white/40 transition-colors group relative overflow-hidden h-48 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="px-2 py-0.5 rounded-md bg-lilac-soft/20 text-[10px] font-bold text-slate-soft uppercase tracking-wider">Note</div>
                          <Star size={14} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h3 className="text-xl font-bold text-charcoal-warm line-clamp-1 group-hover:text-rose-quartz transition-colors">{note.title || "Untitled"}</h3>
                        <p className="text-sm text-slate-soft line-clamp-2 font-light">
                          {note.content?.content ? "Rich AI format preserved..." : "Click to delve into this topic."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-lilac-soft/10">
                        <span className="text-[10px] font-mono text-slate-soft/50">{new Date(note.updatedAt).toLocaleDateString()}</span>
                        <Link to={`/notes/${note.id}`} className="text-charcoal-warm hover:text-rose-quartz transition-colors">
                          <ArrowRight size={18} />
                        </Link>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Collaborative Discovery */}
          <section className="bg-gradient-sunrise p-1 rounded-[3rem]">
            <div className="bg-pearl-white/90 backdrop-blur-xl rounded-[2.9rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-md">
                <h2 className="text-3xl font-serif font-bold text-charcoal-warm">Global Scholarship</h2>
                <p className="text-slate-soft font-light">Connect with peer reviewers, solve bounties, and build your academic reputation across the ILAI network.</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 p-3 glass-panel border-none shadow-soft">
                    <Users size={18} className="text-blue-500" />
                    <span className="text-sm font-semibold">12.4k Scholars</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 glass-panel border-none shadow-soft">
                    <TrendingUp size={18} className="text-emerald-500" />
                    <span className="text-sm font-semibold">Top 3% Tier</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link to="/clubs" className="glass-panel p-6 flex flex-col items-center gap-2 hover:bg-white transition-all shadow-bloom border-rose-quartz/20">
                  <Users className="text-rose-quartz" size={24} />
                  <span className="text-sm font-bold">Clubs</span>
                </Link>
                <Link to="/classroom" className="glass-panel p-6 flex flex-col items-center gap-2 hover:bg-white transition-all shadow-bloom border-rose-quartz/20">
                  <GraduationCap className="text-rose-quartz" size={24} />
                  <span className="text-sm font-bold">Academic</span>
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Daily Pulse Widget */}
          <motion.div variants={itemVariants} className="emotive-card p-8 border-none bg-gradient-to-b from-white to-lavender-muted/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2 font-serif">
                <Calendar className="text-rose-quartz" size={20} /> Today's Flow
              </h3>
              <span className="text-[10px] font-bold py-1 px-3 bg-charcoal-warm text-white rounded-full uppercase">Live</span>
            </div>

            <div className="space-y-6">
              {[
                { time: "09:00", label: "Neural Architecture", active: true, color: "bg-rose-quartz" },
                { time: "11:30", label: "Bounty Review", active: false, color: "bg-lilac-soft" },
                { time: "15:00", label: "Deep Research", active: false, color: "bg-slate-soft" }
              ].map((ev, i) => (
                <div key={i} className="flex gap-5 group items-center">
                  <div className="text-[10px] font-mono font-bold text-slate-soft/60 group-hover:text-charcoal-warm transition-colors w-10">{ev.time}</div>
                  <div className={`w-1 self-stretch rounded-full ${ev.active ? 'animate-electric-pulse ' + ev.color : 'bg-dove-gray/30'}`} />
                  <div className={`flex-1 p-3 rounded-2xl transition-all ${ev.active ? 'bg-white shadow-soft font-bold' : 'font-light text-slate-soft opacity-60'}`}>
                    {ev.label}
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={optimizeSchedule}
              className="w-full mt-10 py-3 rounded-2xl border-2 border-lilac-soft/20 text-slate-soft font-bold text-sm hover:bg-lilac-soft/10 transition-all flex items-center justify-center gap-2"
            >
              {isOptimizing ? <AuraLoader size={20} /> : "Optimize Schedule"}
            </motion.button>
          </motion.div>

          {/* Pending Missions */}
          <motion.div
            variants={itemVariants}
            className="emotive-card p-8 border-none shadow-bloom bg-white relative cursor-pointer"
            onClick={() => setFlippedMissions(!flippedMissions)}
          >
            <AnimatePresence mode="wait">
              {!flippedMissions ? (
                <motion.div
                  key="front"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2 font-serif">
                      <ClipboardList className="text-rose-quartz" size={20} /> Missions
                    </h3>
                    <span className="text-xs font-bold text-rose-quartz">{assignments.length}</span>
                  </div>

                  {assignments.length > 0 ? (
                    <div className="space-y-4">
                      {assignments.slice(0, 3).map(a => (
                        <div key={a.id} className="group p-4 rounded-2xl bg-fog-light/50 border border-transparent hover:border-rose-quartz/20 hover:bg-white transition-all">
                          <div className="text-sm font-bold text-charcoal-warm group-hover:text-rose-quartz transition-colors truncate">{a.title}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="text-[10px] text-slate-soft font-bold">Expires {new Date(a.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center space-y-4 border-2 border-dashed border-lilac-soft/20 rounded-3xl">
                      <div className="text-3xl">🕊️</div>
                      <p className="text-sm text-slate-soft font-light">Silence in the storm.<br />All missions accomplished.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  className="space-y-6"
                >
                  <h3 className="text-xl font-bold font-serif text-rose-quartz">Daily Quests</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded flex items-center justify-center bg-green-500/10 text-green-500">✓</div>
                      <span>Log in today (+50 XP)</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm opacity-50">
                      <div className="w-5 h-5 rounded border border-slate-300" />
                      <span>Create 1 note (0/1)</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm opacity-50">
                      <div className="w-5 h-5 rounded border border-slate-300" />
                      <span>Solve 1 bounty (0/1)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">Click to flip back</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Hub */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <Link to="/labs" className="p-4 glass-panel flex flex-col items-center gap-2 hover:scale-105 transition-all text-xs font-bold text-slate-soft">
              <Beaker size={20} /> Labs
            </Link>
            <Link to="/settings" className="p-4 glass-panel flex flex-col items-center gap-2 hover:scale-105 transition-all text-xs font-bold text-slate-soft">
              <Star size={20} /> Premium
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
