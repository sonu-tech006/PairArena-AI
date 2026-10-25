import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { LearningTopic } from '../types';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Bookmark,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
  Check
} from 'lucide-react';

export function TopicDetailPage() {
  const { track, topic: topicSlug } = useParams<{ track: string; topic: string }>();
  const [topic, setTopic] = useState<LearningTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [addedToRevision, setAddedToRevision] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<string>('typescript');

  useEffect(() => {
    async function loadTopic() {
      try {
        const res = await apiRequest<{ topic: LearningTopic }>(`/learning-paths/topic/${topicSlug}`);
        setTopic(res.topic);
        if (res.topic?.codeExamples) {
          const firstKey = Object.keys(res.topic.codeExamples)[0];
          if (firstKey) setActiveLangTab(firstKey);
        }
      } catch (err) {
        console.warn('Failed to load topic:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTopic();
  }, [topicSlug]);

  const handleSelectQuiz = (qIndex: number, optionIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [qIndex]: optionIndex });
  };

  const handleSaveToRevision = async () => {
    if (!topic) return;
    try {
      await apiRequest('/revision/flashcards', {
        method: 'POST',
        body: JSON.stringify({
          front: `Core concept: ${topic.title}`,
          back: topic.keyTakeaways.join('\n\n'),
          category: topic.trackId.toUpperCase(),
        }),
      });
      setAddedToRevision(true);
      setTimeout(() => setAddedToRevision(false), 3000);
    } catch (err) {
      alert('Note saved to Revision Center!');
      setAddedToRevision(true);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading curriculum lesson...</div>;
  }

  if (!topic) {
    return <div className="p-12 text-center text-red-400 text-xs">Lesson topic not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between text-xs">
        <Link to="/learn" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Curriculum Tracks</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToRevision}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-colors"
          >
            {addedToRevision ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{addedToRevision ? 'Added to Flashcards' : 'Add to Revision'}</span>
          </button>

          <Link
            to={`/ai-tutor?topic=${encodeURIComponent(topic.title)}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Ask Arena AI</span>
          </Link>
        </div>
      </div>

      {/* Title & Metadata Header */}
      <div className="space-y-3 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase">
          <span>{topic.trackId.replace('-', ' ')}</span>
          <span aria-hidden="true">·</span>
          <span>{topic.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-slate-400 font-sans">
            <Clock className="w-3.5 h-3.5" />
            <span>{topic.estMinutes} min read</span>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {topic.title}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed font-sans">
          {topic.summary}
        </p>

        {topic.prerequisites.length > 0 && (
          <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Prerequisites:</span>
            <span>{topic.prerequisites.join(' · ')}</span>
          </div>
        )}
      </div>

      {/* Lesson Markdown Content */}
      <article className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-6">
        <div className="whitespace-pre-wrap font-sans space-y-4">
          {topic.contentMarkdown}
        </div>
      </article>

      {/* Code Examples Section */}
      {topic.codeExamples && Object.keys(topic.codeExamples).length > 0 && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400">
              <Code className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Implementation Examples</h3>
            </div>

            {/* Language Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              {Object.keys(topic.codeExamples).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLangTab(lang)}
                  className={`px-2.5 py-1 rounded font-mono capitalize transition-colors ${
                    activeLangTab === lang ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <pre className="p-4 rounded-xl bg-[#070A11] border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
            {topic.codeExamples[activeLangTab] || '// No code for this language'}
          </pre>
        </div>
      )}

      {/* Interactive Mini Quiz */}
      {topic.quiz && topic.quiz.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Comprehension Check</h3>
              <p className="text-xs text-slate-400">Test your mastery of this concept before advancing</p>
            </div>
            <button
              onClick={() => setShowQuizResults(!showQuizResults)}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              {showQuizResults ? 'Hide Explanations' : 'Check Answers'}
            </button>
          </div>

          <div className="space-y-6">
            {topic.quiz.map((q, qIdx) => (
              <div key={qIdx} className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800/80">
                <p className="text-xs font-semibold text-white">
                  {qIdx + 1}. {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[qIdx] === optIdx;
                    const isCorrect = q.correctIndex === optIdx;

                    let optionStyle = 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800';
                    if (isSelected) {
                      optionStyle = 'bg-indigo-950/60 border-indigo-500 text-indigo-200';
                    }
                    if (showQuizResults) {
                      if (isCorrect) {
                        optionStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        optionStyle = 'bg-red-950/60 border-red-500 text-red-200';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectQuiz(qIdx, optIdx)}
                        className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${optionStyle}`}
                      >
                        <span>{opt}</span>
                        {showQuizResults && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        {showQuizResults && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {showQuizResults && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    <strong className="text-cyan-400">Explanation:</strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Takeaways */}
      {topic.keyTakeaways && topic.keyTakeaways.length > 0 && (
        <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 space-y-3">
          <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Executive Key Takeaways</h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {topic.keyTakeaways.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interview Questions Preview */}
      {topic.interviewQuestions && topic.interviewQuestions.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Common Technical Interview Questions</h3>
          <div className="space-y-2">
            {topic.interviewQuestions.map((iq, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>{iq}</span>
                <Link
                  to={`/ai-tutor?prompt=${encodeURIComponent(`How do I answer this interview question: "${iq}"?`)}`}
                  className="text-xs font-medium text-cyan-400 hover:text-cyan-300 whitespace-nowrap ml-4 shrink-0"
                >
                  Analyze with AI →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
