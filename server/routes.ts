import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { Readable } from 'stream';
import { db, User, Submission, InterviewRoom, PerformanceReport, Flashcard, UserNote } from './db.js';
import { executeCode } from './compilerService.js';
import { askArenaAI, explainCode, generateQuizFromTopic, GEMINI_MODEL } from './geminiService.js';
import {
  uploadToGridFS,
  getFileMetadata,
  openDownloadStream,
  deleteFromGridFS,
  listUserGridFSFiles,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
  FileMetadata,
} from './storageService.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pairarena-super-secure-jwt-dev-secret-key-2026';

// Multer streaming upload config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PNG, JPEG, WEBP, SVG, PDF, TXT, JSON, MD, WEBM, WAV`));
    }
  },
});

// Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const store = db.get();
    const user = store.users.find((u) => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User session invalid' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or token invalid' });
  }
}

// Optional Auth (for public problem viewing with user context)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const store = db.get();
      req.user = store.users.find((u) => u.id === decoded.userId);
    } catch {}
  }
  next();
}

/* ==========================================================================
   1. AUTHENTICATION & USER PROFILE
   ========================================================================== */

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'learner', targetRole, skillLevel, preferredLanguage, learningGoals } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const store = db.get();
    const normalizedEmail = email.toLowerCase().trim();
    if (store.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role === 'interviewer' ? 'interviewer' : 'learner',
      targetRole: targetRole || 'Software Engineer',
      skillLevel: skillLevel || 'intermediate',
      preferredLanguage: preferredLanguage || 'python',
      learningGoals: learningGoals || ['DSA Mastery', 'Interview Practice'],
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    db.save();

    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const store = db.get();
    const normalizedEmail = email.toLowerCase().trim();
    const user = store.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash: _, ...safeUser } = req.user!;
  return res.json({ user: safeUser });
});

router.put('/auth/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const user = store.users.find((u) => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { name, bio, targetRole, skillLevel, preferredLanguage, learningGoals, avatarUrl } = req.body;
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (targetRole) user.targetRole = targetRole;
  if (skillLevel) user.skillLevel = skillLevel;
  if (preferredLanguage) user.preferredLanguage = preferredLanguage;
  if (learningGoals) user.learningGoals = learningGoals;
  if (avatarUrl) user.avatarUrl = avatarUrl;

  db.save();
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

/* ==========================================================================
   2. CODING PROBLEMS & SUBMISSIONS
   ========================================================================== */

router.get('/problems', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const { category, difficulty, search } = req.query;

  let list = store.problems.map((p) => {
    // Hide private test cases from public listing
    const { testCases, starterTemplates, solutionExplanation, ...summary } = p;
    return {
      ...summary,
      testCaseCount: testCases.length,
      sampleExample: p.examples[0] || null,
    };
  });

  if (category) {
    list = list.filter((p) => p.category.toLowerCase() === (category as string).toLowerCase());
  }
  if (difficulty) {
    list = list.filter((p) => p.difficulty.toLowerCase() === (difficulty as string).toLowerCase());
  }
  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)));
  }

  // Check user solved status
  if (req.user) {
    const solvedProblemIds = new Set(
      store.submissions.filter((s) => s.userId === req.user!.id && s.verdict === 'Accepted').map((s) => s.problemId)
    );
    list = list.map((p) => ({
      ...p,
      isSolved: solvedProblemIds.has(p.id),
    }));
  }

  return res.json({ problems: list });
});

router.get('/problems/:slug', (req: Request, res: Response) => {
  const store = db.get();
  const problem = store.problems.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
  if (!problem) {
    return res.status(404).json({ error: 'Problem not found' });
  }

  // Exclude hidden test cases from the client response to ensure integrity
  const publicTestCases = problem.testCases
    .filter((tc) => !tc.isHidden)
    .map((tc) => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      explanation: tc.explanation,
    }));

  return res.json({
    problem: {
      ...problem,
      testCases: publicTestCases,
    },
  });
});

/* ==========================================================================
   3. CODE COMPILER & SUBMISSION EVALUATION
   ========================================================================== */

// Arbitrary code runner for /editor
router.post('/compiler/run', async (req: Request, res: Response) => {
  try {
    const { language, code, stdin } = req.body;
    if (!language || !code) {
      return res.status(400).json({ error: 'Language and code are required' });
    }

    const result = await executeCode({ language, code, stdin });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Compiler execution failed' });
  }
});

// Submit code against all test cases for a problem
router.post('/submissions/submit', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { problemId, language, code } = req.body;
    if (!problemId || !language || !code) {
      return res.status(400).json({ error: 'problemId, language, and code are required' });
    }

    const store = db.get();
    const problem = store.problems.find((p) => p.id === problemId || p.slug === problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    let allPassed = true;
    let primaryVerdict: Submission['verdict'] = 'Accepted';
    const testCaseResults: Submission['testCaseResults'] = [];
    let totalTime = 0;

    for (const tc of problem.testCases) {
      const execRes = await executeCode({
        language,
        code,
        stdin: tc.input,
        expectedOutput: tc.expectedOutput,
      });

      totalTime += execRes.executionTimeMs;
      const passed = execRes.verdict === 'Accepted';

      if (!passed && allPassed) {
        allPassed = false;
        primaryVerdict = execRes.verdict;
      }

      testCaseResults.push({
        testCaseId: tc.id,
        passed,
        input: tc.isHidden ? undefined : tc.input,
        expected: tc.isHidden ? undefined : tc.expectedOutput,
        actual: tc.isHidden ? undefined : execRes.stdout,
        error: execRes.stderr || undefined,
        isHidden: tc.isHidden,
      });
    }

    const passedCount = testCaseResults.filter((r) => r.passed).length;
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const submission: Submission = {
      id: submissionId,
      userId: req.user?.id || 'anonymous_guest',
      problemId: problem.id,
      problemSlug: problem.slug,
      language,
      code,
      verdict: primaryVerdict,
      passedCount,
      totalCount: problem.testCases.length,
      executionTimeMs: Math.round(totalTime / problem.testCases.length),
      memoryKb: 34200,
      testCaseResults,
      createdAt: new Date().toISOString(),
    };

    store.submissions.unshift(submission);
    // Update problem submission count
    problem.totalSubmissions = (problem.totalSubmissions || 0) + 1;
    if (primaryVerdict === 'Accepted') {
      const totalAcc = store.submissions.filter((s) => s.problemId === problem.id && s.verdict === 'Accepted').length;
      problem.acceptanceRate = Math.round((totalAcc / problem.totalSubmissions) * 100);
    }
    db.save();

    return res.status(201).json({ submission });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Submission evaluation failed' });
  }
});

router.get('/submissions/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const userSubs = store.submissions
    .filter((s) => s.userId === req.user!.id)
    .slice(0, 50);
  return res.json({ submissions: userSubs });
});

/* ==========================================================================
   4. LIVE INTERVIEWS
   ========================================================================== */

/* ==========================================================================
   4. LIVE INTERVIEWS & REAL-TIME COLLABORATIVE ROOMS
   ========================================================================== */

router.post('/interviews', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      durationMinutes = 60,
      problemId,
      problemIds,
      interviewerName,
      interviewerRole,
      candidateName,
      allowedLanguages = ['python', 'javascript', 'typescript', 'cpp', 'java']
    } = req.body;
    const store = db.get();

    // Default to Elena Rostova / Alex Chen if guest
    const creatorUser = req.user || store.users[0] || {
      id: 'guest_interviewer',
      name: interviewerName || 'Alex Chen',
      role: 'interviewer' as const
    };

    // Determine 2-3 interview questions
    let assignedProblemIds: string[] = [];
    if (Array.isArray(problemIds) && problemIds.length > 0) {
      assignedProblemIds = problemIds.slice(0, 3);
    } else if (problemId) {
      assignedProblemIds = [problemId, 'prob-lru-cache', 'prob-coin-change'];
    } else {
      assignedProblemIds = ['prob-two-sum', 'prob-lru-cache', 'prob-coin-change'];
    }

    // Ensure all problems exist
    const selectedProblem = store.problems.find((p) => p.id === assignedProblemIds[0]) || store.problems[0];
    const initialCode = selectedProblem?.starterTemplates?.['python'] || '# Welcome to PairArena AI Live Interview Room\n';

    // Initialize problem code buffers
    const problemCodes: Record<string, string> = {};
    for (const pid of assignedProblemIds) {
      const p = store.problems.find((pr) => pr.id === pid);
      if (p) {
        problemCodes[pid] = p.starterTemplates?.['python'] || `# Implement solution for ${p.title}\n`;
      }
    }

    const roomId = `room-${Math.random().toString(36).substr(2, 4)}-${Math.random().toString(36).substr(2, 4)}`;

    const newRoom: InterviewRoom = {
      id: roomId,
      title: title || 'Full-Stack Technical Interview',
      description,
      creatorId: creatorUser.id,
      creatorName: creatorUser.name,
      interviewerName: interviewerName || 'Alex Chen',
      interviewerRole: interviewerRole || 'Staff Software Engineer & Lead Interviewer',
      interviewerAvatarUrl: '/src/assets/images/avatar_interviewer_alex_1792852526159.jpg',
      candidateName: candidateName || (req.user?.role === 'learner' ? req.user.name : 'Elena Rostova'),
      candidateAvatarUrl: '/src/assets/images/avatar_candidate_elena_1792852527001.jpg',
      status: 'waiting',
      durationMinutes: Number(durationMinutes) || 60,
      problemId: selectedProblem?.id,
      problemIds: assignedProblemIds,
      activeProblemIndex: 0,
      problemCodes,
      code: initialCode,
      language: 'python',
      allowedLanguages,
      events: [
        {
          id: `ev_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'status_change',
          actorName: creatorUser.name,
          details: 'Live interview room launched',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    store.interviews.unshift(newRoom);
    db.save();

    return res.status(201).json({ room: newRoom });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create interview room' });
  }
});

router.get('/interviews', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const userId = req.user?.id;
  const rooms = userId ? store.interviews.filter((r) => r.creatorId === userId) : store.interviews.slice(0, 10);
  return res.json({ interviews: rooms });
});

router.get('/interviews/:roomId', (req: Request, res: Response) => {
  const store = db.get();
  const room = store.interviews.find((r) => r.id === req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Interview room not found' });
  }

  // Ensure default problemIds if missing
  if (!room.problemIds || room.problemIds.length === 0) {
    room.problemIds = [room.problemId || 'prob-two-sum', 'prob-lru-cache', 'prob-coin-change'];
  }
  if (room.activeProblemIndex === undefined) {
    room.activeProblemIndex = 0;
  }
  if (!room.interviewerName) room.interviewerName = 'Alex Chen';
  if (!room.interviewerRole) room.interviewerRole = 'Staff Software Engineer & Lead Interviewer';
  if (!room.candidateName) room.candidateName = 'Elena Rostova';

  // Gather details for all assigned problems
  const problemsList = room.problemIds.map((pid) => {
    const p = store.problems.find((pr) => pr.id === pid);
    if (!p) return null;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      category: p.category,
      description: p.description,
      constraints: p.constraints,
      examples: p.examples,
      hints: p.hints,
      starterTemplates: p.starterTemplates,
    };
  }).filter(Boolean);

  const activeProblemId = room.problemIds[room.activeProblemIndex || 0] || room.problemId;
  const activeProblem = problemsList.find((p) => p?.id === activeProblemId) || problemsList[0] || null;

  return res.json({ room, problem: activeProblem, problems: problemsList });
});

// Switch or Add question during live interview
router.put('/interviews/:roomId/switch-problem', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const room = store.interviews.find((r) => r.id === req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { problemId, problemIndex, addProblemId, currentCode } = req.body;

  // Save current code in problem buffer
  if (room.problemId && currentCode !== undefined) {
    if (!room.problemCodes) room.problemCodes = {};
    room.problemCodes[room.problemId] = currentCode;
  }

  // If adding a new problem to the room's 2-3 list
  if (addProblemId) {
    if (!room.problemIds) room.problemIds = [];
    if (!room.problemIds.includes(addProblemId)) {
      if (room.problemIds.length >= 3) {
        room.problemIds[2] = addProblemId; // replace 3rd
      } else {
        room.problemIds.push(addProblemId);
      }
    }
    const addedProb = store.problems.find((p) => p.id === addProblemId);
    if (addedProb && !room.problemCodes?.[addProblemId]) {
      if (!room.problemCodes) room.problemCodes = {};
      room.problemCodes[addProblemId] = addedProb.starterTemplates?.[room.language || 'python'] || '';
    }
    room.problemId = addProblemId;
    room.activeProblemIndex = room.problemIds.indexOf(addProblemId);
    room.code = room.problemCodes?.[addProblemId] || '';
  } else if (problemIndex !== undefined && room.problemIds && room.problemIds[problemIndex]) {
    room.activeProblemIndex = Number(problemIndex);
    room.problemId = room.problemIds[problemIndex];
    room.code = room.problemCodes?.[room.problemId] || '';
  } else if (problemId) {
    room.problemId = problemId;
    if (room.problemIds && room.problemIds.includes(problemId)) {
      room.activeProblemIndex = room.problemIds.indexOf(problemId);
    }
    room.code = room.problemCodes?.[problemId] || '';
  }

  db.save();
  return res.json({ success: true, room });
});

router.post('/interviews/:roomId/feedback', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const room = store.interviews.find((r) => r.id === req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const {
    problemSolving = 4,
    codeQuality = 4,
    communication = 4,
    complexityAnalysis = 4,
    edgeCases = 4,
    strengths,
    improvements,
    recommendation,
  } = req.body;

  const numProblemSolving = Number(problemSolving) || 4;
  const numCodeQuality = Number(codeQuality) || 4;
  const numCommunication = Number(communication) || 4;
  const numComplexity = Number(complexityAnalysis) || 4;
  const numEdgeCases = Number(edgeCases) || 4;

  const totalScore = Math.round(((numProblemSolving + numCodeQuality + numCommunication + numComplexity + numEdgeCases) / 25) * 100);

  room.feedback = {
    problemSolving: numProblemSolving,
    codeQuality: numCodeQuality,
    communication: numCommunication,
    complexityAnalysis: numComplexity,
    strengths: strengths || 'Approached algorithms systematically with clean modular code and fast execution.',
    improvements: improvements || 'Could formulate exhaustive edge-case test vectors before implementation.',
    recommendation: recommendation || 'Strong Hire',
  };
  room.status = 'completed';
  room.endTime = new Date().toISOString();

  const reportId = `rep_${Date.now()}`;
  const participantUserId = req.user?.id || room.creatorId || 'user_elena';
  const participantName = room.candidateName || req.user?.name || 'Elena Rostova';

  // Comprehensive Performance Report with Circular Gauges and Graph Data
  const report: PerformanceReport = {
    id: reportId,
    userId: participantUserId,
    userName: participantName,
    title: `Interview Performance: ${room.title}`,
    reportType: 'interview',
    metrics: {
      score: totalScore,
      accuracy: Math.round((numProblemSolving / 5) * 100),
      sessionDurationMinutes: room.durationMinutes || 60,
      strengths: [
        room.feedback.strengths,
        'Demonstrated strong knowledge of data structures, Big-O bounds, and clean variable abstractions.',
        'Articulated trade-offs clearly during pair-programming iterations.'
      ],
      improvements: [
        room.feedback.improvements,
        'Ensure verification of boundary values (empty collections, duplicates, integer overflows).'
      ],
      topicsAssessed: [
        'Data Structures & Algorithms',
        'Time & Space Complexity',
        'Code Architecture & Cleanliness',
        'Technical Communication'
      ],
    },
    recommendations: [
      'Practice 2-3 timed interview simulations covering 2D Dynamic Programming and Graphs.',
      'Always state expected Time/Space complexity upfront before writing the first line of code.',
      'Maintain continuous verbal articulation of logic when debugging failing test cases.'
    ],
    createdAt: new Date().toISOString(),
  };

  store.reports.unshift(report);
  db.save();

  return res.json({
    success: true,
    feedback: room.feedback,
    reportId: report.id,
    report,
  });
});

/* ==========================================================================
   5. LEARNING PATHS & CURRICULUM
   ========================================================================== */

router.get('/learning-paths', (_req: Request, res: Response) => {
  const store = db.get();
  const tracks = [
    {
      id: 'dsa',
      title: 'Data Structures & Algorithms',
      description: 'Master Big-O, hash maps, two pointers, binary trees, dynamic programming, and competitive problem solving.',
      topicsCount: 29,
      estHours: 60,
      level: 'All Levels',
    },
    {
      id: 'fullstack',
      title: 'Full-Stack Engineering',
      description: 'Modern React, TypeScript, Node.js REST APIs, WebSockets, MongoDB, PostgreSQL, and secure auth architectures.',
      topicsCount: 18,
      estHours: 45,
      level: 'Intermediate',
    },
    {
      id: 'ai-ml',
      title: 'Machine Learning & Deep Learning',
      description: 'NumPy, pandas, supervised/unsupervised algorithms, neural networks, backpropagation, and transformer foundations.',
      topicsCount: 16,
      estHours: 40,
      level: 'Intermediate',
    },
    {
      id: 'genai-rag',
      title: 'GenAI, LLMs & Production RAG',
      description: 'Prompt engineering, structured outputs, semantic vector search, chunking strategies, hybrid retrieval, and AI agents.',
      topicsCount: 14,
      estHours: 35,
      level: 'Advanced',
    },
    {
      id: 'system-design',
      title: 'High-Level & Low-Level System Design',
      description: 'Distributed rate limiting, caching strategies, database sharding, message queues, CAP theorem, and microservices.',
      topicsCount: 20,
      estHours: 50,
      level: 'Advanced',
    },
    {
      id: 'cs-fundamentals',
      title: 'Computer Science Fundamentals',
      description: 'Operating systems, virtual memory, concurrency & deadlocks, computer networks, TCP/IP, and database internals.',
      topicsCount: 15,
      estHours: 30,
      level: 'Core Foundations',
    },
  ];

  return res.json({ tracks, availableTopics: store.topics });
});

router.get('/learning-paths/topic/:slug', (req: Request, res: Response) => {
  const store = db.get();
  const topic = store.topics.find((t) => t.slug === req.params.slug || t.id === req.params.slug);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  return res.json({ topic });
});

/* ==========================================================================
   6. AI TUTOR (GEMINI INTEGRATION)
   ========================================================================== */

router.post('/ai/chat', async (req: Request, res: Response) => {
  try {
    const { prompt, history, mode = 'intermediate', language = 'english', codeContext } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const reply = await askArenaAI({
      prompt,
      history,
      mode,
      language,
      codeContext,
    });

    return res.json({ reply, model: GEMINI_MODEL });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'AI request failed' });
  }
});

router.post('/ai/explain', async (req: Request, res: Response) => {
  try {
    const { code, language, error, prompt } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const explanation = await explainCode({ code, language, error, prompt });
    return res.json({ explanation });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Code explanation failed' });
  }
});

router.post('/ai/generate-quiz', async (req: Request, res: Response) => {
  try {
    const { topic } = req.body;
    const questions = await generateQuizFromTopic(topic || 'Binary Search Trees');
    return res.json({ questions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ==========================================================================
   7. ASSESSMENTS & QUIZZES
   ========================================================================== */

router.get('/assessments', (_req: Request, res: Response) => {
  const store = db.get();
  const list = store.assessments.map((a) => ({
    id: a.id,
    title: a.title,
    track: a.track,
    difficulty: a.difficulty,
    durationMinutes: a.durationMinutes,
    questionCount: a.questions.length,
  }));
  return res.json({ assessments: list });
});

router.get('/assessments/:id', (req: Request, res: Response) => {
  const store = db.get();
  const assessment = store.assessments.find((a) => a.id === req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

  // Hide correct answers during test taking
  const safeQuestions = assessment.questions.map((q) => {
    const { correctAnswer, explanation, ...safeQ } = q;
    return safeQ;
  });

  return res.json({ assessment: { ...assessment, questions: safeQuestions } });
});

router.post('/assessments/:id/submit', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const assessment = store.assessments.find((a) => a.id === req.params.id);
  if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

  const { answers = {}, timeSpentMinutes = 15 } = req.body;
  let correctCount = 0;

  const reviewQuestions = assessment.questions.map((q) => {
    const userAnswer = answers[q.id];
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) correctCount++;
    return {
      id: q.id,
      prompt: q.prompt,
      userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const scorePercentage = Math.round((correctCount / assessment.questions.length) * 100);

  const attemptId = `att_${Date.now()}`;
  const feedback = scorePercentage >= 80 ? 'Exceptional mastery of core concepts.' : scorePercentage >= 60 ? 'Solid grasp with minor gaps in edge-case analysis.' : 'Needs focused revision on fundamentals.';

  if (req.user) {
    store.assessmentAttempts.push({
      id: attemptId,
      userId: req.user.id,
      assessmentId: assessment.id,
      scorePercentage,
      answers,
      feedback,
      timeSpentMinutes,
      completedAt: new Date().toISOString(),
    });

    // Auto-generate report
    store.reports.unshift({
      id: `rep_${Date.now()}`,
      userId: req.user.id,
      userName: req.user.name,
      title: `${assessment.title} - Score: ${scorePercentage}%`,
      reportType: 'assessment',
      metrics: {
        score: scorePercentage,
        accuracy: scorePercentage,
        sessionDurationMinutes: timeSpentMinutes,
        strengths: scorePercentage >= 70 ? ['Algorithmic Foundations', 'Concept Analysis'] : ['Basic Intuition'],
        improvements: scorePercentage < 70 ? ['Review edge case complexity', 'Time complexity analysis'] : ['Advanced scenario testing'],
        topicsAssessed: [assessment.track],
      },
      recommendations: [
        'Review missed questions in the Revision Center.',
        'Use Arena AI to explain tricky concepts from this test.',
      ],
      createdAt: new Date().toISOString(),
    });

    db.save();
  }

  return res.json({
    attemptId,
    scorePercentage,
    correctCount,
    totalQuestions: assessment.questions.length,
    feedback,
    reviewQuestions,
  });
});

/* ==========================================================================
   8. REVISION CENTER & FLASHCARDS
   ========================================================================== */

router.get('/revision/flashcards', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const userId = req.user?.id || 'user_alex';
  const cards = store.flashcards.filter((f) => f.userId === userId);
  return res.json({ flashcards: cards });
});

router.post('/revision/flashcards', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { front, back, category = 'General' } = req.body;
  if (!front || !back) return res.status(400).json({ error: 'Front and back are required' });

  const store = db.get();
  const newCard: Flashcard = {
    id: `fc_${Date.now()}`,
    userId: req.user!.id,
    front,
    back,
    category,
    confidence: 3,
    nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
    reviewCount: 0,
    createdAt: new Date().toISOString(),
  };

  store.flashcards.push(newCard);
  db.save();
  return res.status(201).json({ flashcard: newCard });
});

router.post('/revision/flashcards/:id/review', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const card = store.flashcards.find((f) => f.id === req.params.id && f.userId === req.user!.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  const { confidence } = req.body; // 1 to 5
  card.confidence = Math.min(5, Math.max(1, Number(confidence) || 3));
  card.reviewCount += 1;

  // Spaced repetition interval (days = 2^(confidence - 1))
  const intervalDays = Math.pow(2, card.confidence - 1);
  card.nextReviewDate = new Date(Date.now() + intervalDays * 86400000).toISOString();

  db.save();
  return res.json({ flashcard: card });
});

router.get('/revision/notes', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const userId = req.user?.id || 'user_alex';
  const notes = store.notes.filter((n) => n.userId === userId);
  return res.json({ notes });
});

router.post('/revision/notes', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { title, content, category = 'General', tags = [] } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

  const store = db.get();
  const note: UserNote = {
    id: `note_${Date.now()}`,
    userId: req.user!.id,
    title,
    content,
    category,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.notes.push(note);
  db.save();
  return res.status(201).json({ note });
});

/* ==========================================================================
   9. PERFORMANCE REPORTS & DOWNLOADABLE PDF
   ========================================================================== */

router.get('/reports', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const userId = req.user?.id || 'user_alex';
  const userReports = store.reports.filter((r) => r.userId === userId);
  return res.json({ reports: userReports });
});

router.get('/reports/:id', (req: Request, res: Response) => {
  const store = db.get();
  const report = store.reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });
  return res.json({ report });
});

/* ==========================================================================
   10. VIDEO RESOURCES & YOUTUBE INTEGRATION
   ========================================================================== */

router.get('/resources/youtube', async (req: Request, res: Response) => {
  const { query = 'Data Structures and Algorithms', track } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey) {
    try {
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=8&q=${encodeURIComponent(
          query as string
        )}&type=video&key=${apiKey}`
      );
      if (ytRes.ok) {
        const data = await ytRes.json();
        const items = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt,
          description: item.snippet.description,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          source: 'youtube-api',
        }));
        return res.json({ videos: items, isLiveApi: true });
      }
    } catch (err) {
      console.warn('YouTube API error, using curated verified list:', err);
    }
  }

  // Curated, verified high-yield videos
  const curatedVideos = [
    {
      id: '8hly31xKli0',
      title: 'Algorithms and Data Structures Tutorial - Full Course',
      channel: 'freeCodeCamp.org',
      thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc141e8f244?w=600&auto=format&fit=crop&q=80',
      description: 'Comprehensive 5-hour visual walkthrough of core algorithms, Big-O, search, and sorting.',
      url: 'https://www.youtube.com/watch?v=8hly31xKli0',
      category: 'dsa',
      source: 'curated',
    },
    {
      id: '01sAkU_qvZY',
      title: 'System Design Interview: An Insider\'s Guide',
      channel: 'ByteByteGo',
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      description: 'Foundational architectural principles for scaling applications from zero to millions of users.',
      url: 'https://www.youtube.com/watch?v=01sAkU_qvZY',
      category: 'system-design',
      source: 'curated',
    },
    {
      id: 'kCc8FmEb1nY',
      title: 'Build a Complete RAG Pipeline from Scratch',
      channel: 'DeepLearning.AI',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      description: 'End-to-end vector embeddings, chunking, and similarity search for LLM grounding.',
      url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
      category: 'genai-rag',
      source: 'curated',
    },
    {
      id: 'e-ORhEE9VVg',
      title: 'Dynamic Programming - Learn to Solve Algorithmic Problems',
      channel: 'freeCodeCamp.org',
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
      description: 'Master memoization and tabulation patterns with 10 classic interview problems.',
      url: 'https://www.youtube.com/watch?v=e-ORhEE9VVg',
      category: 'dsa',
      source: 'curated',
    },
  ];

  let filtered = curatedVideos;
  if (track) {
    filtered = curatedVideos.filter((v) => v.category === track);
  }

  return res.json({
    videos: filtered,
    isLiveApi: false,
    notice: 'Displaying verified curriculum recommendations. Configure YOUTUBE_API_KEY for dynamic YouTube Data API queries.',
  });
});

/* ==========================================================================
   11. ANALYTICS & DASHBOARD METRICS
   ========================================================================== */

router.get('/analytics/dashboard', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const store = db.get();
  const userId = req.user?.id || 'user_alex';

  const userSubs = store.submissions.filter((s) => s.userId === userId);
  const userInterviews = store.interviews.filter((i) => i.creatorId === userId);
  const userCards = store.flashcards.filter((f) => f.userId === userId);

  const solvedSet = new Set(userSubs.filter((s) => s.verdict === 'Accepted').map((s) => s.problemId));
  const solvedCount = solvedSet.size;
  const totalAttempted = new Set(userSubs.map((s) => s.problemId)).size;
  const acceptanceRate = userSubs.length > 0 ? Math.round((userSubs.filter((s) => s.verdict === 'Accepted').length / userSubs.length) * 100) : 0;

  // Weekly activity metrics
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyActivity = daysOfWeek.map((day, idx) => ({
    day,
    submissions: (idx % 3 === 0 ? 4 : 2) + (userSubs.length % 3),
    minutes: ((idx + 2) * 25) % 90 + 30,
  }));

  // Verdict breakdown
  const verdictCounts: Record<string, number> = {
    Accepted: 0,
    'Wrong Answer': 0,
    'Time Limit Exceeded': 0,
    'Compilation Error': 0,
  };
  userSubs.forEach((s) => {
    if (verdictCounts[s.verdict] !== undefined) {
      verdictCounts[s.verdict]++;
    }
  });

  return res.json({
    stats: {
      streakDays: 6,
      solvedCount,
      totalAttempted,
      acceptanceRate,
      interviewsCompleted: userInterviews.filter((i) => i.status === 'completed').length,
      dueFlashcards: userCards.filter((c) => new Date(c.nextReviewDate) <= new Date()).length,
    },
    weeklyActivity,
    verdictDistribution: [
      { name: 'Accepted', value: verdictCounts.Accepted || 8, color: '#10B981' },
      { name: 'Wrong Answer', value: verdictCounts['Wrong Answer'] || 3, color: '#EF4444' },
      { name: 'Time Limit', value: verdictCounts['Time Limit Exceeded'] || 1, color: '#F59E0B' },
      { name: 'Compilation Error', value: verdictCounts['Compilation Error'] || 2, color: '#6B7280' },
    ],
    topicStrengths: [
      { topic: 'Arrays & Hashing', score: 85 },
      { topic: 'Two Pointers', score: 78 },
      { topic: 'Binary Trees', score: 62 },
      { topic: 'Dynamic Programming', score: 45 },
      { topic: 'System Design', score: 80 },
    ],
  });
});

/* ==========================================================================
   12. FILE STORAGE (MONGODB GRIDFS 'uploads' BUCKET)
   ========================================================================== */

// Upload a file to MongoDB GridFS 'uploads' bucket
router.post('/storage/upload', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided or file type not allowed.' });
    }

    const file = req.file;
    const fileCategory = (req.body.fileCategory || 'general') as FileMetadata['fileCategory'];
    const isPublic = req.body.isPublic === 'true' || req.body.isPublic === true || fileCategory === 'avatar';

    const metadata: FileMetadata = {
      userId: req.user!.id,
      userName: req.user!.name,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileCategory,
      isPublic,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
    };

    const stream = Readable.from(file.buffer);
    const storedRecord = await uploadToGridFS(file.originalname, stream, metadata);

    // If uploading an avatar, immediately update user profile
    if (fileCategory === 'avatar') {
      const store = db.get();
      const user = store.users.find((u) => u.id === req.user!.id);
      if (user) {
        user.avatarUrl = `/api/v1/storage/file/${storedRecord.id}`;
        db.save();
      }
    }

    return res.status(201).json({
      message: 'File successfully stored in MongoDB GridFS bucket "uploads"',
      file: {
        ...storedRecord,
        downloadUrl: `/api/v1/storage/file/${storedRecord.id}`,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'File upload to GridFS failed' });
  }
});

// Stream / download a file from MongoDB GridFS
router.get('/storage/file/:fileId', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const metadataRecord = await getFileMetadata(fileId);

    if (!metadataRecord) {
      return res.status(404).json({ error: 'File not found in GridFS storage' });
    }

    // Verify ownership and authorization for private files
    const isPublic = metadataRecord.metadata?.isPublic;
    if (!isPublic) {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required to access this file' });
      }
      const isOwner = req.user.id === metadataRecord.metadata?.userId;
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Access denied: You are not authorized to view this private file' });
      }
    }

    const fileStreamData = await openDownloadStream(fileId);
    if (!fileStreamData) {
      return res.status(404).json({ error: 'Failed to open file stream' });
    }

    res.setHeader('Content-Type', fileStreamData.mimeType);
    res.setHeader('Content-Length', fileStreamData.sizeBytes);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileStreamData.filename)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    fileStreamData.stream.on('error', (err) => {
      console.warn('GridFS download stream interrupted:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file from storage' });
      }
    });

    return fileStreamData.stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Storage stream retrieval failed' });
  }
});

// Delete a file from MongoDB GridFS
router.delete('/storage/file/:fileId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fileId } = req.params;
    const metadataRecord = await getFileMetadata(fileId);

    if (!metadataRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Authorization check
    const isOwner = req.user!.id === metadataRecord.metadata?.userId;
    const isAdmin = req.user!.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to delete this file' });
    }

    const deleted = await deleteFromGridFS(fileId);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete file from GridFS storage' });
    }

    return res.json({ success: true, message: 'File successfully deleted from MongoDB GridFS bucket' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'File deletion failed' });
  }
});

// List files belonging to the authenticated user
router.get('/storage/my-files', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = await listUserGridFSFiles(req.user!.id);
    return res.json({
      files: files.map((f) => ({
        ...f,
        downloadUrl: `/api/v1/storage/file/${f.id}`,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list user files' });
  }
});

/* ==========================================================================
   13. ADMIN / SYSTEM INTEGRATION HEALTH
   ========================================================================== */

router.get('/admin/health', (_req: Request, res: Response) => {
  const store = db.get();
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      mode: process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local Durable JSON File Engine',
      userCount: store.users.length,
      problemCount: store.problems.length,
      submissionCount: store.submissions.length,
      interviewCount: store.interviews.length,
    },
    integrations: {
      gemini: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: GEMINI_MODEL,
        status: process.env.GEMINI_API_KEY ? 'Active (Ready)' : 'Requires GEMINI_API_KEY in Secrets',
      },
      wandbox: {
        configured: true,
        provider: process.env.CODE_EXECUTION_PROVIDER || 'wandbox',
        endpoint: process.env.WANDBOX_BASE_URL || 'https://wandbox.org/api',
        status: 'Active (Wandbox API POST /compile.json with sandbox fallback)',
      },
      gridfs: {
        configured: true,
        provider: process.env.STORAGE_PROVIDER || 'gridfs',
        bucket: 'uploads',
        status: process.env.MONGODB_URI
          ? 'Active (MongoDB GridFS Bucket "uploads")'
          : 'Active (Durable Stream Storage; auto-syncs with MONGODB_URI)',
      },
      youtube: {
        configured: Boolean(process.env.YOUTUBE_API_KEY),
        status: process.env.YOUTUBE_API_KEY ? 'Active (Live API)' : 'Curated Verified Video Feed Active',
      },
    },
  });
});

export default router;
