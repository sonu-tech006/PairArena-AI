import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { apiRequest } from '../api/client';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Terminal,
  Settings2,
  Code,
  FileCode,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const STARTER_CODES: Record<string, string> = {
  python: `# Multi-Language Compiler - Python 3
def solve():
    print("Hello from PairArena AI sandboxed execution!")
    
    # Calculate Fibonacci series
    a, b = 0, 1
    fib = []
    for _ in range(10):
        fib.append(a)
        a, b = b, a + b
    print(f"First 10 Fibonacci numbers: {fib}")

if __name__ == "__main__":
    solve()
`,
  javascript: `// Multi-Language Compiler - JavaScript (Node.js)
function solve() {
    console.log("Hello from PairArena AI sandboxed execution!");
    
    const users = [
        { id: 1, name: "Alice", role: "Interviewer" },
        { id: 2, name: "Bob", role: "Candidate" }
    ];
    console.log("Active participants:", users.map(u => u.name).join(", "));
}

solve();
`,
  typescript: `// Multi-Language Compiler - TypeScript
interface InterviewSession {
    roomId: string;
    participants: number;
    language: string;
}

const session: InterviewSession = {
    roomId: "room-live-402",
    participants: 2,
    language: "TypeScript"
};

console.log(\`Running live coding session for \${session.roomId} in \${session.language}!\`);
`,
  cpp: `// Multi-Language Compiler - C++ (GCC)
#include <iostream>
#include <vector>
#include <numeric>

using namespace std;

int main() {
    cout << "Hello from PairArena AI C++ Compiler!" << endl;
    vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int sum = accumulate(nums.begin(), nums.end(), 0);
    cout << "Sum of 1..10 = " << sum << endl;
    return 0;
}
`,
  java: `// Multi-Language Compiler - Java (OpenJDK)
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from PairArena AI Java Environment!");
        int a = 15;
        int b = 25;
        System.out.println("Result: " + (a + b));
    }
}
`
};

export function EditorPage() {
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>(STARTER_CODES.python);
  const [stdin, setStdin] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [engineProvider, setEngineProvider] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'output' | 'stdin'>('output');

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(STARTER_CODES[newLang] || '// Write code here\n');
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('');
    setStderr('');
    setVerdict(null);
    try {
      const res = await apiRequest('/compiler/run', {
        method: 'POST',
        body: JSON.stringify({
          language,
          code,
          stdin,
        }),
      });

      setOutput(res.stdout || '');
      setStderr(res.stderr || '');
      setExecutionTime(res.executionTimeMs);
      setVerdict(res.verdict);
      setEngineProvider(res.provider);
      setActiveTab('output');
    } catch (err: any) {
      setStderr(err.message || 'Execution error');
      setVerdict('Runtime Error');
    } finally {
      setIsRunning(false);
    }
  };

  const copyOutput = () => {
    const textToCopy = output || stderr;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex flex-col bg-[#0B0F19] ${isFullscreen ? 'fixed inset-0 z-50 p-4' : 'h-[calc(100vh-4rem)]'}`}>
      
      {/* Top Toolbar */}
      <div className="h-12 border-b border-slate-800 bg-[#0F172A] px-4 flex items-center justify-between gap-4 shrink-0 text-xs">
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">main.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'ts'}</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700" />

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="python">Python 3.11</option>
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="typescript">TypeScript 5.0</option>
            <option value="cpp">C++ (GCC 11)</option>
            <option value="java">Java (OpenJDK 17)</option>
          </select>

          {/* Font Size Selector */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 pl-2">
            <span>Font:</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300"
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCode(STARTER_CODES[language])}
            title="Reset code template"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle fullscreen"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
          </button>
        </div>

      </div>

      {/* Editor & Console Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Monaco Editor Canvas */}
        <div className="lg:col-span-8 h-full border-r border-slate-800 relative">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : language === 'java' ? 'java' : 'typescript'}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize,
              fontFamily: "'JetBrains Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              padding: { top: 12 },
            }}
          />
        </div>

        {/* Output & Stdin Console */}
        <div className="lg:col-span-4 h-full flex flex-col bg-[#070A11]">
          
          {/* Console Header Tabs */}
          <div className="h-10 border-b border-slate-800 bg-[#0F172A] px-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('output')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'output' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Output Console
              </button>
              <button
                onClick={() => setActiveTab('stdin')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  activeTab === 'stdin' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Input
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(output || stderr) && (
                <button
                  onClick={copyOutput}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Console Body */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
            {activeTab === 'stdin' ? (
              <div className="h-full flex flex-col space-y-2">
                <label className="text-slate-400 text-[11px] font-sans">
                  Standard Input (passed to sys.stdin / cin / readFileSync):
                </label>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter inputs here (e.g. test arguments)..."
                  className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono resize-none"
                />
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Status Bar */}
                {verdict && (
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      {verdict === 'Accepted' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`font-semibold font-sans ${verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {verdict}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-sans">
                      {executionTime !== null && (
                        <span>Runtime: <span className="font-mono text-slate-200 tabular-nums">{executionTime}ms</span></span>
                      )}
                      {engineProvider && (
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-400 font-mono">
                          {engineProvider}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stdout Output */}
                {output ? (
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-sans">Stdout:</div>
                    <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed">{output}</pre>
                  </div>
                ) : null}

                {/* Stderr Output */}
                {stderr ? (
                  <div className="space-y-1">
                    <div className="text-[10px] text-red-400 uppercase tracking-wider font-sans">Stderr / Compile Output:</div>
                    <pre className="text-red-400/90 whitespace-pre-wrap leading-relaxed">{stderr}</pre>
                  </div>
                ) : null}

                {!output && !stderr && !isRunning && (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-center font-sans space-y-1">
                    <Terminal className="w-6 h-6 opacity-40 mb-1" />
                    <p className="text-xs">No execution output yet.</p>
                    <p className="text-[11px] text-slate-600">Click &quot;Run Code&quot; to execute in the sandbox.</p>
                  </div>
                )}

                {isRunning && (
                  <div className="h-40 flex items-center justify-center text-cyan-400 text-xs font-sans">
                    <span className="animate-pulse">Sandboxed compiler running...</span>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
