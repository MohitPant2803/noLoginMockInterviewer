import type { InterviewConfig, ResumeData, InterviewQuestion, PerformanceReport, CandidateAnswer } from '@/types';

/**
 * Service layer for interacting directly with the Groq API from the browser.
 * Note: Groq integration will be implemented in subsequent phases.
 */

export interface GenerateQuestionsParams {
  config: InterviewConfig;
  resume: ResumeData;
}

export interface GenerateFollowUpParams {
  config: InterviewConfig;
  currentQuestion: InterviewQuestion;
  candidateAnswer: CandidateAnswer;
}

export interface GenerateReportParams {
  config: InterviewConfig;
  resume: ResumeData;
  questions: InterviewQuestion[];
  answers: CandidateAnswer[];
}

export const groqService = {
  /**
   * Validate user-supplied Groq API key by pinging the models endpoint.
   * To be connected in the AI integration phase.
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || !apiKey.trim().startsWith('gsk_')) {
      return false;
    }
    // Network validation stub for Phase 2
    return true;
  },

  /**
   * Generate initial interview questions based on job role and resume.
   * To be implemented in the AI integration phase.
   */
  async generateQuestions(params: GenerateQuestionsParams): Promise<InterviewQuestion[]> {
    console.info('[GroqService] generateQuestions called (stub for Phase 2)', params);
    return [];
  },

  /**
   * Generate an adaptive follow-up question based on the candidate's last answer.
   * To be implemented in the follow-up phase.
   */
  async generateFollowUp(params: GenerateFollowUpParams): Promise<InterviewQuestion | null> {
    console.info('[GroqService] generateFollowUp called (stub for Phase 2)', params);
    return null;
  },

  /**
   * Generate comprehensive final performance report.
   * To be implemented in the report generation phase.
   */
  async generateReport(params: GenerateReportParams): Promise<PerformanceReport | null> {
    console.info('[GroqService] generateReport called (stub for Phase 2)', params);
    return null;
  },
};
