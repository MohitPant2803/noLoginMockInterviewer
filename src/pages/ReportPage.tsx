import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, Award, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useReportStore, useConfigStore } from '@/store';
import { ReportView } from '@/components/report/ReportView';
import { Button, Card, CardContent } from '@/components/ui';

export const ReportPage: React.FC = () => {
  const report = useReportStore((state) => state.report);
  const config = useConfigStore((state) => state.config);

  if (report) {
    return (
      <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <ReportView report={report} />
      </div>
    );
  }

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

      {/* Useful placeholder & preview overview */}
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
                Aggregated evaluation comparing your answers against industry standards for your target role.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Competency Breakdown
              </span>
              <p className="text-slate-400 leading-relaxed">
                Scores across technical mastery, problem-solving, behavioral alignment, and communication.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Strengths & Blindspots
              </span>
              <p className="text-slate-400 leading-relaxed">
                Objective feedback pinpointing concepts you articulated well and topics needing revision.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Model Answer Suggestions
              </span>
              <p className="text-slate-400 leading-relaxed">
                Constructive alternatives showing how to structure concise STAR-method answers or system design trade-offs.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Reports are kept in-memory and discarded upon tab closure.</span>
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
