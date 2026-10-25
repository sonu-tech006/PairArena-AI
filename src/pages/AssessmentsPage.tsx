import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { Assessment } from '../types';
import { Award, Clock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssessments() {
      try {
        const res = await apiRequest<{ assessments: Assessment[] }>('/assessments');
        setAssessments(res.assessments || []);
      } catch (err) {
        console.warn('Failed to load assessments:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAssessments();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Technical Assessments & Mock Benchmarks</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Timed evaluations with rigorous scoring, comprehensive answer reviews, and downloadable PDF performance reports.
        </p>
      </div>

      {/* Assessment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assessments.map((test) => (
          <div
            key={test.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 uppercase tracking-wider">{test.track}</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded ${
                    test.difficulty === 'Easy'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                      : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                  }`}
                >
                  {test.difficulty}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">{test.title}</h3>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{test.durationMinutes} Minutes</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{test.questionCount} Questions</span>
                <span aria-hidden="true">·</span>
                <span>Auto-grading Enabled</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">Official Certification Ready</span>
              <Link
                to={`/assessments/${test.id}`}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
