import { create } from 'zustand';
import type {
  InterviewSession,
  InterviewQuestion,
  CandidateAnswer,
  SessionStatus,
} from '@/types';

interface InterviewState {
  session: InterviewSession;
  setSession: (session: Partial<InterviewSession>) => void;
  setStatus: (status: SessionStatus) => void;
  setQuestions: (questions: InterviewQuestion[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  addQuestion: (question: InterviewQuestion) => void;
  updateQuestion: (id: string, partial: Partial<InterviewQuestion>) => void;
  addAnswer: (answer: CandidateAnswer) => void;
  updateAnswer: (questionId: string, partial: Partial<CandidateAnswer>) => void;
  incrementFollowUps: () => void;
  resetFollowUps: () => void;
  incrementMainQuestionsAsked: () => void;
  setActiveTranscript: (transcript: string) => void;
  setIsListening: (isListening: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setIsMuted: (isMuted: boolean) => void;
  setError: (error: string | null) => void;
  resetSession: () => void;
  startSession: (questions: InterviewQuestion[]) => void;
  completeSession: () => void;
}

const initialSession: InterviewSession = {
  id: '',
  status: 'idle',
  currentQuestionIndex: 0,
  mainQuestionCount: 0,
  mainQuestionsAsked: 0,
  followUpsForCurrentMain: 0,
  questions: [],
  answers: [],
  activeTranscript: '',
  isListening: false,
  isSpeaking: false,
  isMuted: false,
  currentError: null,
};

export const useInterviewStore = create<InterviewState>((set) => ({
  session: initialSession,

  setSession: (partial) =>
    set((state) => ({ session: { ...state.session, ...partial } })),

  setStatus: (status) =>
    set((state) => ({ session: { ...state.session, status } })),

  setQuestions: (questions) =>
    set((state) => ({
      session: {
        ...state.session,
        questions,
        currentQuestionIndex: 0,
        status: questions.length > 0 ? 'ready' : state.session.status,
      },
    })),

  setCurrentQuestionIndex: (currentQuestionIndex) =>
    set((state) => ({ session: { ...state.session, currentQuestionIndex } })),

  addQuestion: (question) =>
    set((state) => ({
      session: {
        ...state.session,
        questions: [...state.session.questions, question],
      },
    })),

  updateQuestion: (id, partial) =>
    set((state) => ({
      session: {
        ...state.session,
        questions: state.session.questions.map((q) =>
          q.id === id ? { ...q, ...partial } : q
        ),
      },
    })),

  addAnswer: (answer) =>
    set((state) => {
      const existing = state.session.answers.findIndex(
        (a) => a.questionId === answer.questionId
      );
      const newAnswers = [...state.session.answers];
      if (existing >= 0) {
        newAnswers[existing] = answer;
      } else {
        newAnswers.push(answer);
      }
      return { session: { ...state.session, answers: newAnswers, activeTranscript: '' } };
    }),

  updateAnswer: (questionId, partial) =>
    set((state) => ({
      session: {
        ...state.session,
        answers: state.session.answers.map((a) =>
          a.questionId === questionId ? { ...a, ...partial } : a
        ),
      },
    })),

  incrementFollowUps: () =>
    set((state) => ({
      session: {
        ...state.session,
        followUpsForCurrentMain: state.session.followUpsForCurrentMain + 1,
      },
    })),

  resetFollowUps: () =>
    set((state) => ({ session: { ...state.session, followUpsForCurrentMain: 0 } })),

  incrementMainQuestionsAsked: () =>
    set((state) => ({
      session: {
        ...state.session,
        mainQuestionsAsked: state.session.mainQuestionsAsked + 1,
      },
    })),

  setActiveTranscript: (activeTranscript) =>
    set((state) => ({ session: { ...state.session, activeTranscript } })),

  setIsListening: (isListening) =>
    set((state) => ({ session: { ...state.session, isListening } })),

  setIsSpeaking: (isSpeaking) =>
    set((state) => ({ session: { ...state.session, isSpeaking } })),

  setIsMuted: (isMuted) =>
    set((state) => ({ session: { ...state.session, isMuted } })),

  setError: (currentError) =>
    set((state) => ({ session: { ...state.session, currentError } })),

  resetSession: () =>
    set({ session: { ...initialSession, id: crypto.randomUUID() } }),

  startSession: (questions) =>
    set({
      session: {
        ...initialSession,
        id: crypto.randomUUID(),
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        questions,
        mainQuestionCount: questions.length,
        mainQuestionsAsked: 1,
      },
    }),

  completeSession: () =>
    set((state) => ({
      session: {
        ...state.session,
        status: 'completed',
        endedAt: new Date().toISOString(),
      },
    })),
}));
