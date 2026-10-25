import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { InterviewRoom, Problem } from '../types';
import jsPDF from 'jspdf';
import {
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Users,
  MessageSquare,
  FileText,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Radio,
  Download,
  BookOpen,
  ChevronRight,
  Terminal,
  Code2,
  Maximize2
} from 'lucide-react';

interface Participant {
  socketId: string;
  userId: string;
  userName: string;
  role: 'interviewer' | 'candidate' | 'observer';
  joinedAt: string;
}

interface ChatMsg {
  id: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
}

export function InterviewRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<InterviewRoom | null>(null);
  const [problem, setProblem] = useState<any>(null);
  const [problemsList, setProblemsList] = useState<any[]>([]);
  const [allBankProblems, setAllBankProblems] = useState<Problem[]>([]);
  const [activeProblemIdx, setActiveProblemIdx] = useState<number>(0);
  const [problemCodes, setProblemCodes] = useState<Record<string, string>>({});

  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'problem' | 'chat' | 'notes' | 'evaluation'>('problem');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  // Live Video Recording State
  const [isRecording, setIsRecording] = useState(true);
  const [recSeconds, setRecSeconds] = useState(0);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [hasRealMedia, setHasRealMedia] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(3600);
  const [timerRunning, setTimerRunning] = useState(true);

  // Execution & Output State
  const [isRunning, setIsRunning] = useState(false);
  const [outputTab, setOutputTab] = useState<'output' | 'stderr' | 'stdin' | 'testcases'>('output');
  const [customStdin, setCustomStdin] = useState('');
  const [output, setOutput] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [memoryKb, setMemoryKb] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);

  // End Interview & Evaluation Modal
  const [showEndModal, setShowEndModal] = useState(false);
  const [evalProblemSolving, setEvalProblemSolving] = useState(4);
  const [evalCodeQuality, setEvalCodeQuality] = useState(4);
  const [evalCommunication, setEvalCommunication] = useState(5);
  const [evalComplexity, setEvalComplexity] = useState(4);
  const [evalEdgeCases, setEvalEdgeCases] = useState(4);
  const [evalStrengths, setEvalStrengths] = useState('Approached problem methodically with clear two-pointers logic; clean variable naming and modular abstraction.');
  const [evalImprovements, setEvalImprovements] = useState('Formulate formal edge-case analysis before starting implementation; test with empty collections.');
  const [evalRecommendation, setEvalRecommendation] = useState<'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire'>('Strong Hire');
  const [isEnding, setIsEnding] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const isLocalChange = useRef(false);

  // Load Room and Problem Bank
  useEffect(() => {
    async function loadData() {
      try {
        const [roomRes, bankRes] = await Promise.all([
          apiRequest<{ room: InterviewRoom; problem?: any; problems?: any[] }>(`/interviews/${roomId}`),
          apiRequest<{ problems: Problem[] }>('/problems')
        ]);

        const r = roomRes.room;
        setRoom(r);
        setProblem(roomRes.problem);
        setProblemsList(roomRes.problems || [roomRes.problem].filter(Boolean));
        setAllBankProblems(bankRes.problems || []);

        const initialLang = r.language || 'python';
        setLanguage(initialLang);

        const currentActivePid = r.problemIds?.[r.activeProblemIndex || 0] || r.problemId || 'prob-two-sum';
        const initialBuffers: Record<string, string> = r.problemCodes || {};
        if (!initialBuffers[currentActivePid]) {
          initialBuffers[currentActivePid] = r.code || roomRes.problem?.starterTemplates?.[initialLang] || '# Solution';
        }
        setProblemCodes(initialBuffers);
        setCode(initialBuffers[currentActivePid] || r.code);
        setActiveProblemIdx(r.activeProblemIndex || 0);

        setTimerSeconds(r.durationMinutes * 60);
      } catch (err) {
        console.warn('Failed to load room:', err);
      }
    }

    loadData();

    // Start Webcam or graceful fallback
    async function initWebcam() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 360 } },
            audio: true,
          });
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasRealMedia(true);
        }
      } catch (e) {
        // Permissions blocked or denied in iframe - gracefully use simulated live feed
        setHasRealMedia(false);
      }
    }
    initWebcam();

    // Initialize Socket.IO connection
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('interview:join', {
        roomId,
        userId: user?.id || `guest_${socket.id?.slice(0, 5)}`,
        userName: user?.name || 'Elena Rostova',
        role: user?.role || 'candidate',
      });
    });

    socket.on('participant:presence', (data: { participants: Participant[]; event: string }) => {
      setParticipants(data.participants || []);
    });

    socket.on('interview:sync_state', (data: { code: string; language: string }) => {
      if (data.code) setCode(data.code);
      if (data.language) setLanguage(data.language);
    });

    socket.on('code:change', (data: { code: string; senderName?: string }) => {
      isLocalChange.current = true;
      setCode(data.code);
    });

    socket.on('language:change', (data: { language: string }) => {
      setLanguage(data.language);
    });

    socket.on('chat:message', (msg: ChatMsg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('timer:update', (data: { action: string; durationMinutes?: number }) => {
      if (data.action === 'start') setTimerRunning(true);
      if (data.action === 'pause') setTimerRunning(false);
      if (data.action === 'extend' && data.durationMinutes) {
        setTimerSeconds(data.durationMinutes * 60);
      }
    });

    socket.on('submission:status', (data: { actorName?: string; status: string; result?: any }) => {
      if (data.result) {
        setOutput(data.result.stdout || '');
        setStderr(data.result.stderr || '');
        setVerdict(data.result.verdict);
        setExecutionTime(data.result.executionTimeMs);
        setMemoryKb(data.result.memoryKb);
      }
    });

    return () => {
      socket.disconnect();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId, user]);

  // Recording Timer Effect
  useEffect(() => {
    let recInterval: any = null;
    if (isRecording) {
      recInterval = setInterval(() => {
        setRecSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(recInterval);
  }, [isRecording]);

  // Session Countdown Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const handleEditorChange = (newCode: string | undefined) => {
    const val = newCode || '';
    if (isLocalChange.current) {
      isLocalChange.current = false;
      return;
    }
    setCode(val);

    // Update in local buffer
    if (problem?.id) {
      setProblemCodes((prev) => ({ ...prev, [problem.id]: val }));
    }

    socketRef.current?.emit('code:change', {
      roomId,
      code: val,
    });
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    socketRef.current?.emit('language:change', {
      roomId,
      language: newLang,
    });
  };

  // Switch between Q1, Q2, Q3
  const handleSwitchProblem = async (index: number) => {
    if (index === activeProblemIdx || !problemsList[index]) return;

    // Save current problem code into buffer
    const currentPid = problem?.id;
    const updatedBuffers = { ...problemCodes };
    if (currentPid) {
      updatedBuffers[currentPid] = code;
      setProblemCodes(updatedBuffers);
    }

    const nextProblem = problemsList[index];
    setActiveProblemIdx(index);
    setProblem(nextProblem);

    // Retrieve next problem code or starter template
    const nextCode = updatedBuffers[nextProblem.id] || nextProblem.starterTemplates?.[language] || '# Solution';
    setCode(nextCode);

    try {
      await apiRequest(`/interviews/${roomId}/switch-problem`, {
        method: 'PUT',
        body: JSON.stringify({
          problemIndex: index,
          problemId: nextProblem.id,
          currentCode: code,
        }),
      });
    } catch (e) {
      console.warn('Could not persist problem switch:', e);
    }
  };

  // Add or Replace Question from 250+ Bank
  const handleSelectFromBank = async (bankProblem: Problem) => {
    try {
      const res = await apiRequest<{ success: boolean; room: InterviewRoom }>(`/interviews/${roomId}/switch-problem`, {
        method: 'PUT',
        body: JSON.stringify({
          addProblemId: bankProblem.id,
          currentCode: code,
        }),
      });

      // Update local problemsList
      const existingIdx = problemsList.findIndex(p => p.id === bankProblem.id);
      let updatedList = [...problemsList];
      if (existingIdx === -1) {
        if (updatedList.length >= 3) {
          updatedList[2] = bankProblem;
        } else {
          updatedList.push(bankProblem);
        }
      }
      setProblemsList(updatedList);
      const newActiveIdx = updatedList.findIndex(p => p.id === bankProblem.id);
      setActiveProblemIdx(newActiveIdx >= 0 ? newActiveIdx : 0);
      setProblem(bankProblem);

      const starterCode = bankProblem.starterTemplates?.[language] || '# Solution';
      setCode(starterCode);
      setProblemCodes(prev => ({ ...prev, [bankProblem.id]: starterCode }));
      setShowQuestionBankModal(false);
    } catch (err: any) {
      alert(`Could not add question: ${err.message}`);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit('chat:message', {
      roomId,
      message: chatInput.trim(),
    });
    setChatInput('');
  };

  const handleTimerAction = (action: 'start' | 'pause' | 'extend') => {
    socketRef.current?.emit('timer:control', {
      roomId,
      action,
      minutes: action === 'extend' ? 15 : undefined,
    });
    if (action === 'start') setTimerRunning(true);
    if (action === 'pause') setTimerRunning(false);
    if (action === 'extend') setTimerSeconds((prev) => prev + 15 * 60);
  };

  // Run Code via Wandbox Compiler
  const handleRunCode = async (isSubmission = false) => {
    setIsRunning(true);
    setOutput('');
    setStderr('');
    setVerdict(null);
    setOutputTab('output');

    try {
      const inputToUse = customStdin.trim() || problem?.examples?.[0]?.input || '';
      const res = await apiRequest('/compiler/run', {
        method: 'POST',
        body: JSON.stringify({
          language,
          code,
          stdin: inputToUse,
        }),
      });

      setOutput(res.stdout || (res.stderr ? 'Executed with errors.' : 'Execution completed successfully with no stdout.'));
      setStderr(res.stderr || '');
      setExecutionTime(res.executionTimeMs);
      setMemoryKb(res.memoryKb);
      setVerdict(res.verdict || (res.stderr ? 'Compilation Error' : 'Accepted'));

      if (res.stderr) {
        setOutputTab('stderr');
      }

      socketRef.current?.emit('submission:run', {
        roomId,
        status: 'completed',
        result: res,
      });
    } catch (err: any) {
      setStderr(err.message || 'Execution error');
      setVerdict('Runtime Error');
      setOutputTab('stderr');
    } finally {
      setIsRunning(false);
    }
  };

  // End Interview & Submit Analysis
  const handleEndInterviewAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEnding(true);

    try {
      const res = await apiRequest<{ success: boolean; reportId: string; report: any }>(`/interviews/${roomId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          problemSolving: evalProblemSolving,
          codeQuality: evalCodeQuality,
          communication: evalCommunication,
          complexityAnalysis: evalComplexity,
          edgeCases: evalEdgeCases,
          strengths: evalStrengths,
          improvements: evalImprovements,
          recommendation: evalRecommendation,
        }),
      });

      // Stop recording
      setIsRecording(false);
      setShowEndModal(false);

      // Navigate to detailed performance report page with circular metrics and graphs
      navigate(`/reports/${res.reportId}`);
    } catch (err: any) {
      alert(`Analysis generation error: ${err.message}`);
    } finally {
      setIsEnding(false);
    }
  };

  // Instant PDF Scorecard Download
  const handleInstantDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(11, 15, 25);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PAIRARENA AI — CANDIDATE INTERVIEW SCORECARD', 14, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(6, 182, 212);
    doc.text('Real-time Pair Programming & Algorithmic Evaluation Engine', 14, 28);

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 42, 182, 34, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Candidate: ${room?.candidateName || 'Elena Rostova'}`, 20, 52);
    doc.text(`Lead Interviewer: ${room?.interviewerName || 'Alex Chen'}`, 20, 58);
    doc.text(`Recommendation: ${evalRecommendation}`, 20, 64);
    doc.text(`Session Code: ${roomId}`, 20, 70);

    const totalScore = Math.round(((evalProblemSolving + evalCodeQuality + evalCommunication + evalComplexity + evalEdgeCases) / 25) * 100);
    doc.text(`Overall Score: ${totalScore}%`, 130, 52);
    doc.text(`Duration: ${Math.floor(recSeconds / 60)} mins`, 130, 58);
    doc.text(`Problems Covered: ${problemsList.length}`, 130, 64);
    doc.text(`Compiler: Wandbox Sandboxed`, 130, 70);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Evaluated Competencies', 14, 88);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Problem Solving & Algorithmic Intuition: ${evalProblemSolving}/5 (${evalProblemSolving * 20}%)`, 20, 96);
    doc.text(`• Code Cleanliness & Architecture: ${evalCodeQuality}/5 (${evalCodeQuality * 20}%)`, 20, 103);
    doc.text(`• Time & Space Complexity (Big-O): ${evalComplexity}/5 (${evalComplexity * 20}%)`, 20, 110);
    doc.text(`• Technical Articulation & Communication: ${evalCommunication}/5 (${evalCommunication * 20}%)`, 20, 117);
    doc.text(`• Edge-Case & Boundary Resilience: ${evalEdgeCases}/5 (${evalEdgeCases * 20}%)`, 20, 124);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Interviewer Qualitative Assessment', 14, 138);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Strengths: ${evalStrengths}`, 20, 146, { maxWidth: 170 });
    doc.text(`Growth Opportunities: ${evalImprovements}`, 20, 162, { maxWidth: 170 });

    doc.save(`PairArena_Scorecard_${roomId}.pdf`);
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#0B0F19] text-slate-100 overflow-hidden">
      
      {/* =========================================================================
          TOP BAR: INTERVIEWER & CANDIDATE PROFILE, LIVE RECORDING HUD, CONTROLS
          ========================================================================= */}
      <div className="h-16 border-b border-slate-800 bg-[#0F172A] px-4 flex items-center justify-between gap-4 shrink-0">
        
        {/* Left: Back & Room Meta */}
        <div className="flex items-center gap-3">
          <Link to="/interviews" className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm truncate max-w-[200px] sm:max-w-xs">
                {room?.title || 'Technical Coding Interview'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE SYNC</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>Code: <strong className="text-cyan-400">{roomId}</strong></span>
              <button onClick={copyRoomLink} className="text-slate-500 hover:text-cyan-400">
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Interviewer Card & Candidate Card + Beside Live Recording Preview */}
        <div className="hidden md:flex items-center gap-3">
          
          {/* Interviewer Profile Card */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <img
              src="/src/assets/images/avatar_interviewer_alex_1792852526159.jpg"
              alt="Interviewer"
              className="w-8 h-8 rounded-full object-cover border border-indigo-500/50 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{room?.interviewerName || 'Alex Chen'}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">INTERVIEWER</span>
              </div>
              <span className="text-[10px] text-slate-400">Staff Systems Engineer</span>
            </div>
          </div>

          {/* Candidate Profile Card with Photo */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <img
              src="/src/assets/images/avatar_candidate_elena_1792852527001.jpg"
              alt="Candidate"
              className="w-8 h-8 rounded-full object-cover border border-cyan-500/50 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{room?.candidateName || user?.name || 'Elena Rostova'}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">CANDIDATE</span>
              </div>
              <span className="text-[10px] text-slate-400">Senior Full-Stack / Systems</span>
            </div>
          </div>

          {/* Live Recording HUD Widget ("bgl mein recording ye sab ho") */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/30 border border-rose-900/50">
            {/* Live Camera Thumbnail Preview */}
            <div className="relative w-9 h-7 rounded bg-slate-950 overflow-hidden border border-rose-800/60 shrink-0 flex items-center justify-center">
              {hasRealMedia && cameraActive ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
              )}
              {isRecording && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>

            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-rose-300">REC</span>
                <span className="text-[11px] font-mono font-semibold text-white tabular-nums">
                  {formatTimer(recSeconds)}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono">1080p WebM Audio/Video</span>
            </div>

            {/* Mic / Cam Toggles */}
            <div className="flex items-center gap-1 pl-1 border-l border-rose-900/50">
              <button
                onClick={() => setMicActive(!micActive)}
                className={`p-1 rounded hover:bg-slate-800 ${micActive ? 'text-emerald-400' : 'text-slate-500'}`}
                title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-rose-400" />}
              </button>
              <button
                onClick={() => setCameraActive(!cameraActive)}
                className={`p-1 rounded hover:bg-slate-800 ${cameraActive ? 'text-cyan-400' : 'text-slate-500'}`}
                title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {cameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5 text-rose-400" />}
              </button>
            </div>
          </div>

        </div>

        {/* Right: Session Timer & End Interview Button */}
        <div className="flex items-center gap-3">
          
          {/* Session Timer */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-mono font-bold text-sm text-white tabular-nums">
              {formatTimer(timerSeconds)}
            </span>
            <div className="h-3 w-[1px] bg-slate-800 mx-0.5" />
            <button
              onClick={() => handleTimerAction(timerRunning ? 'pause' : 'start')}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {timerRunning ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            </button>
          </div>

          {/* End Interview & Analyze Button */}
          <button
            onClick={() => setShowEndModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-md shadow-rose-900/30 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>End & Analyze</span>
          </button>

        </div>

      </div>

      {/* =========================================================================
          2-3 QUESTION SELECTOR BAR (DURING LIVE SESSION)
          ========================================================================= */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Questions:</span>
          </span>

          {problemsList.map((prob, idx) => {
            const isActive = idx === activeProblemIdx;
            return (
              <button
                key={prob.id || idx}
                onClick={() => handleSwitchProblem(idx)}
                className={`px-3 py-1 rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-300' : 'bg-slate-500'}`} />
                <span>Q{idx + 1}: {prob.title}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  prob.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-300' :
                  prob.difficulty === 'Medium' ? 'bg-amber-950 text-amber-300' : 'bg-rose-950 text-rose-300'
                }`}>
                  {prob.difficulty}
                </span>
              </button>
            );
          })}

          {/* Button to Swap or Add Question from 250+ Question Bank */}
          <button
            onClick={() => setShowQuestionBankModal(true)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-dashed border-indigo-700/60 text-indigo-300 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>+ Pick from 250+ DSA Bank</span>
          </button>
        </div>

        {/* Right Editor Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-mono">Language:</span>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 font-mono focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="python">Python 3 (GCC/Wandbox)</option>
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="typescript">TypeScript</option>
            <option value="cpp">C++ 20 (GCC)</option>
            <option value="java">Java 21 (OpenJDK)</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          MAIN WORKSPACE: PROBLEM DESCRIPTION (LEFT) & MONACO EDITOR + RUNNER (RIGHT)
          ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Pane: Problem Description, Examples, Constraints, & Room Chat */}
        <div className="lg:col-span-5 border-r border-slate-800 bg-[#0F172A] flex flex-col h-full overflow-hidden">
          
          {/* Tabs: Problem / Live Chat / Evaluation */}
          <div className="h-10 border-b border-slate-800 flex items-center px-4 gap-2 bg-slate-900/70 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('problem')}
              className={`px-3 py-1.5 font-semibold rounded-t-lg transition-colors ${
                activeTab === 'problem'
                  ? 'border-b-2 border-indigo-500 text-white bg-slate-800/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Problem Description
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'border-b-2 border-indigo-500 text-white bg-slate-800/60'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Live Chat</span>
              {chatMessages.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-[10px] text-white">
                  {chatMessages.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 text-slate-300 text-xs space-y-5 leading-relaxed">
            {activeTab === 'problem' ? (
              problem ? (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white tracking-tight">{problem.title}</h2>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        problem.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' :
                        problem.difficulty === 'Medium' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                        'bg-rose-950 text-rose-400 border border-rose-800/40'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </div>
                    <span className="text-[11px] text-cyan-400 font-mono">{problem.category}</span>
                  </div>

                  {/* Description */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 whitespace-pre-line text-slate-200 font-sans">
                    {problem.description}
                  </div>

                  {/* Examples */}
                  {problem.examples && problem.examples.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">
                        Examples
                      </h3>
                      {problem.examples.map((ex: any, idx: number) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-[11px] space-y-1.5">
                          <div>
                            <span className="text-slate-500 block">Input:</span>
                            <span className="text-slate-200">{ex.input}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Output:</span>
                            <span className="text-emerald-400">{ex.output}</span>
                          </div>
                          {ex.explanation && (
                            <div className="text-[10px] text-slate-400 italic pt-1 font-sans">
                              Explanation: {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {problem.constraints && problem.constraints.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-white uppercase text-[11px] tracking-wider text-slate-400">
                        Constraints
                      </h3>
                      <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-[11px]">
                        {problem.constraints.map((c: string, idx: number) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Hints */}
                  {problem.hints && problem.hints.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-1 text-slate-300">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-xs">
                        <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Problem Solving Hint</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{problem.hints[0]}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 text-center text-slate-500">Loading problem details...</div>
              )
            ) : (
              /* Live Chat Component */
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                  {chatMessages.length > 0 ? (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-0.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-indigo-400">{msg.senderName} ({msg.senderRole})</span>
                          <span className="text-slate-500 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-200 text-xs">{msg.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      No chat messages yet. Use this channel to share notes, hints, or test vectors.
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="pt-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message to interviewer/candidate..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Full Monaco Code Editor + Wandbox Execution Console */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[#0B0F19]">
          
          {/* Editor Header Bar with Run Controls */}
          <div className="h-10 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>solution.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'ts'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunCode(false)}
                disabled={isRunning}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>

              <button
                onClick={() => handleRunCode(true)}
                disabled={isRunning}
                className="px-3.5 py-1 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                <span>Submit & Test</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[300px]">
            <Editor
              height="100%"
              language={language === 'c_cpp' ? 'cpp' : language}
              value={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
              }}
            />
          </div>

          {/* Compiler Output & Test Case Console (Bottom) */}
          <div className="h-48 border-t border-slate-800 bg-[#0F172A] flex flex-col shrink-0">
            {/* Console Tabs */}
            <div className="h-8 border-b border-slate-800 px-4 flex items-center justify-between text-xs bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOutputTab('output')}
                  className={`font-mono text-xs ${outputTab === 'output' ? 'text-cyan-400 font-bold border-b border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Standard Output
                </button>
                <button
                  onClick={() => setOutputTab('stdin')}
                  className={`font-mono text-xs ${outputTab === 'stdin' ? 'text-cyan-400 font-bold border-b border-cyan-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Custom Input (stdin)
                </button>
                <button
                  onClick={() => setOutputTab('stderr')}
                  className={`font-mono text-xs ${outputTab === 'stderr' ? 'text-rose-400 font-bold border-b border-rose-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Errors (stderr) {stderr ? '●' : ''}
                </button>
              </div>

              {/* Execution Metrics Badge */}
              <div className="flex items-center gap-3 font-mono text-[11px]">
                {verdict && (
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    verdict === 'Accepted' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' :
                    'bg-rose-950 text-rose-400 border border-rose-800/40'
                  }`}>
                    {verdict}
                  </span>
                )}
                {executionTime !== null && (
                  <span className="text-slate-400">{executionTime} ms</span>
                )}
                {memoryKb !== null && (
                  <span className="text-slate-400">{memoryKb} KB</span>
                )}
              </div>
            </div>

            {/* Console Content */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
              {outputTab === 'output' && (
                <pre className="text-slate-200 whitespace-pre-wrap">{output || 'No output. Click "Run Code" to execute with Wandbox.'}</pre>
              )}
              {outputTab === 'stderr' && (
                <pre className="text-rose-300 whitespace-pre-wrap">{stderr || 'No execution errors.'}</pre>
              )}
              {outputTab === 'stdin' && (
                <textarea
                  value={customStdin}
                  onChange={(e) => setCustomStdin(e.target.value)}
                  placeholder="Enter custom standard input for your program..."
                  className="w-full h-full bg-slate-950 text-slate-200 border border-slate-800 rounded p-2 focus:outline-none font-mono text-xs resize-none"
                />
              )}
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          MODAL: PICK / SWAP FROM 250+ DSA QUESTION BANK
          ========================================================================= */}
      {showQuestionBankModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>250+ DSA Interview Question Bank</span>
                </h3>
                <p className="text-xs text-slate-400">Select any problem to add or switch into this live interview</p>
              </div>
              <button
                onClick={() => setShowQuestionBankModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              placeholder="Search by problem name or category (e.g. Two Pointers, Graph, LRU, DP)..."
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
            />

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {allBankProblems
                .filter(p => !bankSearch || p.title.toLowerCase().includes(bankSearch.toLowerCase()) || p.category.toLowerCase().includes(bankSearch.toLowerCase()))
                .slice(0, 50)
                .map((bp) => (
                  <div
                    key={bp.id}
                    onClick={() => handleSelectFromBank(bp)}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <div className="font-semibold text-white text-xs">{bp.title}</div>
                      <div className="text-[11px] text-slate-400">{bp.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        bp.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-400' :
                        bp.difficulty === 'Medium' ? 'bg-amber-950 text-amber-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {bp.difficulty}
                      </span>
                      <span className="text-xs font-semibold text-indigo-400">Select →</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: END INTERVIEW, GENERATE PERFORMANCE SCORECARD & DOWNLOAD PDF
          ========================================================================= */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
                  <Award className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">End Interview & Analyze Performance</h3>
                  <p className="text-xs text-slate-400">Generate circular scorecards, graph metrics, and PDF report</p>
                </div>
              </div>
              <button
                onClick={() => setShowEndModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEndInterviewAndAnalyze} className="space-y-4 text-xs">
              
              {/* Score Sliders (1 to 5) */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                  Rubric Assessment (1 - 5)
                </h4>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Problem Solving & Algorithm:</span>
                    <strong className="text-cyan-400 font-mono">{evalProblemSolving} / 5</strong>
                  </div>
                  <input
                    type="range" min="1" max="5" value={evalProblemSolving}
                    onChange={(e) => setEvalProblemSolving(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Code Quality & Architecture:</span>
                    <strong className="text-cyan-400 font-mono">{evalCodeQuality} / 5</strong>
                  </div>
                  <input
                    type="range" min="1" max="5" value={evalCodeQuality}
                    onChange={(e) => setEvalCodeQuality(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Time & Space Complexity (Big-O):</span>
                    <strong className="text-cyan-400 font-mono">{evalComplexity} / 5</strong>
                  </div>
                  <input
                    type="range" min="1" max="5" value={evalComplexity}
                    onChange={(e) => setEvalComplexity(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Technical Communication:</span>
                    <strong className="text-cyan-400 font-mono">{evalCommunication} / 5</strong>
                  </div>
                  <input
                    type="range" min="1" max="5" value={evalCommunication}
                    onChange={(e) => setEvalCommunication(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Edge Cases & Resilience:</span>
                    <strong className="text-cyan-400 font-mono">{evalEdgeCases} / 5</strong>
                  </div>
                  <input
                    type="range" min="1" max="5" value={evalEdgeCases}
                    onChange={(e) => setEvalEdgeCases(Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Overall Recommendation</label>
                <select
                  value={evalRecommendation}
                  onChange={(e) => setEvalRecommendation(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Strong Hire">Strong Hire (Top 5%)</option>
                  <option value="Hire">Hire (Meets All Standards)</option>
                  <option value="Lean Hire">Lean Hire (Needs Minor Coaching)</option>
                  <option value="No Hire">No Hire (Gaps in Core Fundamentals)</option>
                </select>
              </div>

              {/* Strengths & Improvements */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Key Strengths</label>
                <textarea
                  value={evalStrengths}
                  onChange={(e) => setEvalStrengths(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Targeted Improvements</label>
                <textarea
                  value={evalImprovements}
                  onChange={(e) => setEvalImprovements(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleInstantDownloadPDF}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download PDF Scorecard</span>
                </button>

                <button
                  type="submit"
                  disabled={isEnding}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>{isEnding ? 'Generating Report...' : 'Analyze & View Charts'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
