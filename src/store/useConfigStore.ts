import { create } from 'zustand';
import type { InterviewConfig } from '@/types';
import { APP_CONFIG } from '@/lib/constants';

interface ConfigState {
  config: InterviewConfig | null;
  setConfig: (config: InterviewConfig) => void;
  updateConfig: (partial: Partial<InterviewConfig>) => void;
  clearConfig: () => void;
  hasValidConfig: () => boolean;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,

  setConfig: (config: InterviewConfig) => set({ config }),

  updateConfig: (partial: Partial<InterviewConfig>) =>
    set((state) => ({
      config: state.config
        ? { ...state.config, ...partial }
        : {
            jobRole: '',
            questionCount: APP_CONFIG.defaultQuestionCount,
            groqApiKey: '',
            groqModel: APP_CONFIG.defaultGroqModel,
            ...partial,
          },
    })),

  clearConfig: () => set({ config: null }),

  hasValidConfig: () => {
    const config = get().config;
    return Boolean(config && config.jobRole.trim() && config.groqApiKey.trim());
  },
}));
