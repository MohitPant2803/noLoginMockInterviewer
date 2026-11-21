import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ArrowRight,
  Award,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useReportStore, useConfigStore, useInterviewStore, useResumeStore } from '@/store';
import { ReportView } from '@/components/report/ReportView';
import { Button, Card, CardContent } from '@/components/ui';
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
      toast.success('Performance report generated!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Report generation failed.';
      setError(msg);
      toast.error('Failed to generate report', { description: msg });
    } finally {
      setIsRetrying(false);
      setIsLoading(false);
    }
  };

  // ── Loading state ──
  if (isLoading || isRetrying) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Generating Performance Report
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Groq is analyzing your responses, evaluating technical depth, and compiling a
            comprehensive assessment for <span className="text-indigo-400 font-medium">{config?.jobRole || 'your interview'}</span>...
          </p>
          <p className="text-xs text-slate-500">This takes about 10–20 seconds.</p>
        </div>
      </div>
    );
  }

  // ── Error state with Retry ──
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
        <Card className="max-w-md w-full border-red-900/50 bg-slate-900/80 text-center">
          <CardContent className="p-8 space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">Report Generation Failed</h2>
              <p className="text-xs text-red-300/90 leading-relaxed">{error}</p>
            </div>

            <p className="text-xs text-slate-400">
              Your {session.answers.length} submitted answers are safe in memory. You can retry
              generating the report without losing any data.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Link to="/interview">
                <Button variant="outline" size="sm">
                  Back to Room
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateReport}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Retry Generation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Completed Report view ──
  if (report) {
    return (
      <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <ReportView report={report} />
      </div>
    );
  }

  // ── Answers exist but report not yet compiled ──
  if (hasAnswers) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
        <Card className="max-w-md w-full border-slate-800 bg-slate-900/70 text-center">
          <CardContent className="p-8 space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">Interview Session Ready</h2>
              <p className="text-sm text-slate-400">
                You have {session.answers.length} recorded answer(s) from your mock interview for{' '}
                <span className="text-indigo-400 font-medium">{config?.jobRole}</span>.
              </p>
            </div>

            <div className="pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerateReport}
                leftIcon={<FileText className="h-4 w-4" />}
              >
                Generate Performance Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Default empty state ──
  return (
    <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="text-center max-w-xl mx-auto mb-10 space-y-3">
        <div className="mx-auto h-12 w-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          Performance Report
        </h1>
        <p className="text-sm text-slate-400">
          Detailed performance evaluations and scorecards are generated at the conclusion of an
          active mock interview session.
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/40">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Award className="h-4 w-4 text-indigo-400" />
            <span>What Your Report Will Include:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Overall Readiness Score
              </span>
              <p className="text-slate-400 leading-relaxed">
                Objective score out of 100 benchmarked against industry standards for your target role.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Competency Breakdown
              </span>
              <p className="text-slate-400 leading-relaxed">
                Categorized scoring across Technical Knowledge, Problem Solving, Communication, and Practical Reasoning.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Strengths & Blindspots
              </span>
              <p className="text-slate-400 leading-relaxed">
                Detailed feedback highlighting key concepts you explained well versus topics needing revision.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Model Answer Suggestions
              </span>
              <p className="text-slate-400 leading-relaxed">
                Suggested stronger responses for every question asked to practice before your real interview.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>In-memory only: Data is cleared when you close or refresh this tab.</span>
            </div>

            <Link to={config?.jobRole ? '/interview' : '/setup'}>
              <Button size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                {config?.jobRole ? 'Return to Interview Room' : 'Start an Interview'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
