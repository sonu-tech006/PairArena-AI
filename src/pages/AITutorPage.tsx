import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api/client';
import {
  Sparkles,
  Send,
  Code,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Cpu,
  Terminal,
  Layers,
  MessageSquare,
  Bookmark
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function AITutorPage() {
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || (searchParams.get('topic') ? `Can you explain the key concepts, intuition, and Big-O bounds of ${searchParams.get('topic')}?` : '');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am **Arena AI**, your personal engineering coach and technical interview mentor.

I can help you with:
- **DSA & Algorithmic Patterns**: Two Pointers, Monotonic Queues, Segment Trees, 2D Dynamic Programming.
- **System Design**: Distributed Rate Limiters, Consistent Hashing, Cache Invalidation, Database Sharding.
- **GenAI & RAG Architectures**: Embeddings, Cross-Encoder Reranking, Vector DBs, Tool Use.
- **Code Reviews & Debugging**: Paste any snippet or compiler error for an instant root-cause analysis.

How can I help you prepare today?`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [explanationMode, setExplanationMode] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [languagePreference, setLanguagePreference] = useState<'english' | 'hinglish'>('english');
  const [codeContext, setCodeContext] = useState('');
  const [showCodeContextDrawer, setShowCodeContextDrawer] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const res = await apiRequest<{ reply: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          prompt: userText,
          history,
          mode: explanationMode,
          language: languagePreference,
          codeContext: codeContext || undefined,
        }),
      });

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to receive response: ${err.message}. Please check your connection or quota.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    setInput(promptText);
  };

  const handleClearHistory = () => {
    setMessages([messages[0]]);
  };

  const copyMessage = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-4rem)] flex flex-col gap-4">
      
      {/* Top Controls Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
        
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">Arena AI Coding Coach</h1>
            <p className="text-[11px] text-slate-400">Powered by server-side Gemini 3.8 Flash</p>
          </div>
        </div>

        {/* Configuration Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Explanation Mode */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Depth:</span>
            <select
              value={explanationMode}
              onChange={(e: any) => setExplanationMode(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 cursor-pointer"
            >
              <option value="beginner">Beginner (Intuition & Analogies)</option>
              <option value="intermediate">Intermediate (Interview Standard)</option>
              <option value="advanced">Advanced (Deep Architecture)</option>
            </select>
          </div>

          {/* Language Preference */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Language:</span>
            <select
              value={languagePreference}
              onChange={(e: any) => setLanguagePreference(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 cursor-pointer"
            >
              <option value="english">English</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>

          <button
            onClick={() => setShowCodeContextDrawer(!showCodeContextDrawer)}
            className={`px-3 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
              showCodeContextDrawer || codeContext
                ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-cyan-400" />
            <span>{codeContext ? 'Active Code Attached' : 'Attach Code'}</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

        </div>

      </div>

      {/* Code Context Drawer (if toggled) */}
      {showCodeContextDrawer && (
        <div className="p-4 rounded-xl bg-slate-900 border border-indigo-800/60 space-y-2 shrink-0 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Paste Active Code Snippet or Error Trace:</span>
            <button
              onClick={() => setCodeContext('')}
              className="text-slate-400 hover:text-white text-[11px]"
            >
              Clear Code
            </button>
          </div>
          <textarea
            rows={4}
            value={codeContext}
            onChange={(e) => setCodeContext(e.target.value)}
            placeholder="Paste your function, class, or stack trace here so Arena AI can directly reference it..."
            className="w-full bg-[#070A11] border border-slate-800 rounded-lg p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-slate-900/40 border border-slate-800 p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-[#0F172A] border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {msg.content}
                </div>

                {!isUser && (
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button
                      onClick={() => copyMessage(idx, msg.content)}
                      className="flex items-center gap-1 hover:text-slate-300"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3 text-cyan-400 text-xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
            </div>
            <span className="animate-pulse">Arena AI is formulating step-by-step technical response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs shrink-0">
        <span className="text-slate-500 text-[11px] whitespace-nowrap">Suggested:</span>
        <button
          onClick={() => handleQuickPrompt('Explain LRU Cache Doubly Linked List approach with Big-O')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
        >
          LRU Cache O(1)
        </button>
        <button
          onClick={() => handleQuickPrompt('Explain Token Bucket vs Leaky Bucket for Distributed Rate Limiter')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
        >
          Rate Limiter Algorithms
        </button>
        <button
          onClick={() => handleQuickPrompt('How does Cross-Encoder Reranking improve RAG retrieval accuracy?')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
        >
          RAG Reranking
        </button>
        <button
          onClick={() => handleQuickPrompt('Generate a 3-question quiz on Dynamic Programming')}
          className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap"
        >
          Generate Quiz
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="relative shrink-0">
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask Arena AI any question about DSA, System Design, RAG, or paste your code... (Shift+Enter for new line)"
          className="w-full bg-[#0F172A] border border-slate-700 rounded-xl pl-4 pr-14 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none shadow-xl"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-3 top-3.5 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
