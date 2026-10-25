import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'learner' | 'interviewer' | 'admin';
  avatarUrl?: string;
  bio?: string;
  targetRole?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage?: string;
  learningGoals?: string[];
  createdAt: string;
}

export interface UserPreference {
  userId: string;
  theme: 'dark' | 'light';
  editorFontSize: number;
  defaultLanguage: string;
  tabSize: number;
  emailNotifications: boolean;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterTemplates: Record<string, string>;
  testCases: TestCase[];
  hints: string[];
  solutionExplanation?: string;
  tags: string[];
  acceptanceRate?: number;
  totalSubmissions?: number;
}

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  problemSlug: string;
  language: string;
  code: string;
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Compilation Error' | 'Runtime Error';
  passedCount: number;
  totalCount: number;
  executionTimeMs: number;
  memoryKb: number;
  testCaseResults: {
    testCaseId: string;
    passed: boolean;
    input?: string;
    expected?: string;
    actual?: string;
    error?: string;
    isHidden: boolean;
  }[];
  createdAt: string;
}

export interface InterviewRoom {
  id: string;
  title: string;
  description?: string;
  creatorId: string;
  creatorName: string;
  interviewerName?: string;
  interviewerRole?: string;
  interviewerAvatarUrl?: string;
  candidateEmail?: string;
  candidateName?: string;
  candidateAvatarUrl?: string;
  status: 'waiting' | 'in-progress' | 'completed';
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  problemId?: string;
  problemIds?: string[];
  activeProblemIndex?: number;
  problemCodes?: Record<string, string>;
  code: string;
  language: string;
  allowedLanguages: string[];
  interviewerNotes?: string;
  feedback?: {
    problemSolving: number;
    codeQuality: number;
    communication: number;
    complexityAnalysis: number;
    strengths: string;
    improvements: string;
    recommendation: 'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire';
  };
  events: {
    id: string;
    timestamp: string;
    type: 'joined' | 'left' | 'code_run' | 'submitted' | 'timer_start' | 'timer_pause' | 'status_change';
    actorName: string;
    details: string;
  }[];
  createdAt: string;
}

export interface LearningTopic {
  id: string;
  trackId: 'dsa' | 'fullstack' | 'ai-ml' | 'genai-rag' | 'system-design' | 'cs-fundamentals';
  slug: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estMinutes: number;
  prerequisites: string[];
  summary: string;
  contentMarkdown: string;
  codeExamples: Record<string, string>;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  interviewQuestions: string[];
  keyTakeaways: string[];
}

export interface Flashcard {
  id: string;
  userId: string;
  front: string;
  back: string;
  category: string;
  confidence: number; // 0 to 5
  nextReviewDate: string;
  reviewCount: number;
  createdAt: string;
}

export interface UserNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  title: string;
  track: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  durationMinutes: number;
  questions: {
    id: string;
    type: 'mcq' | 'multiple_select' | 'short_answer' | 'code';
    prompt: string;
    options?: string[];
    correctAnswer?: string | string[];
    explanation?: string;
    codeStarter?: string;
    language?: string;
  }[];
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  assessmentId: string;
  scorePercentage: number;
  answers: Record<string, any>;
  feedback: string;
  timeSpentMinutes: number;
  completedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  codeSnippets?: { language: string; code: string }[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface PerformanceReport {
  id: string;
  userId: string;
  userName: string;
  title: string;
  reportType: 'assessment' | 'interview' | 'weekly_dsa';
  metrics: {
    score?: number;
    problemsSolved?: number;
    accuracy?: number;
    sessionDurationMinutes?: number;
    strengths: string[];
    improvements: string[];
    topicsAssessed: string[];
  };
  recommendations: string[];
  createdAt: string;
}

// In-Memory & File-backed Store
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  preferences: UserPreference[];
  problems: Problem[];
  submissions: Submission[];
  interviews: InterviewRoom[];
  topics: LearningTopic[];
  flashcards: Flashcard[];
  notes: UserNote[];
  assessments: Assessment[];
  assessmentAttempts: AssessmentAttempt[];
  chats: ChatSession[];
  reports: PerformanceReport[];
}

let dbCache: DatabaseSchema | null = null;

export function loadDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      dbCache = JSON.parse(raw);
      return dbCache!;
    } catch (e) {
      console.warn('Could not read existing db.json, initializing fresh store.', e);
    }
  }

  dbCache = {
    users: [],
    preferences: [],
    problems: [],
    submissions: [],
    interviews: [],
    topics: [],
    flashcards: [],
    notes: [],
    assessments: [],
    assessmentAttempts: [],
    chats: [],
    reports: [],
  };
  saveDatabase();
  return dbCache;
}

export function saveDatabase(): void {
  if (!dbCache) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

export const db = {
  get: () => loadDatabase(),
  save: () => saveDatabase(),
};
