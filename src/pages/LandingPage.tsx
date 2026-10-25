import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Users, Sparkles, Code2, Cpu, CheckCircle2, ArrowRight, BookOpen, Layers } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next-Gen Full-Stack Coding & Interview Ecosystem</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
                Learn. Practice. Collaborate. <br />
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent">
                  Get Interview-Ready.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                PairArena AI unites collaborative live coding rooms, a high-performance multi-language compiler, structured DSA & GenAI tracks, and real-time Gemini AI tutoring into a single production workspace.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/interviews"
                  className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 group whitespace-nowrap shrink-0"
                >
                  <Users className="w-4 h-4" />
                  <span>Start Mock Interview</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/problems"
                  className="px-6 py-3 text-sm font-semibold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Explore Question Bank</span>
                </Link>

                <Link
                  to="/editor"
                  className="px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
                >
                  Open Online IDE
                </Link>
              </div>

              <div className="pt-6 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Real Sandboxed Compilation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Bi-directional Socket.IO</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Official Gemini Flash 3.8</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl shadow-indigo-950/50 group">
                <img
                  src="/src/assets/images/hero_collaboration_workspace_1792852526735.jpg"
                  alt="PairArena AI Collaborative Engineering Workspace"
                  className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-white">Live Session: Graph Algorithms</span>
                    <span className="font-mono text-cyan-400">Room #834-921</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>2 Engineers Syncing Live · Python 3.11</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 4-Column Metric Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">29+</div>
              <div className="text-xs text-slate-400 mt-1">Curated DSA & System Patterns</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">8</div>
              <div className="text-xs text-slate-400 mt-1">Sandboxed Compiler Languages</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">&lt;50ms</div>
              <div className="text-xs text-slate-400 mt-1">Socket Code Synchronization</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-indigo-400 tabular-nums">100%</div>
              <div className="text-xs text-slate-400 mt-1">Verified Test-Case Evaluation</div>
            </div>
          </div>

        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-indigo-400 mb-2">Platform Capabilities</h2>
            <p className="text-3xl font-bold text-white tracking-tight [text-wrap:balance]">
              Everything You Need to Ace Modern Engineering Interviews
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-colors space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Live Collaborative Interview Rooms</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Real-time synchronized Monaco Editor with Socket.IO, candidate presence, execution output streaming, interviewer score rubrics, and event timeline recording.
              </p>
              <Link to="/interviews" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                <span>Create Interview Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-colors space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Language Online Compiler</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Execute Python, JavaScript, TypeScript, C++, Java, and Go in an isolated sandbox. Includes custom standard input, execution timing, and detailed error tracebacks.
              </p>
              <Link to="/editor" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                <span>Launch IDE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-colors space-y-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Gemini 3.8 Arena AI Tutor</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Step-by-step intuition, code reviews, time/space complexity analysis, and on-demand quiz generation. Supports Beginner, Intermediate, and Advanced modes with Hinglish option.
              </p>
              <Link to="/ai-tutor" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300">
                <span>Ask Arena AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* Curriculum Tracks Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-xs uppercase font-semibold tracking-wider text-cyan-400 mb-2">Curriculum Pathways</h2>
              <p className="text-3xl font-bold text-white tracking-tight">Structured Technical Mastery</p>
            </div>
            <Link to="/learn" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>View All 6 Learning Tracks</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-600/50 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-mono text-cyan-400">Track 01</span>
                <span>29 Topics · 60h</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Data Structures & Algorithms</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                From Big-O analysis, sliding windows, and monotonic queues to binary search trees, topological sort, and 2D dynamic programming.
              </p>
              <Link to="/learn" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                Explore DSA Track →
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-600/50 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-mono text-cyan-400">Track 02</span>
                <span>14 Topics · 35h</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">GenAI, LLMs & Production RAG</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Vector embeddings, recursive chunking, cosine distance, cross-encoder reranking, tool use, and grounded hallucination mitigation.
              </p>
              <Link to="/learn" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                Explore GenAI Track →
              </Link>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-600/50 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-mono text-cyan-400">Track 03</span>
                <span>20 Topics · 50h</span>
              </div>
              <h4 className="text-lg font-bold text-white mb-2">High-Level & Low-Level System Design</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Distributed rate limiting with Redis & Lua, database sharding, CAP trade-offs, cache invalidation, and event-driven message buses.
              </p>
              <Link to="/learn" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                Explore System Design Track →
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-indigo-950/40 to-[#0B0F19] border-t border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Practice Real Problems and Host Mock Interviews?
          </h2>
          <p className="text-base text-slate-300 max-w-xl mx-auto">
            Create an account in 30 seconds or test any feature with full sandboxed execution immediately.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-3.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
            >
              Get Started for Free
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-3.5 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
