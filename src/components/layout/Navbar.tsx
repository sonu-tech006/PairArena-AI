import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Terminal, Code, Users, BookOpen, Sparkles, ChevronDown, LogOut, User as UserIcon, LayoutDashboard, Bookmark, BarChart2, Shield } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Editor', path: '/editor' },
    { label: 'Practice', path: '/problems' },
    { label: 'Interviews', path: '/interviews' },
    { label: 'Curriculum', path: '/learn' },
    { label: 'AI Tutor', path: '/ai-tutor' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-sans font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            PairArena AI
          </span>
        </Link>

        {/* Zone 2: 4-6 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
                  isActive
                    ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                    : 'hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action / User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium text-white transition-all whitespace-nowrap shrink-0"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="max-w-[120px] truncate text-slate-200">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 text-sm text-slate-200"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="font-semibold text-white truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[11px] uppercase tracking-wider text-cyan-400 font-mono font-medium">
                      {user.role}
                    </span>
                  </div>

                  <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white">
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    Dashboard
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Profile & Goals
                  </Link>
                  <Link to="/revision" className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white">
                    <Bookmark className="w-4 h-4 text-slate-400" />
                    Revision Center
                  </Link>
                  <Link to="/analytics" className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white">
                    <BarChart2 className="w-4 h-4 text-slate-400" />
                    Performance Analytics
                  </Link>
                  <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-800 text-slate-300 hover:text-white">
                    <Shield className="w-4 h-4 text-slate-400" />
                    Admin Status
                  </Link>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
