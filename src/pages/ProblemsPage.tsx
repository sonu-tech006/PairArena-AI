import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { Problem } from '../types';
import { Search, CheckCircle, Code, Filter, Sparkles, ArrowRight, Tag } from 'lucide-react';

export function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    async function loadProblems() {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (difficulty !== 'all') queryParams.set('difficulty', difficulty);
        if (category !== 'all') queryParams.set('category', category);

        const res = await apiRequest<{ problems: Problem[] }>(`/problems?${queryParams.toString()}`);
        setProblems(res.problems || []);
      } catch (err) {
        console.warn('Error fetching problems:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProblems();
  }, [search, difficulty, category]);

  const categories = ['Arrays & Hashing', 'Two Pointers', 'Stacks & Queues', 'Dynamic Programming', 'System Design & DSA'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">DSA Question Bank</h1>
          <p className="text-sm text-slate-400 mt-1">
            Curated technical interview problems with verified test suites and multi-language templates.
          </p>
        </div>

        <Link
          to="/editor"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm whitespace-nowrap shrink-0"
        >
          <Code className="w-4 h-4" />
          <span>Open Scratchpad Compiler</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, tag, or concept..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto text-xs">
          
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

        </div>

      </div>

      {/* Problem Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-semibold w-12 text-center">Status</th>
              <th className="py-3.5 px-4 font-semibold">Title</th>
              <th className="py-3.5 px-4 font-semibold">Category</th>
              <th className="py-3.5 px-4 font-semibold">Difficulty</th>
              <th className="py-3.5 px-4 font-semibold">Acceptance</th>
              <th className="py-3.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {problems.map((problem) => (
              <tr key={problem.id} className="hover:bg-slate-800/30 transition-colors">
                
                {/* Solved Status */}
                <td className="py-4 px-4 text-center">
                  {problem.isSolved ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-700 mx-auto" />
                  )}
                </td>

                {/* Title & Tags */}
                <td className="py-4 px-4">
                  <div className="space-y-1">
                    <Link
                      to={`/problems/${problem.slug}`}
                      className="font-medium text-slate-100 hover:text-cyan-400 text-sm transition-colors"
                    >
                      {problem.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      {problem.tags.slice(0, 3).map((tag, idx) => (
                        <React.Fragment key={tag}>
                          {idx > 0 && <span aria-hidden="true">·</span>}
                          <span>{tag}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="py-4 px-4 text-slate-300 font-medium">
                  {problem.category}
                </td>

                {/* Difficulty */}
                <td className="py-4 px-4 font-semibold">
                  <span
                    className={
                      problem.difficulty === 'Easy'
                        ? 'text-emerald-400'
                        : problem.difficulty === 'Medium'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }
                  >
                    {problem.difficulty}
                  </span>
                </td>

                {/* Acceptance Rate */}
                <td className="py-4 px-4 font-mono text-slate-400 tabular-nums">
                  {problem.acceptanceRate ? `${problem.acceptanceRate}%` : '48%'}
                </td>

                {/* Action Link */}
                <td className="py-4 px-4 text-right">
                  <Link
                    to={`/problems/${problem.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    <span>Solve</span>
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                  </Link>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {problems.length === 0 && !loading && (
          <div className="p-12 text-center text-slate-500 text-xs">
            No problems match your current search and filter criteria.
          </div>
        )}
      </div>

    </div>
  );
}
