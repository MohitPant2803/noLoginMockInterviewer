import { create } from 'zustand';
import type { PerformanceReport } from '@/types';

interface ReportState {
  report: PerformanceReport | null;
  isLoading: boolean;
  error: string | null;
  setReport: (report: PerformanceReport) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearReport: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  report: null,
  isLoading: false,
  error: null,

  setReport: (report: PerformanceReport) => set({ report, isLoading: false, error: null }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error, isLoading: false }),
  clearReport: () => set({ report: null, isLoading: false, error: null }),
}));
