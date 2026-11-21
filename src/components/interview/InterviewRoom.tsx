import React from 'react';
import { Link } from 'react-router-dom';
import {
  MicOff,
  Bot,
  User,
  Settings,
  Sparkles,
  Volume2,
  AlertCircle,
  FileText,
  Key,
} from 'lucide-react';
import { useConfigStore, useResumeStore, useInterviewStore } from '@/store';
import { Button, Card, CardContent, Badge } from '@/components/ui';

export const InterviewRoom: React.FC = () => {
  const config = useConfigStore((state) => state.config);
  const resume = useResumeStore((state) => state.resume);
  const session = useInterviewStore((state) => state.session);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Top Session Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-100">{config?.jobRole}</h2>
              <Badge variant="info">Room Ready</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Scheduled questions: {config?.questionCount} • Model: {config?.groqModel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Link to="/setup">
            <Button variant="outline" size="sm" leftIcon={<Settings className="h-3.5 w-3.5" />}>
              Edit Setup
            </Button>
          </Link>
          <Link to="/report">
            <Button variant="secondary" size="sm" leftIcon={<FileText className="h-3.5 w-3.5" />}>
              Report Preview
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Interview Stage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Interviewer AI Panel */}
        <div className="md:col-span-2 space-y-4">
          <Card className="border-slate-800 bg-slate-900/40">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    AI Interviewer
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Volume2 className="h-3.5 w-3.5" />
                  <span>Voice ready</span>
                </div>
              </div>

              {/* Current Question / Prompt Card */}
              <div className="rounded-lg bg-slate-950/70 border border-slate-800/80 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-indigo-400 font-mono">
                  <span>Question 1 of {config?.questionCount}</span>
                  <Badge variant="default" className="text-[10px]">Technical & Background</Badge>
                </div>
                <p className="text-base font-medium text-slate-200 leading-relaxed">
                  "Welcome! We're excited to learn more about your experience as a{' '}
                  <span className="text-indigo-300 font-semibold">{config?.jobRole}</span>. To kick
                  things off, could you walk me through your background and a challenging project you
                  recently spearheaded?"
                </p>
              </div>

              {/* Phase setup notice */}
              <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3.5 text-xs text-indigo-300 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-indigo-200">
                    Interview Setup Active:
                  </p>
                  <p className="text-indigo-300/80 leading-relaxed">
                    Interview configuration, parsed resume, and Groq credentials are loaded into browser memory.
                    Next phase will connect live question generation and speech synthesis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Response Console */}
          <Card className="border-slate-800 bg-slate-900/40">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Candidate Response Console
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {session.isListening ? 'Listening...' : 'Ready for speech'}
                </span>
              </div>

              <div className="space-y-3">
                <textarea
                  readOnly
                  rows={4}
                  placeholder="Voice transcription and live candidate speech text will appear here during the active interview..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none resize-none cursor-default"
                />

                <div className="flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="md"
                    disabled
                    title="Audio recording will be enabled in Phase 2"
                    leftIcon={<MicOff className="h-4 w-4 text-slate-500" />}
                  >
                    Start Speaking (Phase 2)
                  </Button>

                  <Button
                    variant="primary"
                    size="md"
                    disabled
                    title="Submit answer will be enabled in Phase 2"
                  >
                    Submit Answer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: In-Memory Session Info */}
        <div className="space-y-4">
          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Session Context (In-Memory)
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Job Role:</span>
                  <span className="text-slate-200 font-medium">{config?.jobRole}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Questions:</span>
                  <span className="text-slate-200 font-medium">
                    {config?.questionCount} questions
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Resume Source:</span>
                  <span className="text-slate-200 font-medium">
                    {resume?.source === 'file'
                      ? `File: ${resume.fileName}`
                      : `Pasted Text (${resume?.rawText.length || 0} chars)`}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Groq Key:</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    Present in memory
                  </span>
                </div>

                {config?.additionalInstructions && (
                  <div>
                    <span className="text-slate-500 block">Focus Instructions:</span>
                    <span className="text-slate-300 italic">
                      "{config.additionalInstructions}"
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <AlertCircle className="h-3.5 w-3.5 text-indigo-400" />
              <span>Next Implementation Step</span>
            </div>
            <p className="leading-relaxed">
              In Phase 2, this room connects to the Groq API service to dynamically generate role-tailored questions and evaluate spoken responses in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
