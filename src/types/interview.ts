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
  groqApiKey: string;
  groqModel: string;
}

export type QuestionCategory = 'technical' | 'behavioral' | 'situational' | 'background';
export type QuestionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface InterviewQuestion {
  id: string;
  index: number;
  questionText: string;
  category: QuestionCategory;
  difficulty?: 'easy' | 'medium' | 'hard';
  contextOrRationale?: string;
  isFollowUp: boolean;
  followUpForId?: string;
  followUpDepth?: number;
  status: QuestionStatus;
}

export interface AnswerEvaluation {
  score: number; // 1–10
  strengths: string[];
  missingConcepts: string[];
  areasOfImprovement: string[];
  suggestedAnswer: string;
  interviewerFeedback: string;
  shouldFollowUp: boolean;
  followUpReason?: string;
}

export interface CandidateAnswer {
  questionId: string;
  transcript: string;
  audioDurationSeconds?: number;
  startedAt: string;
  submittedAt: string;
  evaluation?: AnswerEvaluation;
  evaluationError?: string;
}

export type SessionStatus =
  | 'idle'
  | 'generating_questions'
  | 'ready'
  | 'in_progress'
  | 'evaluating'
  | 'generating_followup'
  | 'paused'
  | 'finishing'
  | 'completed';

export interface InterviewSession {
  id: string;
  status: SessionStatus;
  currentQuestionIndex: number;
  mainQuestionCount: number;
  mainQuestionsAsked: number;
  followUpsForCurrentMain: number;
  startedAt?: string;
  endedAt?: string;
  questions: InterviewQuestion[];
  answers: CandidateAnswer[];
  activeTranscript: string;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  currentError?: string | null;
}

export interface CategoryScore {
  category: string;
  score: number; // 0–100
  feedback: string;
}

export interface QuestionBreakdown {
  questionId: string;
  questionText: string;
  category: string;
  isFollowUp: boolean;
  candidateAnswer: string;
  score: number; // 0–100
  strengths: string[];
  missingConcepts: string[];
  suggestedAnswer: string;
  feedback: string;
}

export interface PerformanceReport {
  id: string;
  interviewId: string;
  jobRole: string;
  candidateName?: string;
  overallScore: number; // 0–100
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  categoryScores: CategoryScore[];
  questionBreakdowns: QuestionBreakdown[];
  mainQuestionsCount: number;
  followUpQuestionsCount: number;
  durationMinutes: number;
  createdAt: string;
}
