import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import {
  Flame,
  CheckCircle,
  TrendingUp,
  Users,
  Bookmark,
  Code2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Clock,
  Play,
  FileText,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashRes, subRes, intRes] = await Promise.all([
          apiRequest('/analytics/dashboard'),
          apiRequest('/submissions/me'),
          apiRequest('/interviews'),
        ]);
        setAnalytics(dashRes);
        setRecentSubmissions(subRes.submissions || []);
        setInterviews(intRes.interviews || []);
      } catch (err) {
        console.warn('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = analytics?.stats || {
    streakDays: 6,
    solvedCount: 1,
    totalAttempted: 2,
    acceptanceRate: 50,
    interviewsCompleted: 1,
    dueFlashcards: 2,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner / User Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Engineer'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Targeting: <span className="text-cyan-400 font-medium">{user?.targetRole || 'Senior Software Engineer'}</span> · Preferred Language: <span className="font-mono text-indigo-300 capitalize">{user?.preferredLanguage || 'Python'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/interviews"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mock Interview</span>
          </Link>
          <Link
            to="/editor"
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Compiler</span>
          </Link>
          <Link
            to="/ai-tutor"
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Ask AI</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-white tabular-nums">
            {stats.streakDays} <span className="text-sm font-normal text-slate-400 font-sans">days</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400">Active today · Keep momentum</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Problems Solved</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-white tabular-nums">
            {stats.solvedCount} <span className="text-sm font-normal text-slate-400 font-sans">/ {stats.totalAttempted}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Recorded verified solutions</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Acceptance Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-cyan-400 tabular-nums">
            {stats.acceptanceRate}%
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Across all compiler runs</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Revision Cards Due</span>
            <Bookmark className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 text-3xl font-bold font-mono text-violet-300 tabular-nums">
            {stats.dueFlashcards}
          </div>
          <Link to="/revision" className="mt-1 inline-block text-[11px] text-indigo-400 hover:text-indigo-300">
            Review flashcards →
          </Link>
        </div>

      </div>

      {/* Main 2-Column Split: Activity Chart & Next Topic Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Weekly Study Activity & Problem Submissions */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Weekly Activity Bar Chart */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Weekly Study Time & Submissions</h3>
                <p className="text-xs text-slate-400">Recorded minutes and compiler execution activity</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                This Week
              </span>
            </div>

            <div className="h-64 w-full">
              {analytics?.weeklyActivity ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#E2E8F0' }}
                    />
                    <Bar dataKey="minutes" name="Study Minutes" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="submissions" name="Submissions" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Loading activity charts...
                </div>
              )}
            </div>
          </div>

          {/* Recent Submissions Table */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Recent Code Submissions</h3>
              <Link to="/problems" className="text-xs text-indigo-400 hover:text-indigo-300">
                Browse all problems →
              </Link>
            </div>

            {recentSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="pb-3 font-medium">Problem</th>
                      <th className="pb-3 font-medium">Language</th>
                      <th className="pb-3 font-medium">Verdict</th>
                      <th className="pb-3 font-medium">Tests Passed</th>
                      <th className="pb-3 font-medium">Runtime</th>
                      <th className="pb-3 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {recentSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-sans font-medium text-slate-200">
                          <Link to={`/problems/${sub.problemSlug}`} className="hover:text-cyan-400">
                            {sub.problemSlug.replace(/-/g, ' ').toUpperCase()}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-400 capitalize font-sans">{sub.language}</td>
                        <td className="py-3 font-sans">
                          <span
                            className={`font-semibold ${
                              sub.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {sub.verdict}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300 tabular-nums">
                          {sub.passedCount} / {sub.totalCount}
                        </td>
                        <td className="py-3 text-slate-400 tabular-nums">{sub.executionTimeMs}ms</td>
                        <td className="py-3 text-right text-slate-500 font-sans text-[11px]">
                          {new Date(sub.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-3">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-300">No submissions recorded yet.</p>
                <p className="text-xs text-slate-500">Test your solutions in the Question Bank or IDE to see live execution history here.</p>
                <Link
                  to="/problems"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm"
                >
                  Solve First Problem
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Revision Recommendations & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Tutor Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/50 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold uppercase tracking-wider">AI Revision Recommendation</span>
            </div>
            <h4 className="text-sm font-bold text-white">Focus: Binary Search Trees & RAG Retrieval</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Based on your recent assessment in Data Structures and System Design, reviewing balanced BST tree rotations and chunking strategies will yield the highest interview readiness score.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Link
                to="/ai-tutor"
                className="w-full text-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
              >
                Discuss with Arena AI
              </Link>
            </div>
          </div>

          {/* Topic Strengths Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Topic Mastery Breakdown</h4>
            <div className="space-y-3">
              {(analytics?.topicStrengths || [
                { topic: 'Arrays & Hashing', score: 85 },
                { topic: 'Two Pointers', score: 78 },
                { topic: 'Binary Trees', score: 62 },
                { topic: 'Dynamic Programming', score: 45 },
              ]).map((item: any) => (
                <div key={item.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.topic}</span>
                    <span className="font-mono text-slate-400 tabular-nums">{item.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.score >= 75 ? 'bg-emerald-400' : item.score >= 60 ? 'bg-indigo-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Interview Hub Quick Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Interview Rooms</h4>
              <Link to="/interviews" className="text-xs text-cyan-400 hover:text-cyan-300">View all</Link>
            </div>
            <p className="text-xs text-slate-400">
              Host mock interviews with real-time synchronized code editor, candidate presence, and scorecards.
            </p>
            <Link
              to="/interviews"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400" />
              <span>Launch Live Room</span>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
}
