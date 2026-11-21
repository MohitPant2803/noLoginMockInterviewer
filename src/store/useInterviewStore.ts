import { create } from 'zustand';
import type { InterviewSession, InterviewQuestion, CandidateAnswer } from '@/types';

interface InterviewState {
  session: InterviewSession;
  setSession: (session: Partial<InterviewSession>) => void;
  setQuestions: (questions: InterviewQuestion[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  addAnswer: (answer: CandidateAnswer) => void;
  setActiveTranscript: (transcript: string) => void;
  setIsListening: (isListening: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setError: (error: string | null) => void;
  resetSession: () => void;
}

const initialSession: InterviewSession = {
  id: '',
  status: 'idle',
  currentQuestionIndex: 0,
  questions: [],
  answers: [],
  activeTranscript: '',
  isListening: false,
  isSpeaking: false,
  currentError: null,
};

export const useInterviewStore = create<InterviewState>((set) => ({
  session: initialSession,

  setSession: (sessionPartial) =>
    set((state) => ({
      session: { ...state.session, ...sessionPartial },
    })),

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
    set((state) => ({
      session: { ...state.session, currentQuestionIndex },
    })),

  addAnswer: (answer) =>
    set((state) => {
      const existingIdx = state.session.answers.findIndex(
        (a) => a.questionId === answer.questionId
      );
      let newAnswers = [...state.session.answers];
      if (existingIdx >= 0) {
        newAnswers[existingIdx] = answer;
      } else {
        newAnswers.push(answer);
      }
      return {
        session: {
          ...state.session,
          answers: newAnswers,
          activeTranscript: '',
        },
      };
    }),

  setActiveTranscript: (activeTranscript) =>
    set((state) => ({
      session: { ...state.session, activeTranscript },
    })),

  setIsListening: (isListening) =>
    set((state) => ({
      session: { ...state.session, isListening },
    })),

  setIsSpeaking: (isSpeaking) =>
    set((state) => ({
      session: { ...state.session, isSpeaking },
    })),

  setError: (currentError) =>
    set((state) => ({
      session: { ...state.session, currentError },
    })),

  resetSession: () =>
    set({
      session: { ...initialSession, id: crypto.randomUUID() },
    }),
}));
