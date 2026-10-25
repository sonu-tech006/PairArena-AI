import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import {
  Search,
  Play,
  ExternalLink,
  BookOpen,
  Sparkles,
  Info,
  Youtube
} from 'lucide-react';

export function ResourcesPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchVideos = async (searchQuery: string, track: string) => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (searchQuery) qParams.set('query', searchQuery);
      if (track !== 'all') qParams.set('track', track);

      const res = await apiRequest<{ videos: any[]; notice?: string }>(`/resources/youtube?${qParams.toString()}`);
      setVideos(res.videos || []);
      setNotice(res.notice || null);
    } catch (err) {
      console.warn('Error fetching video resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(query, selectedTrack);
  }, [selectedTrack]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos(query, selectedTrack);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Technical Video Learning Hub</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Curated masterclasses and YouTube recommendations for Data Structures, Production RAG, System Design, and Engineering Interviews.
        </p>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search and Track Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tutorials, algorithms, system design..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto text-xs w-full md:w-auto">
          {['all', 'dsa', 'system-design', 'genai-rag'].map((tr) => (
            <button
              key={tr}
              onClick={() => setSelectedTrack(tr)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedTrack === tr
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tr === 'all' ? 'All Masterclasses' : tr.toUpperCase().replace('-', ' ')}
            </button>
          ))}
        </div>

      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((vid) => (
          <div
            key={vid.id}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors flex flex-col justify-between group"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <a
                  href={vid.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                </a>
              </div>

              {/* Video Info */}
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  <span className="font-semibold text-slate-300">{vid.channel}</span>
                </div>

                <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-cyan-400 transition-colors">
                  {vid.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {vid.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                {vid.category || 'Tutorial'}
              </span>
              <a
                href={vid.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <span>Watch on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
