import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Github, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-[#070A11] text-slate-400 py-12 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">PairArena AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time collaborative interviews, multi-language compiler, structured DSA & GenAI tracks, and personalized Gemini tutoring.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/editor" className="hover:text-white transition-colors">Multi-Language Compiler</Link></li>
              <li><Link to="/problems" className="hover:text-white transition-colors">DSA Question Bank</Link></li>
              <li><Link to="/interviews" className="hover:text-white transition-colors">Live Interview Rooms</Link></li>
              <li><Link to="/assessments" className="hover:text-white transition-colors">Timed Assessments</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Curriculum</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/learn" className="hover:text-white transition-colors">Data Structures & Algorithms</Link></li>
              <li><Link to="/learn" className="hover:text-white transition-colors">GenAI, LLMs & Production RAG</Link></li>
              <li><Link to="/learn" className="hover:text-white transition-colors">High-Level System Design</Link></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">Curated Video Hub</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Account & Tools</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/revision" className="hover:text-white transition-colors">Spaced Repetition Flashcards</Link></li>
              <li><Link to="/reports" className="hover:text-white transition-colors">Downloadable PDF Reports</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">Performance Insights</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Integration Status</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PairArena AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Sandboxed Execution Guaranteed
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
