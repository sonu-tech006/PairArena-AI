export interface User {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'interviewer' | 'admin';
  avatarUrl?: string;
  bio?: string;
  targetRole?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage?: string;
  learningGoals?: string[];
  createdAt: string;
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
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    explanation?: string;
    isHidden?: boolean;
  }[];
  hints: string[];
  solutionExplanation?: string;
  tags: string[];
  acceptanceRate?: number;
  totalSubmissions?: number;
  isSolved?: boolean;
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
    type: string;
    actorName: string;
    details: string;
  }[];
  createdAt: string;
}

export interface LearningTopic {
  id: string;
  trackId: string;
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
  confidence: number;
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
  questionCount?: number;
  questions?: {
    id: string;
    type: string;
    prompt: string;
    options?: string[];
  }[];
}

export interface PerformanceReport {
  id: string;
  userId: string;
  userName: string;
  title: string;
  reportType: 'assessment' | 'interview' | 'weekly_dsa';
  metrics: {
    score?: number;
    accuracy?: number;
    sessionDurationMinutes?: number;
    strengths: string[];
    improvements: string[];
    topicsAssessed: string[];
  };
  recommendations: string[];
  createdAt: string;
}
