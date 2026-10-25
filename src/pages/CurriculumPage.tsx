import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { LearningTopic } from '../types';
import { BookOpen, Code2, Sparkles, Server, Layers, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';

export function CurriculumPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCurriculum() {
      try {
        const res = await apiRequest<{ tracks: any[]; availableTopics: LearningTopic[] }>('/learning-paths');
        setTracks(res.tracks || []);
        setTopics(res.availableTopics || []);
      } catch (err) {
        console.warn('Failed to load curriculum:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCurriculum();
  }, []);

  const trackIcons: Record<string, any> = {
    dsa: Code2,
    fullstack: Server,
    'ai-ml': Cpu,
    'genai-rag': Sparkles,
    'system-design': Layers,
    'cs-fundamentals': BookOpen,
  };

  const filteredTopics = selectedTrack === 'all'
    ? topics
    : topics.filter((t) => t.trackId === selectedTrack);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Technical Curriculum & Learning Paths</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Structured, interview-aligned pathways covering Data Structures, Full-Stack Architecture, Machine Learning, Production RAG, and System Design.
        </p>
      </div>

      {/* 6 Track Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tracks.map((track) => {
          const Icon = trackIcons[track.id] || BookOpen;
          const isSelected = selectedTrack === track.id;

          return (
            <div
              key={track.id}
              onClick={() => setSelectedTrack(selectedTrack === track.id ? 'all' : track.id)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-mono text-cyan-400">
                  {track.level}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{track.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{track.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>{track.topicsCount} Topics · {track.estHours} Hours</span>
                <span className="font-semibold text-indigo-400">{isSelected ? 'Showing' : 'Filter →'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Topics Detailed List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Available Topic Deep-Dives {selectedTrack !== 'all' ? `(${selectedTrack.toUpperCase()})` : ''}
          </h2>
          {selectedTrack !== 'all' && (
            <button
              onClick={() => setSelectedTrack('all')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Reset filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map((topic) => (
            <Link
              key={topic.id}
              to={`/learn/${topic.trackId}/${topic.slug}`}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-indigo-600/60 transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-mono text-[11px] capitalize">{topic.trackId.replace('-', ' ')}</span>
                <span className="text-slate-400 font-mono">{topic.estMinutes} min read</span>
              </div>

              <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                {topic.title}
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {topic.summary}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>Quiz included ({topic.quiz.length} Qs)</span>
                </div>
                <span className="text-indigo-400 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>Start Topic</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
