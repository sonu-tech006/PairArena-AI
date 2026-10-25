import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { InterviewRoom, Problem } from '../types';
import { Users, Plus, ArrowRight, Play, Clock, CheckCircle2, Video, Shield, Copy, Check, Sparkles, BookOpen } from 'lucide-react';

export function InterviewsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewRoom[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Room Creation Configuration
  const [title, setTitle] = useState('Senior Systems & Full-Stack Mock Interview');
  const [interviewerName, setInterviewerName] = useState('Alex Chen');
  const [candidateName, setCandidateName] = useState(user?.name || 'Elena Rostova');
  const [durationMinutes, setDurationMinutes] = useState(60);
  
  // 2-3 Selected Questions
  const [q1, setQ1] = useState('prob-two-sum');
  const [q2, setQ2] = useState('prob-lru-cache');
  const [q3, setQ3] = useState('prob-coin-change');

  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [roomRes, probRes] = await Promise.all([
          apiRequest<{ interviews: InterviewRoom[] }>('/interviews'),
          apiRequest<{ problems: Problem[] }>('/problems')
        ]);
        setInterviews(roomRes.interviews || []);
        if (probRes.problems && probRes.problems.length > 0) {
          setAllProblems(probRes.problems);
          // Set sensible defaults if available
          const hasTwoSum = probRes.problems.find(p => p.id === 'prob-two-sum');
          if (hasTwoSum) setQ1(hasTwoSum.id);
        }
      } catch (err) {
        console.warn('Failed to load interviews or problems:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const selectedProblemIds = [q1, q2, q3].filter(Boolean);
      const res = await apiRequest<{ room: InterviewRoom }>('/interviews', {
        method: 'POST',
        body: JSON.stringify({
          title: title || 'Senior Systems & Full-Stack Mock Interview',
          durationMinutes,
          interviewerName,
          candidateName,
          problemId: q1,
          problemIds: selectedProblemIds,
        }),
      });
      navigate(`/interviews/${res.room.id}`);
    } catch (err: any) {
      alert(`Error launching interview room: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    const cleanId = joinRoomId.trim().replace(/^.*\/interviews\//, '');
    navigate(`/interviews/${cleanId}`);
  };

  const copyRoomLink = (id: string) => {
    const link = `${window.location.origin}/interviews/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-cyan-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>250+ Curated DSA Questions Bank Connected</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Live Collaborative Interview Hub</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Real-time pair-programming environments with live webcam/recording preview, 2-3 multi-question switching, sandboxed Wandbox execution, and instant circular & graph performance reports with PDF export.
          </p>
        </div>

        {/* Quick Join By Room ID */}
        <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
          <input
            type="text"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Enter Room Code (e.g. room-7x9q-2a1c)..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Join Room
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Configure & Launch Live Interview */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Play className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Launch Live Interview Session</h2>
              <p className="text-xs text-slate-400">Configure participant profiles, recording, & 2-3 interview problems</p>
            </div>
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Session Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend / Distributed Systems Mock"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Interviewer & Candidate Profile Names */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Interviewer Name</label>
                <input
                  type="text"
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Candidate Name</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Duration (Minutes)</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={45}>45 Minutes (Standard Screening)</option>
                <option value={60}>60 Minutes (Full Technical Round)</option>
                <option value={90}>90 Minutes (Deep Systems Architecture)</option>
              </select>
            </div>

            {/* 2-3 Problem Selectors */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Select 2-3 Questions for Interview</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {allProblems.length > 0 ? `${allProblems.length} DSA Available` : 'Loading bank...'}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Question 1 (Warmup / Core)</label>
                <select
                  value={q1}
                  onChange={(e) => setQ1(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {allProblems.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.difficulty}] {p.title} ({p.category})
                    </option>
                  ))}
                  {allProblems.length === 0 && (
                    <>
                      <option value="prob-two-sum">[Easy] Two Sum (Arrays)</option>
                      <option value="prob-valid-palindrome">[Easy] Valid Palindrome</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Question 2 (Core Algorithmic / Design)</label>
                <select
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {allProblems.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.difficulty}] {p.title} ({p.category})
                    </option>
                  ))}
                  {allProblems.length === 0 && (
                    <>
                      <option value="prob-lru-cache">[Medium] LRU Cache Design (Linked List)</option>
                      <option value="prob-number-of-islands">[Medium] Number of Islands</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1">Question 3 (Optimization / Challenge)</label>
                <select
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {allProblems.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.difficulty}] {p.title} ({p.category})
                    </option>
                  ))}
                  {allProblems.length === 0 && (
                    <>
                      <option value="prob-coin-change">[Medium] Coin Change DP</option>
                      <option value="prob-trapping-rain-water">[Hard] Trapping Rain Water</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Play className="w-4 h-4 text-cyan-300" />
                <span>{isCreating ? 'Launching Live Session...' : 'Launch Live Interview Now'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Your Interview Rooms & History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Your Interview Sessions</h2>
            <span className="text-xs text-slate-400 font-mono">{interviews.length} sessions</span>
          </div>

          {interviews.length > 0 ? (
            <div className="space-y-3">
              {interviews.map((room) => (
                <div
                  key={room.id}
                  className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{room.title}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                          room.status === 'in-progress'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 animate-pulse'
                            : room.status === 'completed'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40'
                        }`}
                      >
                        {room.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>{room.interviewerName || room.creatorName} & {room.candidateName || 'Candidate'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{room.durationMinutes} mins</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-cyan-400">
                        {room.problemIds?.length || 1} questions
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyRoomLink(room.id)}
                      className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                      title="Copy Shareable Link"
                    >
                      {copiedId === room.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      to={`/interviews/${room.id}`}
                      className="px-4 py-2 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Enter Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
              <Video className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm font-medium text-slate-300">No active interview rooms yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Configure your interview session parameters on the left to launch an interactive live coding room with video recording and sandboxed execution.
              </p>
            </div>
          )}

          {/* Feature Highlights Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-900/40 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
              <Shield className="w-4 h-4" />
              <span>Full Interview Suite Capabilities</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every live room features webcam & audio recording preview, Monaco code editor, live Wandbox cloud compiler, 2-3 question switcher, and instant post-interview performance analysis with circular radar charts & downloadable PDF report.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
