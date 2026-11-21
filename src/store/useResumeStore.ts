import { create } from 'zustand';
import type { ResumeData } from '@/types';

interface ResumeState {
  resume: ResumeData | null;
  setResume: (resume: ResumeData) => void;
  clearResume: () => void;
  hasResume: () => boolean;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resume: null,

  setResume: (resume: ResumeData) => set({ resume }),

  clearResume: () => set({ resume: null }),

  hasResume: () => {
    const resume = get().resume;
    return Boolean(resume && (resume.rawText.trim() || resume.fileName));
  },
}));
