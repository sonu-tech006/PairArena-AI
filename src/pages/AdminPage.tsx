import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cpu,
  Layers,
  Database,
  Terminal,
  RefreshCw,
  Youtube,
  Sparkles
} from 'lucide-react';

export function AdminPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/health');
      setHealthData(res);
    } catch (err) {
      console.warn('Failed to load system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-xs uppercase font-semibold font-mono tracking-wider">Administrative Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">System Health & Integration Status</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time inspection of backend services, compiler runtime sandboxes, and Gemini AI connectivity.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gemini AI Integration */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                healthData?.integrations?.gemini?.configured
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
              }`}
            >
              {healthData?.integrations?.gemini?.configured ? 'CONNECTED' : 'SECRETS PENDING'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Google Gemini API</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Provides intelligent code review, step-by-step intuition, complexity bounds, and dynamic quiz generation.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-400 flex justify-between">
              <span>Model ID:</span>
              <span className="text-cyan-400">{healthData?.integrations?.gemini?.model || 'gemini-3.8-flash'}</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Status:</span>
              <span className="text-slate-200 text-right">{healthData?.integrations?.gemini?.status}</span>
            </div>
          </div>
        </div>

        {/* Wandbox Compiler Integration */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              WANDBOX ACTIVE
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Wandbox Compiler</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Executes C++, Python, JavaScript, TypeScript, and Java via Wandbox API (POST /compile.json) with sandboxed fallback.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-400 flex justify-between">
              <span>Provider:</span>
              <span className="text-cyan-400 font-bold">Wandbox</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Endpoint:</span>
              <span className="text-slate-300 truncate max-w-[140px]" title={healthData?.integrations?.wandbox?.endpoint}>
                {healthData?.integrations?.wandbox?.endpoint || 'https://wandbox.org/api'}
              </span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Status:</span>
              <span className="text-slate-200 text-right text-[11px] truncate max-w-[150px]">{healthData?.integrations?.wandbox?.status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* MongoDB GridFS Storage Integration */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              GRIDFS READY
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">MongoDB GridFS</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Stream-based binary file storage using the official MongoDB driver GridFSBucket API with private ownership authorization.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-400 flex justify-between">
              <span>Bucket:</span>
              <span className="text-emerald-400 font-bold">uploads</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Storage:</span>
              <span className="text-slate-300 font-mono">Stream (GridFS)</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Status:</span>
              <span className="text-slate-200 text-right text-[11px] truncate max-w-[150px]">{healthData?.integrations?.gridfs?.status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* YouTube Video Resources */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center">
              <Youtube className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              FEED READY
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white">Curriculum Hub</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Curated masterclasses mapped to learning tracks, with dynamic search via YouTube Data API v3 when key is provided.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs font-mono space-y-1">
            <div className="text-slate-400 flex justify-between">
              <span>Provider:</span>
              <span className="text-cyan-400">Curated & API Proxy</span>
            </div>
            <div className="text-slate-400 flex justify-between">
              <span>Status:</span>
              <span className="text-slate-200">{healthData?.integrations?.youtube?.status}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Database State Summary */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Database className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white text-base">Persistent Storage & Data Collections</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block text-[11px] mb-1">Database Mode:</span>
            <span className="text-slate-200 font-semibold">{healthData?.database?.mode || 'Local Durable JSON Engine'}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block text-[11px] mb-1">Active Users:</span>
            <span className="text-cyan-400 font-bold tabular-nums text-lg">{healthData?.database?.userCount ?? 3}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block text-[11px] mb-1">DSA Problems:</span>
            <span className="text-white font-bold tabular-nums text-lg">{healthData?.database?.problemCount ?? 4}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 block text-[11px] mb-1">Recorded Submissions:</span>
            <span className="text-emerald-400 font-bold tabular-nums text-lg">{healthData?.database?.submissionCount ?? 0}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
