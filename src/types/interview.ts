/**
 * Core domain types for AI Mock Interview Platform
 */

export type ResumeSourceType = 'paste' | 'file';

export interface ResumeData {
  source: ResumeSourceType;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  rawText: string;
  parsedSummary?: {
    candidateName?: string;
    skills?: string[];
    experienceYears?: number;
    summary?: string;
  };
}

export interface InterviewConfig {
  jobRole: string;
  questionCount: number;
  additionalInstructions?: string;
  groqApiKey: string; // Strictly stored in React memory only
  groqModel: string;
}

export type QuestionCategory = 'technical' | 'behavioral' | 'situational' | 'background';
export type QuestionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface InterviewQuestion {
  id: string;
  index: number;
  questionText: string;
  category: QuestionCategory;
  contextOrRationale?: string;
  isFollowUp?: boolean;
  followUpForId?: string;
  status: QuestionStatus;
}

export interface CandidateAnswer {
  questionId: string;
  transcript: string;
  audioDurationSeconds?: number;
  startedAt?: string;
  submittedAt: string;
  aiFeedback?: {
    score: number;
    critique: string;
    suggestedImprovement?: string;
  };
}

export type SessionStatus = 'idle' | 'ready' | 'in_progress' | 'paused' | 'completed';

export interface InterviewSession {
  id: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  startedAt?: string;
  endedAt?: string;
  questions: InterviewQuestion[];
  answers: CandidateAnswer[];
  activeTranscript: string;
  isListening: boolean;
  isSpeaking: boolean;
  currentError?: string | null;
}

export interface CategoryScore {
  category: QuestionCategory | string;
  score: number; // 0 to 100
  feedback: string;
}

export interface QuestionBreakdown {
  questionId: string;
  questionText: string;
  category: string;
  candidateAnswer: string;
  score: number; // 0 to 100
  feedback: string;
  suggestedAnswer?: string;
}

export interface PerformanceReport {
  id: string;
  interviewId: string;
  jobRole: string;
  candidateName?: string;
  overallScore: number; // 0 to 100
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  categoryScores: CategoryScore[];
  questionBreakdowns: QuestionBreakdown[];
  durationMinutes: number;
  createdAt: string;
}
