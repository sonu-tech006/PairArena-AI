import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';
import { Flashcard, UserNote } from '../types';
import {
  Bookmark,
  Clock,
  CheckCircle2,
  Plus,
  RotateCw,
  Search,
  BookOpen,
  Sparkles,
  FileText,
  Star,
  ChevronRight
} from 'lucide-react';

export function RevisionPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'notes'>('cards');
  const [search, setSearch] = useState('');

  // Flashcard Review Flow State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newCategory, setNewCategory] = useState('DSA');

  useEffect(() => {
    async function loadRevisionData() {
      try {
        const [cardRes, noteRes] = await Promise.all([
          apiRequest<{ flashcards: Flashcard[] }>('/revision/flashcards'),
          apiRequest<{ notes: UserNote[] }>('/revision/notes'),
        ]);
        setFlashcards(cardRes.flashcards || []);
        setNotes(noteRes.notes || []);
      } catch (err) {
        console.warn('Failed to load revision data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRevisionData();
  }, []);

  const handleRateConfidence = async (confidence: number) => {
    const card = flashcards[currentCardIndex];
    if (!card) return;

    try {
      const res = await apiRequest<{ flashcard: Flashcard }>(`/revision/flashcards/${card.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ confidence }),
      });

      const updated = [...flashcards];
      updated[currentCardIndex] = res.flashcard;
      setFlashcards(updated);

      // Move to next card
      setIsFlipped(false);
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        alert('You have completed your review queue for today! Great job.');
        setCurrentCardIndex(0);
      }
    } catch (err: any) {
      alert(`Error updating confidence: ${err.message}`);
    }
  };

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    try {
      const res = await apiRequest<{ flashcard: Flashcard }>('/revision/flashcards', {
        method: 'POST',
        body: JSON.stringify({
          front: newFront.trim(),
          back: newBack.trim(),
          category: newCategory,
        }),
      });
      setFlashcards([res.flashcard, ...flashcards]);
      setNewFront('');
      setNewBack('');
      setIsCreatingCard(false);
    } catch (err: any) {
      alert(`Error creating flashcard: ${err.message}`);
    }
  };

  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Personalized Revision Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Spaced-repetition flashcards, core interview cheatsheets, and personalized topic retention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingCard(!isCreatingCard)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Flashcard</span>
          </button>
        </div>
      </div>

      {/* Create Card Modal/Drawer */}
      {isCreatingCard && (
        <form onSubmit={handleCreateFlashcard} className="p-6 rounded-2xl bg-slate-900 border border-indigo-700/60 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white">Create New Spaced-Repetition Card</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Front (Prompt / Question)</label>
              <textarea
                rows={3}
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                placeholder="e.g. What is the time complexity of building an unweighted graph?"
                className="w-full bg-[#070A11] border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Back (Answer / Intuition)</label>
              <textarea
                rows={3}
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                placeholder="e.g. O(V + E) time, allocating O(V + E) space."
                className="w-full bg-[#070A11] border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
            >
              <option value="DSA">Data Structures & Algorithms</option>
              <option value="SYSTEM DESIGN">System Design</option>
              <option value="GENAI & RAG">GenAI & RAG</option>
              <option value="SECURITY">Security & Auth</option>
            </select>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingCard(false)}
                className="px-3 py-1.5 rounded text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-white"
              >
                Save Card
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Sub-Tabs: Flashcard Review vs Notes */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('cards')}
          className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Spaced Repetition Review ({flashcards.length})
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'notes' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Saved Notes & Cheatsheets ({notes.length})
        </button>
      </div>

      {activeTab === 'cards' ? (
        <div className="space-y-6">
          {currentCard ? (
            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* Card Meta & Count */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-cyan-400 uppercase tracking-wider">{currentCard.category}</span>
                <span className="font-mono">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
              </div>

              {/* Interactive Flip Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="min-h-[260px] p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0F172A] border border-slate-700/80 hover:border-indigo-500/60 transition-all cursor-pointer shadow-2xl flex flex-col justify-between select-none"
              >
                <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  {isFlipped ? 'Answer & Core Principle' : 'Prompt / Concept Question'}
                </div>

                <div className="text-base sm:text-lg font-medium text-white text-center py-6 whitespace-pre-wrap leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </div>

                <div className="text-center text-[11px] text-slate-500">
                  (Click card to {isFlipped ? 'view front' : 'reveal answer'})
                </div>
              </div>

              {/* Confidence Rating Buttons (Revealed when flipped) */}
              {isFlipped && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-center">
                  <p className="text-xs text-slate-300 font-medium">How confident were you with this answer?</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => handleRateConfidence(1)}
                      className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-800/40 text-red-300 text-xs hover:bg-red-900/60"
                    >
                      1 · Completely Forgot
                    </button>
                    <button
                      onClick={() => handleRateConfidence(3)}
                      className="px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs hover:bg-amber-900/60"
                    >
                      3 · Hesitant / Partial
                    </button>
                    <button
                      onClick={() => handleRateConfidence(5)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs hover:bg-emerald-900/60"
                    >
                      5 · Perfect Mastery
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No flashcards in your deck. Create one above or complete a curriculum lesson to auto-populate cards.
            </div>
          )}
        </div>
      ) : (
        /* Saved Notes Section */
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white text-base">{note.title}</span>
                <span className="text-slate-500 font-mono text-[11px]">{new Date(note.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-[#070A11] p-4 rounded-xl border border-slate-800 leading-relaxed">
                {note.content}
              </div>
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                <span className="text-indigo-400 font-semibold">{note.category}</span>
                {note.tags.map((t) => (
                  <span key={t} className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">#{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
