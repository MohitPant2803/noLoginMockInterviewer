import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useReportStore, useConfigStore, useInterviewStore, useResumeStore } from '@/store';
import { ReportView } from '@/components/report/ReportView';
import { Button } from '@/components/ui';
import { groqService } from '@/services/groqService';
import { toast } from 'sonner';

export const ReportPage: React.FC = () => {
  const report = useReportStore((state) => state.report);
  const isLoading = useReportStore((state) => state.isLoading);
  const error = useReportStore((state) => state.error);
  const setReport = useReportStore((state) => state.setReport);
  const setIsLoading = useReportStore((state) => state.setIsLoading);
  const setError = useReportStore((state) => state.setError);

  const config = useConfigStore((state) => state.config);
  const resume = useResumeStore((state) => state.resume);
  const session = useInterviewStore((state) => state.session);

  const [isRetrying, setIsRetrying] = useState(false);

  const hasAnswers = session.answers && session.answers.length > 0;

  const handleGenerateReport = async () => {
    if (!config || !resume || !hasAnswers) {
      toast.error('Cannot generate report: missing session or answer data.');
      return;
    }

    setIsRetrying(true);
    setIsLoading(true);
    setError(null);

    const start = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const durationMin = Math.max(1, Math.round((Date.now() - start) / 60000));

    try {
      const generatedReport = await groqService.generateReport({
        config,
        resume,
        questions: session.questions.filter((q) => q.status === 'completed'),
        answers: session.answers,
        durationMinutes: durationMin,
      });
      generatedReport.interviewId = session.id;
      setReport(generatedReport);
      toast.success('Performance report generated');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Report generation failed.';
      setError(msg);
      toast.error('Failed to generate report', { description: msg });
    } finally {
      setIsRetrying(false);
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading || isRetrying) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
        <div className="max-w-md w-full text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded bg-surface-muted flex items-center justify-center text-text-secondary">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
          <h2 className="text-base font-semibold text-text-primary">
            Compiling performance scorecard
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Groq is synthesizing answer evaluations and rubric scores for {config?.jobRole || 'your session'}...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
        <div className="max-w-md w-full rounded border border-status-danger-border bg-surface p-6 text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded bg-status-danger-bg border border-status-danger-border flex items-center justify-center text-status-danger">
            <AlertCircle className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-text-primary">Report generation interrupted</h2>
            <p className="text-xs text-status-danger leading-relaxed">{error}</p>
          </div>

          <p className="text-xs text-text-muted">
            Your {session.answers.length} submitted answers remain intact in memory.
          </p>

          <div className="pt-2 flex items-center justify-center gap-2.5">
            <Link to="/interview">
              <Button variant="outline" size="sm">
                Return to studio
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateReport}
              leftIcon={<RefreshCw className="h-3 w-3" />}
            >
              Retry compilation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Completed Report
  if (report) {
    return (
      <div className="flex-1 py-4">
        <ReportView report={report} />
      </div>
    );
  }

  // Answers exist but report not yet compiled
  if (hasAnswers) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
        <div className="max-w-md w-full rounded border border-border-subtle bg-surface p-6 text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded bg-surface-muted flex items-center justify-center text-text-secondary">
            <Sparkles className="h-5 w-5" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-semibold text-text-primary">Recorded session available</h2>
            <p className="text-xs text-text-muted">
              {session.answers.length} answer(s) recorded for {config?.jobRole}.
            </p>
          </div>

          <div className="pt-2">
            <Button
              size="md"
              className="w-full"
              onClick={handleGenerateReport}
              leftIcon={<FileText className="h-3.5 w-3.5" />}
            >
              Compile evaluation report
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default empty state
  return (
    <div className="flex-1 py-12 px-4 sm:px-6 max-w-container mx-auto w-full">
      <div className="max-w-xl mx-auto text-center mb-8 space-y-2">
        <div className="mx-auto h-10 w-10 rounded bg-surface-muted flex items-center justify-center text-text-secondary">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
          Performance report
        </h1>
        <p className="text-xs text-text-muted">
          Structured evaluations and scorecards appear here after an interview session.
        </p>
      </div>

      <div className="rounded border border-border-subtle bg-surface p-6 max-w-2xl mx-auto space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded bg-canvas border border-border-subtle space-y-1">
            <span className="font-medium text-text-primary block">
              Readiness score
            </span>
            <p className="text-text-muted leading-relaxed">
              Objective benchmark score out of 100 based on answer evaluation rubrics.
            </p>
          </div>

          <div className="p-3.5 rounded bg-canvas border border-border-subtle space-y-1">
            <span className="font-medium text-text-primary block">
              Competency analysis
            </span>
            <p className="text-text-muted leading-relaxed">
              Scored breakdown across technical depth, problem-solving, and communication.
            </p>
          </div>

          <div className="p-3.5 rounded bg-canvas border border-border-subtle space-y-1">
            <span className="font-medium text-text-primary block">
              Strengths and blindspots
            </span>
            <p className="text-text-muted leading-relaxed">
              Concrete feedback highlighting clear articulations and missing concepts.
            </p>
          </div>

          <div className="p-3.5 rounded bg-canvas border border-border-subtle space-y-1">
            <span className="font-medium text-text-primary block">
              Model answers
            </span>
            <p className="text-text-muted leading-relaxed">
              Constructive suggested answers to review and practice prior to real interviews.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-status-success" />
            <span>In-memory runtime</span>
          </div>

          <Link to={config?.jobRole ? '/interview' : '/setup'}>
            <Button size="sm">
              {config?.jobRole ? 'Return to studio' : 'Configure interview'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
