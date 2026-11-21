import React from 'react';
import { CheckCircle, AlertTriangle, BarChart3, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PerformanceReport } from '@/types';
import { Button, Card, CardContent, Badge } from '@/components/ui';

interface ReportViewProps {
  report: PerformanceReport;
}

export const ReportView: React.FC<ReportViewProps> = ({ report }) => {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      {/* Header Summary */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="info">{report.jobRole}</Badge>
              <span className="text-xs text-slate-500">
                Completed on {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
              Mock Interview Performance Report
            </h1>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              {report.summary}
            </p>
          </div>

          {/* Overall Score Circle */}
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 min-w-[140px]">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Overall Score
            </span>
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              {report.overallScore}%
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              {report.overallScore >= 80 ? 'Strong Hire' : report.overallScore >= 65 ? 'Hire / Lean Hire' : 'Needs Practice'}
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          Competency Breakdown
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {report.categoryScores.map((cat, idx) => (
            <Card key={idx} className="border-slate-800 bg-slate-900/40">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300 capitalize">{cat.category}</span>
                  <span className="text-sm font-bold text-indigo-400">{cat.score}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 pt-1">{cat.feedback}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Demonstrated Strengths
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Improvements */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {report.areasForImprovement.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-4">
        <Link to="/setup">
          <Button variant="secondary" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Configure Another Mock Interview
          </Button>
        </Link>
      </div>
    </div>
  );
};
