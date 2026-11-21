import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Briefcase,
  Clock,
  MessageSquare,
  Sparkles,
  Check,
  ListOrdered,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import { useConfigStore, useResumeStore, useInterviewStore } from '@/store';
import {
  APP_CONFIG,
  STANDARD_ROLES,
  QUESTION_COUNT_OPTIONS,
  INSTRUCTION_PRESETS,
} from '@/lib/constants';
import { Button, Input, Textarea } from '@/components/ui';
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
    groqModel: z.string().optional(),
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
      groqModel: currentConfig?.groqModel || APP_CONFIG.defaultGroqModel,
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
      groqModel: data.groqModel || APP_CONFIG.defaultGroqModel,
    });

    // 5. Initialize fresh interview session
    resetSession();

    toast.success('Interview configured', {
      description: `Target: ${finalJobRole} (${data.questionCount} questions)`,
    });

    // 6. Navigate to /interview
    navigate('/interview');
  };

  return (
    <div className="rounded border border-border-subtle bg-surface p-6 sm:p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* SECTION 1: RESUME INTAKE */}
        <div className="border-b border-border-subtle pb-7">
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

        {/* SECTION 2: JOB ROLE */}
        <div className="space-y-3 border-b border-border-subtle pb-7">
          <div>
            <label htmlFor="roleSelect" className="block text-xs font-medium text-text-secondary">
              Target job role <span className="text-status-danger">*</span>
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              Select your career track or enter a specialized position.
            </p>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                <Briefcase className="h-3.5 w-3.5" />
              </div>
              <select
                id="roleSelect"
                {...register('roleSelection')}
                className="w-full appearance-none rounded border border-border-subtle bg-canvas pl-9 pr-8 py-2 text-xs text-text-primary focus:border-border-focus focus:outline-none cursor-pointer"
              >
                {STANDARD_ROLES.map((role) => (
                  <option key={role} value={role} className="bg-surface text-text-primary">
                    {role === 'Custom' ? 'Custom role (specify below)' : role}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-[10px]">
                ▼
              </div>
            </div>

            {/* Custom Role Input */}
            {roleSelection === 'Custom' && (
              <div className="pt-1">
                <Input
                  label="Custom role title"
                  placeholder="e.g. Distributed Systems Engineer / SRE"
                  required
                  error={errors.customRole?.message}
                  {...register('customRole')}
                />
              </div>
            )}
            {errors.roleSelection && (
              <p className="text-xs text-status-danger">{errors.roleSelection.message}</p>
            )}
          </div>
        </div>

        {/* SECTION 3: INTERVIEW LENGTH */}
        <div className="space-y-3 border-b border-border-subtle pb-7">
          <div>
            <label className="block text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <ListOrdered className="h-3.5 w-3.5 text-text-muted" />
              Question count <span className="text-status-danger">*</span>
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              Number of main interview questions. Follow-up questions adapt dynamically.
            </p>
          </div>

          <Controller
            name="questionCount"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUESTION_COUNT_OPTIONS.map((opt) => {
                  const isSelected = field.value === opt.count;
                  return (
                    <button
                      type="button"
                      key={opt.count}
                      onClick={() => field.onChange(opt.count)}
                      className={`p-3.5 rounded border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-slate-900/25'
                          : 'border-border-strong bg-surface hover:border-slate-400 text-text-primary hover:bg-surface-elevated shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`font-bold text-sm ${
                            isSelected ? 'text-white' : 'text-text-primary'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {isSelected ? (
                          <span className="h-4 w-4 rounded-full bg-white text-slate-900 flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-border-strong shrink-0" />
                        )}
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-xs ${
                          isSelected ? 'text-slate-300 font-medium' : 'text-text-muted'
                        }`}
                      >
                        <Clock className={`h-3 w-3 ${isSelected ? 'text-slate-300' : 'text-text-muted'}`} />
                        <span>{opt.duration}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.questionCount && (
            <p className="text-xs text-status-danger">{errors.questionCount.message}</p>
          )}
        </div>

        {/* SECTION 4: ADDITIONAL INSTRUCTIONS */}
        <div className="space-y-3 border-b border-border-subtle pb-7">
          <div>
            <label
              htmlFor="instructions"
              className="block text-xs font-medium text-text-secondary flex items-center gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5 text-text-muted" />
              Special focus instructions{' '}
              <span className="text-[11px] text-text-muted">(optional)</span>
            </label>
            <p className="text-xs text-text-muted mt-0.5">
              Guide the interviewer on depth, technical stacks, or interview rigor.
            </p>
          </div>

          <Textarea
            id="instructions"
            placeholder="e.g. Focus on distributed consensus and high-throughput streaming systems..."
            rows={3}
            error={errors.additionalInstructions?.message}
            {...register('additionalInstructions')}
          />

          {/* Quick preset chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-text-muted" />
              Select focus preset:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {INSTRUCTION_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handleAppendInstruction(preset)}
                  className="text-xs rounded bg-surface-elevated hover:bg-surface-hover border border-border-subtle px-2 py-0.5 text-text-secondary transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 5: GROQ CREDENTIALS */}
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

        {/* SUBMIT BUTTON CTA */}
        <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <ShieldCheck className="h-4 w-4 text-status-success shrink-0" />
            <span>Session parameters and credentials reside exclusively in local browser memory.</span>
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black text-white font-semibold text-base shadow-md hover:shadow-lg transition-all rounded cursor-pointer"
            rightIcon={<ArrowRight className="h-4 w-4 text-white" />}
          >
            Start interview
          </Button>
        </div>
      </form>
    </div>
  );
};
