import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  BarChart3,
  ArrowLeft,
  Download,
  Clock,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PerformanceReport } from '@/types';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { generateReportPdf } from '@/services/pdfService';
import { useConfigStore, useInterviewStore, useResumeStore, useReportStore } from '@/store';
import { toast } from 'sonner';

interface ReportViewProps {
  report: PerformanceReport;
}

export const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>(() => {
    // Expand the first two by default
    const initial: Record<string, boolean> = {};
    report.questionBreakdowns.slice(0, 2).forEach((qb) => {
      initial[qb.questionId] = true;
    });
    return initial;
  });

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDownloadPdf = () => {
    try {
      setIsExporting(true);
      generateReportPdf(report);
      toast.success('PDF Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartNew = () => {
    useInterviewStore.getState().resetSession();
    useReportStore.getState().clearReport();
    useResumeStore.getState().clearResume();
    useConfigStore.getState().clearConfig();
    toast.info('Session reset for a fresh interview.');
    navigate('/setup');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-indigo-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Strong Hire', variant: 'success' as const };
    if (score >= 65) return { label: 'Hire', variant: 'info' as const };
    if (score >= 50) return { label: 'Lean Hire / Borderline', variant: 'warning' as const };
    return { label: 'Needs Practice', variant: 'outline' as const };
  };

  const rating = getScoreBadge(report.overallScore);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 pb-12">
      {/* ── Action Header Bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/setup')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Setup
        </Button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStartNew}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            New Interview
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isExporting}
            leftIcon={<Download className="h-4 w-4" />}
            className="shadow-sm shadow-indigo-600/30"
          >
            Download PDF Report
          </Button>
        </div>
      </div>

      {/* ── Overall Performance Card ── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:p-8 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info">{report.jobRole}</Badge>
              <Badge variant={rating.variant}>{rating.label}</Badge>
              <span className="text-xs text-slate-500">
                Completed on {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              Performance Evaluation Report
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {report.summary}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span>Duration: ~{report.durationMinutes} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                <span>{report.mainQuestionsCount} Main Questions</span>
              </div>
              {report.followUpQuestionsCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{report.followUpQuestionsCount} Adaptive Follow-ups</span>
                </div>
              )}
            </div>
          </div>

          {/* Overall Score Circle */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 min-w-[150px] shadow-inner text-center">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Overall Score
            </span>
            <span
              className={`text-5xl font-extrabold tracking-tight ${getScoreColor(
                report.overallScore
              )}`}
            >
              {report.overallScore}
              <span className="text-2xl text-slate-500 font-normal">/100</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-2 font-medium">
              {rating.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Skill Breakdown ── */}
      {report.categoryScores && report.categoryScores.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">Evaluated Skill Breakdown</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {report.categoryScores.map((cat, idx) => (
              <Card key={idx} className="border-slate-800 bg-slate-900/40">
                <CardContent className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                      {cat.category}
                    </span>
                    <span className={`text-sm font-bold ${getScoreColor(cat.score)}`}>
                      {cat.score}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        cat.score >= 70
                          ? 'bg-emerald-500'
                          : cat.score >= 50
                          ? 'bg-indigo-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(cat.score, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    {cat.feedback}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Strengths & Areas of Improvement ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wide">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Demonstrated Strengths
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{str}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Improvements */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wide">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {report.areasForImprovement.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{imp}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Actionable Recommendations ── */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="h-4 w-4 shrink-0" />
              Tailored Recommendations & Preparation Guide
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {report.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="font-mono text-indigo-400 font-bold shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Question-by-Question Deep Dive ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Question-by-Question Analysis
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {report.questionBreakdowns.length} questions evaluated
          </span>
        </div>

        <div className="space-y-3">
          {report.questionBreakdowns.map((qb, idx) => {
            const isExpanded = Boolean(expandedQuestions[qb.questionId]);
            return (
              <Card
                key={qb.questionId || idx}
                className="border-slate-800 bg-slate-900/40 overflow-hidden transition-all"
              >
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => toggleQuestion(qb.questionId)}
                  className="w-full p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3 text-left hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 overflow-hidden">
                    <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 shrink-0">
                      Q{idx + 1}
                    </span>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {qb.category}
                        </span>
                        {qb.isFollowUp && (
                          <Badge variant="info" className="text-[10px]">
                            Follow-up
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {qb.questionText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span
                      className={`text-sm font-bold ${getScoreColor(qb.score)}`}
                    >
                      {qb.score}%
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-4 pb-5 sm:px-6 sm:pb-6 border-t border-slate-800/80 space-y-4 pt-4 text-xs">
                    {/* Full question */}
                    <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800/60">
                      <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
                        Question
                      </span>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {qb.questionText}
                      </p>
                    </div>

                    {/* Candidate's answer */}
                    <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800/60">
                      <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
                        Your Submitted Answer
                      </span>
                      <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                        {qb.candidateAnswer || '(No answer provided)'}
                      </p>
                    </div>

                    {/* Feedback & critique */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {qb.strengths && qb.strengths.length > 0 && (
                        <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                          <span className="text-[11px] font-semibold text-emerald-400 uppercase">
                            What you did well
                          </span>
                          <ul className="space-y-1 text-slate-300 pt-1">
                            {qb.strengths.map((s, si) => (
                              <li key={si} className="flex items-start gap-1.5">
                                <span className="text-emerald-400">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {qb.missingConcepts && qb.missingConcepts.length > 0 && (
                        <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-1">
                          <span className="text-[11px] font-semibold text-amber-400 uppercase">
                            Missing concepts or blindspots
                          </span>
                          <ul className="space-y-1 text-slate-300 pt-1">
                            {qb.missingConcepts.map((m, mi) => (
                              <li key={mi} className="flex items-start gap-1.5">
                                <span className="text-amber-400">•</span>
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Interviewer Feedback */}
                    {qb.feedback && (
                      <div className="rounded-lg bg-slate-950/60 p-3.5 border border-slate-800/60 space-y-1">
                        <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                          Interviewer Feedback
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {qb.feedback}
                        </p>
                      </div>
                    )}

                    {/* Model Answer Suggestion */}
                    {qb.suggestedAnswer && (
                      <div className="rounded-lg bg-indigo-950/20 p-3.5 border border-indigo-900/40 space-y-1">
                        <span className="text-[11px] font-semibold uppercase text-indigo-400 block">
                          Suggested Stronger Model Answer
                        </span>
                        <p className="text-slate-200 leading-relaxed">
                          {qb.suggestedAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/setup')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Return to Setup
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="md"
            onClick={handleStartNew}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Start Fresh Interview
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleDownloadPdf}
            isLoading={isExporting}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
