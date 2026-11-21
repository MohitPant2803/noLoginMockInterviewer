import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Briefcase,
  HelpCircle,
  ArrowRight,
  Clock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react';

import { useConfigStore, useResumeStore, useInterviewStore } from '@/store';
import {
  APP_CONFIG,
  STANDARD_ROLES,
  QUESTION_COUNT_OPTIONS,
  INSTRUCTION_PRESETS,
} from '@/lib/constants';
import { Button, Input, Textarea, Card, CardContent } from '@/components/ui';
import { ResumeInput } from './ResumeInput';
import { ApiKeyInput } from './ApiKeyInput';

const formSchema = z
  .object({
    roleSelection: z.string().min(1, 'Please select a job role'),
    customRole: z.string().optional(),
    questionCount: z.coerce
      .number()
      .refine((val) => [5, 10, 15, 20].includes(val), {
        message: 'Please choose 5, 10, 15, or 20 questions',
      }),
    additionalInstructions: z
      .string()
      .max(600, 'Additional instructions must be 600 characters or less')
      .optional(),
    groqApiKey: z
      .string()
      .trim()
      .min(1, 'Groq API key is required')
      .refine((val) => val.startsWith('gsk_'), {
        message: 'Groq API keys typically begin with "gsk_"',
      })
      .refine((val) => val.length >= 20, {
        message: 'Please enter a valid, complete Groq API key',
      }),
  })
  .superRefine((data, ctx) => {
    if (data.roleSelection === 'Custom') {
      if (!data.customRole || data.customRole.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['customRole'],
          message: 'Please specify your custom job role (at least 2 characters)',
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export const SetupForm: React.FC = () => {
  const navigate = useNavigate();

  const currentConfig = useConfigStore((state) => state.config);
  const setConfig = useConfigStore((state) => state.setConfig);

  const currentResume = useResumeStore((state) => state.resume);
  const setResume = useResumeStore((state) => state.setResume);

  const resetSession = useInterviewStore((state) => state.resetSession);

  // Resume state
  const [resumeSource, setResumeSource] = useState<'file' | 'paste'>(
    currentResume?.source || 'file'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState(currentResume?.rawText || '');
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Determine initial role selection
  const isCustomExistingRole =
    currentConfig?.jobRole &&
    !STANDARD_ROLES.includes(currentConfig.jobRole as (typeof STANDARD_ROLES)[number]);

  const defaultRoleSelection = isCustomExistingRole
    ? 'Custom'
    : currentConfig?.jobRole || STANDARD_ROLES[0];

  const defaultCustomRole = isCustomExistingRole ? currentConfig?.jobRole || '' : '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roleSelection: defaultRoleSelection,
      customRole: defaultCustomRole,
      questionCount: currentConfig?.questionCount || 5,
      additionalInstructions: currentConfig?.additionalInstructions || '',
      groqApiKey: currentConfig?.groqApiKey || '',
    },
  });

  const roleSelection = watch('roleSelection');
  const additionalInstructions = watch('additionalInstructions') || '';

  const handleAppendInstruction = (preset: string) => {
    const current = additionalInstructions.trim();
    if (!current) {
      setValue('additionalInstructions', preset, { shouldValidate: true });
    } else if (!current.includes(preset)) {
      setValue('additionalInstructions', `${current} ${preset}`, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: FormValues) => {
    // 1. Validate Resume content
    setResumeError(null);
    const cleanedResumeText = resumeText.trim();

    if (!cleanedResumeText || cleanedResumeText.length < 50) {
      setResumeError(
        'Usable resume content is required. Please upload a PDF/DOCX or paste at least 50 characters of experience.'
      );
      return;
    }

    // 2. Resolve job role (Standard or Custom)
    const finalJobRole =
      data.roleSelection === 'Custom' ? data.customRole?.trim() || 'Custom Role' : data.roleSelection;

    // 3. Save Resume to Zustand store
    setResume({
      source: resumeSource,
      rawText: cleanedResumeText,
      fileName: selectedFile?.name || currentResume?.fileName,
      fileSize: selectedFile?.size || currentResume?.fileSize,
      fileType: selectedFile?.type || currentResume?.fileType,
    });

    // 4. Save Config to Zustand store (Groq key in memory only)
    setConfig({
      jobRole: finalJobRole,
      questionCount: data.questionCount,
      additionalInstructions: data.additionalInstructions?.trim() || '',
      groqApiKey: data.groqApiKey.trim(),
      groqModel: APP_CONFIG.defaultGroqModel,
    });

    // 5. Initialize fresh interview session
    resetSession();

    toast.success('Interview configured successfully!', {
      description: `Targeting: ${finalJobRole} (${data.questionCount} questions)`,
    });

    // 6. Navigate to /interview
    navigate('/interview');
  };

  return (
    <Card className="max-w-3xl mx-auto border-slate-800 bg-slate-900/60 shadow-2xl backdrop-blur-sm">
      <CardContent className="p-6 sm:p-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* SECTION 1: RESUME INPUT */}
          <div className="space-y-2 border-b border-slate-800/80 pb-8">
            <ResumeInput
              source={resumeSource}
              onSourceChange={(src) => {
                setResumeSource(src);
                setResumeError(null);
              }}
              selectedFile={selectedFile}
              onFileSelect={(file) => {
                setSelectedFile(file);
                setResumeError(null);
              }}
              rawText={resumeText}
              onRawTextChange={(text) => {
                setResumeText(text);
                setResumeError(null);
              }}
              error={resumeError || undefined}
            />
          </div>

          {/* SECTION 2: JOB ROLE CONFIGURATION */}
          <div className="space-y-4 border-b border-slate-800/80 pb-8">
            <div>
              <label htmlFor="roleSelect" className="block text-sm font-semibold text-slate-200">
                Target Job Role <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your target career track or specify a specialized role.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Briefcase className="h-4 w-4" />
                </div>
                <select
                  id="roleSelect"
                  {...register('roleSelection')}
                  className="w-full appearance-none rounded-lg border border-slate-800 bg-slate-900/90 pl-10 pr-10 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {STANDARD_ROLES.map((role) => (
                    <option key={role} value={role} className="bg-slate-900 text-slate-100">
                      {role === 'Custom' ? '✨ Custom Role (Enter your own)' : role}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                  ▼
                </div>
              </div>

              {/* Custom Role Input */}
              {roleSelection === 'Custom' && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Input
                    label="Custom Job Role Title"
                    placeholder="e.g. Senior Distributed Systems Engineer / Cloud Architect"
                    required
                    error={errors.customRole?.message}
                    {...register('customRole')}
                  />
                </div>
              )}
              {errors.roleSelection && (
                <p className="text-xs text-red-400">{errors.roleSelection.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 3: INTERVIEW LENGTH / QUESTIONS */}
          <div className="space-y-4 border-b border-slate-800/80 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <ListOrdered className="h-4 w-4 text-indigo-400" />
                  Interview Length <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Main interview questions scheduled. Follow-up questions adapt dynamically.
                </p>
              </div>
            </div>

            {/* Visual Options Grid */}
            <Controller
              name="questionCount"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {QUESTION_COUNT_OPTIONS.map((opt) => {
                    const isSelected = field.value === opt.count;
                    return (
                      <button
                        type="button"
                        key={opt.count}
                        onClick={() => field.onChange(opt.count)}
                        className={`p-3.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500'
                            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`font-semibold text-sm ${
                              isSelected ? 'text-indigo-300' : 'text-slate-200'
                            }`}
                          >
                            {opt.label}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{opt.duration}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.questionCount && (
              <p className="text-xs text-red-400">{errors.questionCount.message}</p>
            )}
          </div>

          {/* SECTION 4: ADDITIONAL INSTRUCTIONS */}
          <div className="space-y-3 border-b border-slate-800/80 pb-8">
            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                Additional Interviewer Instructions{' '}
                <span className="text-xs font-normal text-slate-500">(Optional)</span>
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Guide the AI interviewer on interview tone, technical difficulty, or emphasis.
              </p>
            </div>

            <Textarea
              id="instructions"
              placeholder="e.g. Focus on distributed systems trade-offs and ask about production incidents..."
              rows={3}
              error={errors.additionalInstructions?.message}
              {...register('additionalInstructions')}
            />

            {/* Quick preset chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                Click to add preset focus areas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {INSTRUCTION_PRESETS.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => handleAppendInstruction(preset)}
                    className="text-[11px] rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 px-2.5 py-1 text-slate-300 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 5: GROQ API KEY */}
          <div className="space-y-3">
            <Controller
              name="groqApiKey"
              control={control}
              render={({ field }) => (
                <ApiKeyInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.groqApiKey?.message}
                />
              )}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <HelpCircle className="h-4 w-4 text-slate-500 shrink-0" />
              <span>All setup data is held in browser memory only.</span>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto font-semibold shadow-lg shadow-indigo-600/25 px-8"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Start Interview
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
