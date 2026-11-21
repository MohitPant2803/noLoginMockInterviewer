import { useConfigStore, useResumeStore, useInterviewStore, useReportStore } from '@/store';

/**
 * Convenient composite hook for accessing the active interview state
 */
export function useInterviewSession() {
  const config = useConfigStore((state) => state.config);
  const hasValidConfig = useConfigStore((state) => state.hasValidConfig());
  const resume = useResumeStore((state) => state.resume);
  const session = useInterviewStore((state) => state.session);
  const report = useReportStore((state) => state.report);

  return {
    config,
    hasValidConfig,
    resume,
    session,
    report,
  };
}
