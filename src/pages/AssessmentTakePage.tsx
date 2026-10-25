import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api/client';
import { Assessment } from '../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  FileText,
  RotateCcw
} from 'lucide-react';

export function AssessmentTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTest() {
      try {
        const res = await apiRequest<{ assessment: Assessment }>(`/assessments/${id}`);
        setAssessment(res.assessment);
        setTimeLeft(res.assessment.durationMinutes * 60);
      } catch (err) {
        console.warn('Failed to load assessment:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [id]);

  // Countdown timer & Auto-submit
  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted, answers]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async () => {
    if (isSubmitted || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest(`/assessments/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          answers,
          timeSpentMinutes: Math.round(((assessment?.durationMinutes || 30) * 60 - timeLeft) / 60),
        }),
      });
      setResults(res);
      setIsSubmitted(true);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading assessment environment...</div>;
  }

  if (!assessment || !assessment.questions) {
    return <div className="p-12 text-center text-red-400 text-xs">Assessment questions not found.</div>;
  }

  const questions = assessment.questions;
  const currentQ = questions[currentQIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header: Title & Countdown */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <Link to="/assessments" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Assessments</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">{assessment.title}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{assessment.track} · {questions.length} Questions</p>
        </div>

        {!isSubmitted && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-bold text-base text-white tabular-nums">
              {formatTimer(timeLeft)}
            </span>
          </div>
        )}
      </div>

      {!isSubmitted ? (
        /* Test Taking Interface */
        <div className="space-y-6">
          
          {/* Question Index Progress Stepper */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
              const isCurrent = idx === currentQIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isAnswered
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Active Question Card */}
          {currentQ && (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Question {currentQIndex + 1} of {questions.length}
              </div>

              <h2 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {currentQ.prompt}
              </h2>

              <div className="space-y-3 pt-2">
                {currentQ.options?.map((opt, optIdx) => {
                  const isSelected = answers[currentQ.id] === opt;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500 text-white font-medium shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{opt}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>

                {currentQIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Scoring Answers...' : 'Submit Assessment'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Result Scorecard & Answer Review */
        <div className="space-y-8">
          
          {/* Big Score Card */}
          <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/60 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-cyan-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <div className="text-4xl sm:text-5xl font-extrabold font-mono text-white tabular-nums">
                {results?.scorePercentage}%
              </div>
              <p className="text-sm text-slate-300 font-medium mt-1">
                {results?.correctCount} out of {results?.totalQuestions} questions answered correctly
              </p>
            </div>

            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {results?.feedback}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/reports"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>View Downloadable PDF Report</span>
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Assessment</span>
              </button>
            </div>
          </div>

          {/* Answer Breakdown with Explanations */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Detailed Answer Review</h3>
            {results?.reviewQuestions?.map((rq: any, idx: number) => (
              <div
                key={rq.id}
                className={`p-6 rounded-2xl border space-y-3 text-xs ${
                  rq.isCorrect
                    ? 'bg-slate-900/60 border-slate-800'
                    : 'bg-red-950/20 border-red-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold text-white text-sm">
                    {idx + 1}. {rq.prompt}
                  </p>
                  {rq.isCorrect ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 font-semibold shrink-0">
                      <XCircle className="w-4 h-4" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[11px] mb-0.5">Your Answer:</span>
                    <span className={rq.isCorrect ? 'text-emerald-300 font-medium' : 'text-red-300'}>
                      {rq.userAnswer || '(No answer provided)'}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[11px] mb-0.5">Correct Answer:</span>
                    <span className="text-emerald-400 font-medium">{rq.correctAnswer}</span>
                  </div>
                </div>

                {rq.explanation && (
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-slate-300 text-[11px] leading-relaxed">
                    <strong className="text-cyan-400">Explanation:</strong> {rq.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
