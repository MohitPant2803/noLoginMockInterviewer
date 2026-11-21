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
import { Button, Badge } from '@/components/ui';
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
      toast.success('PDF report downloaded');
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartNew = () => {
    useInterviewStore.getState().resetSession();
    useReportStore.getState().clearReport();
    useResumeStore.getState().clearResume();
    useConfigStore.getState().clearConfig();
    toast.info('Session reset for a fresh interview');
    navigate('/setup');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-status-success';
    if (score >= 60) return 'text-accent-text';
    if (score >= 40) return 'text-status-warning';
    return 'text-status-danger';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: 'Strong hire', variant: 'success' as const };
    if (score >= 65) return { label: 'Hire', variant: 'info' as const };
    if (score >= 50) return { label: 'Borderline', variant: 'warning' as const };
    return { label: 'Needs practice', variant: 'outline' as const };
  };

  const rating = getScoreBadge(report.overallScore);

  return (
    <div className="max-w-container mx-auto w-full space-y-6 px-4 sm:px-6 py-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/setup')}
          leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
        >
          Setup
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleStartNew}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            New interview
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPdf}
            isLoading={isExporting}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Download PDF report
          </Button>
        </div>
      </div>

      {/* Overall Score Summary Plane */}
      <div className="rounded border border-border-subtle bg-surface p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info">{report.jobRole}</Badge>
              <Badge variant={rating.variant}>{rating.label}</Badge>
              <span className="text-xs text-text-muted">
                Completed on {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
              Interview performance evaluation
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl font-normal">
              {report.summary}
            </p>

            <div className="flex items-center gap-4 text-xs text-text-muted pt-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-text-muted" />
                <span>Duration: {report.durationMinutes} min</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-text-muted" />
                <span>{report.mainQuestionsCount} main questions</span>
              </div>
              {report.followUpQuestionsCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-text-muted" />
                  <span>{report.followUpQuestionsCount} adaptive follow-ups</span>
                </div>
              )}
            </div>
          </div>

          {/* Numeric Score Box */}
          <div className="flex flex-col items-center justify-center p-5 rounded border border-border-subtle bg-canvas shrink-0 min-w-[130px] text-center">
            <span className="text-[11px] text-text-muted font-normal mb-1">
              Overall score
            </span>
            <span className={`text-4xl font-bold tracking-tight ${getScoreColor(report.overallScore)}`}>
              {report.overallScore}
              <span className="text-lg text-text-muted font-normal">/100</span>
            </span>
            <span className="text-[11px] text-text-secondary mt-1 font-medium">
              {rating.label}
            </span>
          </div>
        </div>
      </div>

      {/* Evaluated Competency Breakdown */}
      {report.categoryScores && report.categoryScores.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Evaluated competency breakdown</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {report.categoryScores.map((cat, idx) => (
              <div key={idx} className="rounded border border-border-subtle bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">
                    {cat.category}
                  </span>
                  <span className={`text-xs font-semibold ${getScoreColor(cat.score)}`}>
                    {cat.score}%
                  </span>
                </div>
                <div className="w-full bg-surface-muted h-1.5 rounded overflow-hidden">
                  <div
                    className={`h-full rounded ${
                      cat.score >= 70
                        ? 'bg-status-success'
                        : cat.score >= 50
                        ? 'bg-accent'
                        : 'bg-status-warning'
                    }`}
                    style={{ width: `${Math.min(cat.score, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted leading-relaxed pt-0.5">
                  {cat.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="rounded border border-border-subtle bg-surface p-5 space-y-3">
          <h3 className="text-xs font-semibold text-status-success flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Demonstrated strengths</span>
          </h3>
          <ul className="space-y-2 text-xs text-text-secondary">
            {report.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-status-success mt-0.5">•</span>
                <span className="leading-relaxed">{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="rounded border border-border-subtle bg-surface p-5 space-y-3">
          <h3 className="text-xs font-semibold text-status-warning flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Areas for improvement</span>
          </h3>
          <ul className="space-y-2 text-xs text-text-secondary">
            {report.areasForImprovement.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-status-warning mt-0.5">•</span>
                <span className="leading-relaxed">{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="rounded border border-border-subtle bg-surface p-5 space-y-3">
          <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <span>Preparation recommendations</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {report.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 rounded border border-border-subtle bg-canvas text-text-secondary flex items-start gap-2 leading-relaxed"
              >
                <span className="font-mono text-text-muted font-normal shrink-0">
                  {idx + 1}.
                </span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Analysis Accordion */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">
              Question-by-question analysis
            </h2>
          </div>
          <span className="text-xs text-text-muted">
            {report.questionBreakdowns.length} questions evaluated
          </span>
        </div>

        <div className="space-y-2">
          {report.questionBreakdowns.map((qb, idx) => {
            const isExpanded = Boolean(expandedQuestions[qb.questionId]);
            return (
              <div
                key={qb.questionId || idx}
                className="rounded border border-border-subtle bg-surface overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleQuestion(qb.questionId)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
                    <span className="text-xs font-mono text-text-muted shrink-0">
                      Q{idx + 1}
                    </span>
                    <div className="overflow-hidden flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-text-muted">
                        {qb.category}
                      </span>
                      {qb.isFollowUp && (
                        <Badge variant="info" className="text-[10px]">
                          Follow-up
                        </Badge>
                      )}
                      <span className="text-xs text-text-primary font-medium truncate max-w-md">
                        {qb.questionText}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-2">
                    <span className={`text-xs font-semibold ${getScoreColor(qb.score)}`}>
                      {qb.score}%
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border-subtle space-y-3 pt-3 text-xs">
                    <div className="rounded bg-canvas p-3 border border-border-subtle space-y-1">
                      <span className="text-[11px] text-text-muted font-normal block">
                        Full question
                      </span>
                      <p className="text-xs text-text-primary leading-relaxed font-medium">
                        {qb.questionText}
                      </p>
                    </div>

                    <div className="rounded bg-canvas p-3 border border-border-subtle space-y-1">
                      <span className="text-[11px] text-text-muted font-normal block">
                        Your answer
                      </span>
                      <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                        {qb.candidateAnswer || '(No answer provided)'}
                      </p>
                    </div>

                    {qb.feedback && (
                      <div className="rounded bg-canvas p-3 border border-border-subtle space-y-1">
                        <span className="text-[11px] text-text-muted font-normal block">
                          Evaluation feedback
                        </span>
                        <p className="text-xs text-text-secondary leading-relaxed">
                          {qb.feedback}
                        </p>
                      </div>
                    )}

                    {qb.suggestedAnswer && (
                      <div className="rounded bg-accent-surface p-3 border border-accent-border space-y-1">
                        <span className="text-[11px] text-accent-text font-normal block">
                          Model answer suggestion
                        </span>
                        <p className="text-xs text-text-primary leading-relaxed">
                          {qb.suggestedAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
