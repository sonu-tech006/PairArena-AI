import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { apiRequest } from '../api/client';
import { Problem, Submission } from '../types';
import {
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Terminal,
  ArrowLeft
} from 'lucide-react';

export function ProblemDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>('');
  const [activeLeftTab, setActiveLeftTab] = useState<'description' | 'hints' | 'solution' | 'ai'>('description');
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Execution & Submission State
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);

  useEffect(() => {
    async function loadProblem() {
      try {
        const res = await apiRequest<{ problem: Problem }>(`/problems/${slug}`);
        setProblem(res.problem);
        const starter = res.problem.starterTemplates?.[language] || '# Write code here\n';
        setCode(starter);
      } catch (err) {
        console.warn('Failed to load problem:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
  }, [slug]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (problem?.starterTemplates?.[newLang]) {
      setCode(problem.starterTemplates[newLang]);
    }
  };

  const toggleHint = (idx: number) => {
    if (revealedHints.includes(idx)) {
      setRevealedHints(revealedHints.filter((h) => h !== idx));
    } else {
      setRevealedHints([...revealedHints, idx]);
    }
  };

  const handleRunTest = async () => {
    if (!problem) return;
    setIsRunning(true);
    setExecutionResult(null);
    setSubmissionResult(null);

    const firstTestCase = problem.testCases[0];
    try {
      const res = await apiRequest('/compiler/run', {
        method: 'POST',
        body: JSON.stringify({
          language,
          code,
          stdin: firstTestCase?.input || '',
        }),
      });
      setExecutionResult({
        ...res,
        input: firstTestCase?.input,
        expected: firstTestCase?.expectedOutput,
      });
    } catch (err: any) {
      setExecutionResult({
        stderr: err.message || 'Execution error',
        verdict: 'Runtime Error',
        executionTimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setExecutionResult(null);
    setSubmissionResult(null);

    try {
      const res = await apiRequest<{ submission: Submission }>('/submissions/submit', {
        method: 'POST',
        body: JSON.stringify({
          problemId: problem.id,
          language,
          code,
        }),
      });
      setSubmissionResult(res.submission);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskAIExplanation = async () => {
    if (!problem) return;
    setActiveLeftTab('ai');
    setAiLoading(true);
    try {
      const res = await apiRequest<{ explanation: string }>('/ai/explain', {
        method: 'POST',
        body: JSON.stringify({
          code,
          language,
          prompt: `Explain how to solve "${problem.title}". Constraints: ${problem.constraints.join(', ')}`,
        }),
      });
      setAiExplanation(res.explanation);
    } catch (err: any) {
      setAiExplanation(`AI Explanation error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400 text-xs">Loading problem workspace...</div>;
  }

  if (!problem) {
    return <div className="p-12 text-center text-red-400 text-xs">Problem not found.</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#0B0F19]">
      
      {/* Top Breadcrumb & Controls Bar */}
      <div className="h-12 border-b border-slate-800 bg-[#0F172A] px-4 flex items-center justify-between gap-4 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/problems" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Question Bank</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-white truncate max-w-xs">{problem.title}</span>
          <span
            className={`font-semibold text-[11px] px-2 py-0.5 rounded ${
              problem.difficulty === 'Easy'
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                : problem.difficulty === 'Medium'
                ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                : 'bg-red-950/60 text-red-400 border border-red-800/40'
            }`}
          >
            {problem.difficulty}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 font-medium cursor-pointer"
          >
            <option value="python">Python 3.11</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="cpp">C++ (GCC)</option>
          </select>

          <button
            onClick={() => setCode(problem.starterTemplates[language] || '')}
            title="Reset to starter template"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-cyan-400 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Run Example'}</span>
          </button>

          <button
            onClick={handleSubmitSolution}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-900/30 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Evaluating...' : 'Submit Code'}</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Column: Problem Tabs (Description, Hints, Solution, AI) */}
        <div className="lg:col-span-5 h-full flex flex-col border-r border-slate-800 bg-[#0F172A]">
          
          {/* Tabs Navigation */}
          <div className="h-10 border-b border-slate-800 px-3 flex items-center gap-1 text-xs shrink-0 bg-[#0B0F19]">
            <button
              onClick={() => setActiveLeftTab('description')}
              className={`px-3 py-1 rounded transition-colors ${
                activeLeftTab === 'description' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveLeftTab('hints')}
              className={`px-3 py-1 rounded transition-colors ${
                activeLeftTab === 'hints' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hints ({problem.hints.length})
            </button>
            <button
              onClick={() => setActiveLeftTab('solution')}
              className={`px-3 py-1 rounded transition-colors ${
                activeLeftTab === 'solution' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Solution
            </button>
            <button
              onClick={handleAskAIExplanation}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                activeLeftTab === 'ai' ? 'bg-indigo-950 text-indigo-300 font-semibold' : 'text-indigo-400 hover:text-indigo-300'
              }`}
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Ask AI</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto text-xs text-slate-300 space-y-6 leading-relaxed">
            
            {activeLeftTab === 'description' && (
              <>
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white tracking-tight">{problem.title}</h2>
                  <div className="whitespace-pre-wrap text-slate-300 font-sans text-sm leading-relaxed">
                    {problem.description}
                  </div>
                </div>

                {/* Examples */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Examples</h3>
                  {problem.examples.map((ex, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 font-mono space-y-1.5 text-xs">
                      <div><span className="text-slate-500 font-sans">Input:</span> <span className="text-slate-200">{ex.input}</span></div>
                      <div><span className="text-slate-500 font-sans">Output:</span> <span className="text-cyan-400">{ex.output}</span></div>
                      {ex.explanation && (
                        <div className="text-[11px] text-slate-400 font-sans pt-1 border-t border-slate-800/60">
                          {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Constraints</h3>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono text-[11px]">
                    {problem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {activeLeftTab === 'hints' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="font-semibold text-white">Progressive Hints</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Unveil one hint at a time to train independent problem solving.
                </p>

                {problem.hints.map((hint, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
                    <button
                      onClick={() => toggleHint(idx)}
                      className="w-full px-4 py-2.5 flex items-center justify-between text-left font-medium text-slate-200 hover:bg-slate-800/50"
                    >
                      <span>Hint {idx + 1}</span>
                      {revealedHints.includes(idx) ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                    {revealedHints.includes(idx) && (
                      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-slate-300 text-xs">
                        {hint}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeLeftTab === 'solution' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold text-white">Optimal Solution & Complexity Analysis</span>
                </div>
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
                  {problem.solutionExplanation || 'Optimal solution details available upon submission.'}
                </div>
              </div>
            )}

            {activeLeftTab === 'ai' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-white">Gemini Coach Explanation</span>
                </div>

                {aiLoading ? (
                  <div className="p-8 text-center text-cyan-400 space-y-2">
                    <Sparkles className="w-6 h-6 animate-pulse mx-auto" />
                    <p>Arena AI is analyzing problem constraints and optimal algorithmic patterns...</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-slate-900 border border-indigo-950 whitespace-pre-wrap text-slate-200 text-xs leading-relaxed">
                    {aiExplanation || 'Click "Ask AI" to generate an on-demand architectural and algorithmic breakdown.'}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Code Editor & Submission Results */}
        <div className="lg:col-span-7 h-full flex flex-col bg-[#070A11]">
          
          {/* Monaco Canvas */}
          <div className="flex-1 relative border-b border-slate-800">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : 'typescript'}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </div>

          {/* Test Case & Submission Feedback Panel */}
          <div className="h-56 bg-[#0B0F19] p-4 overflow-y-auto text-xs font-mono space-y-3">
            
            {/* Run Example Feedback */}
            {executionResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    {executionResult.verdict === 'Accepted' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`font-semibold font-sans ${executionResult.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {executionResult.verdict}
                    </span>
                  </div>
                  <span className="text-slate-400 font-sans text-[11px]">
                    Runtime: <span className="text-slate-200 tabular-nums">{executionResult.executionTimeMs}ms</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans mb-1">Your Output:</div>
                    <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-200 whitespace-pre-wrap">
                      {executionResult.stdout || '(Empty)'}
                    </pre>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans mb-1">Expected Output:</div>
                    <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-cyan-400 whitespace-pre-wrap">
                      {executionResult.expected || '(None)'}
                    </pre>
                  </div>
                </div>

                {executionResult.stderr && (
                  <pre className="p-2 bg-red-950/30 border border-red-900/50 rounded text-red-400 whitespace-pre-wrap">
                    {executionResult.stderr}
                  </pre>
                )}
              </div>
            )}

            {/* Submission Suite Feedback */}
            {submissionResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    {submissionResult.verdict === 'Accepted' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={`text-sm font-bold font-sans ${submissionResult.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {submissionResult.verdict}
                    </span>
                  </div>
                  <div className="text-slate-400 font-sans text-[11px] flex items-center gap-3">
                    <span>Passed: <strong className="text-white tabular-nums">{submissionResult.passedCount} / {submissionResult.totalCount}</strong> test cases</span>
                    <span>Average Runtime: <strong className="text-slate-200 tabular-nums">{submissionResult.executionTimeMs}ms</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans">
                  {submissionResult.testCaseResults.map((tc, idx) => (
                    <div
                      key={tc.testCaseId || idx}
                      className={`p-2 rounded border text-xs flex items-center justify-between ${
                        tc.passed
                          ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                          : 'bg-red-950/40 border-red-800/40 text-red-300'
                      }`}
                    >
                      <span>Test Case {idx + 1} {tc.isHidden ? '(Hidden)' : ''}</span>
                      <span>{tc.passed ? 'PASS' : 'FAIL'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!executionResult && !submissionResult && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-sans space-y-1">
                <Terminal className="w-5 h-5 opacity-40 mb-1" />
                <p>Run example or submit solution to execute in the sandbox.</p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
