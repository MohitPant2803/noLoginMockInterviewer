import { z } from 'zod';
import type {
  InterviewConfig,
  ResumeData,
  InterviewQuestion,
  CandidateAnswer,
  AnswerEvaluation,
  PerformanceReport,
  QuestionCategory,
} from '@/types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 30000;

// ── Zod schemas for structured AI responses ────────────────────────

const questionSchema = z.object({
  questionText: z.string().min(5),
  category: z.enum(['technical', 'behavioral', 'situational', 'background']),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  contextOrRationale: z.string().optional(),
});

const questionsArraySchema = z.object({
  questions: z.array(questionSchema).min(1),
});

const evaluationSchema = z.object({
  score: z.number().min(1).max(10),
  strengths: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  areasOfImprovement: z.array(z.string()),
  suggestedAnswer: z.string(),
  interviewerFeedback: z.string(),
  shouldFollowUp: z.boolean(),
  followUpReason: z.string().optional(),
});

const followUpSchema = z.object({
  shouldFollowUp: z.boolean(),
  question: z.object({
    questionText: z.string(),
    category: z.enum(['technical', 'behavioral', 'situational', 'background']),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
    contextOrRationale: z.string().optional(),
  }).optional(),
});

const reportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  recommendations: z.array(z.string()),
  categoryScores: z.array(z.object({
    category: z.string(),
    score: z.number().min(0).max(100),
    feedback: z.string(),
  })),
  questionBreakdowns: z.array(z.object({
    questionId: z.string(),
    score: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    missingConcepts: z.array(z.string()),
    suggestedAnswer: z.string(),
    feedback: z.string(),
  })),
});

// ── Core API request helper ────────────────────────────────────────

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequestOptions {
  apiKey: string;
  model: string;
  messages: GroqMessage[];
  temperature?: number;
  maxTokens?: number;
}

class GroqApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isRateLimit: boolean = false,
    public isAuthError: boolean = false
  ) {
    super(message);
    this.name = 'GroqApiError';
  }
}

async function groqRequest(opts: GroqRequestOptions): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 4096,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const isRateLimit = response.status === 429;
      const isAuth = response.status === 401 || response.status === 403;
      let errorMsg = `Groq API error (${response.status})`;
      try {
        const errBody = await response.json();
        if (errBody?.error?.message) errorMsg = errBody.error.message;
      } catch { /* ignore parse error */ }

      throw new GroqApiError(errorMsg, response.status, isRateLimit, isAuth);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err instanceof GroqApiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new GroqApiError('Request timed out. Please try again.', 408);
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new GroqApiError('Network error. Check your internet connection.', 0);
    }
    throw new GroqApiError(
      err instanceof Error ? err.message : 'Unknown API error',
      0
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonResponse<T>(raw: string, schema: z.ZodType<T>): T {
  // Try to extract JSON from possible markdown fence
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const parsed = JSON.parse(cleaned);
  return schema.parse(parsed);
}

const FALLBACK_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

async function groqRequestWithRetry(
  opts: GroqRequestOptions,
  retries = MAX_RETRIES
): Promise<string> {
  const candidateModels = [
    opts.model,
    ...FALLBACK_MODELS.filter((m) => m !== opts.model),
  ];

  let lastError: Error | null = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await groqRequest({ ...opts, model });
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof GroqApiError) {
          if (err.isAuthError) throw err; // Don't retry auth errors

          const isModelError =
            err.statusCode === 404 ||
            err.message.toLowerCase().includes('model') ||
            err.message.toLowerCase().includes('access');

          if (isModelError) {
            // Model not found or not accessible on this key; break to try fallback model
            break;
          }

          if (err.isRateLimit && attempt < retries) {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
        }
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }
    }
  }
  throw lastError || new Error('Failed after retries');
}

// ── Helper to truncate resume for context ──────────────────────────

function truncateResume(text: string, maxChars = 2000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n... [resume truncated for context limit]';
}

function buildConversationHistory(
  questions: InterviewQuestion[],
  answers: CandidateAnswer[],
  limit = 6
): string {
  const pairs: string[] = [];
  const recent = questions.slice(-(limit));
  for (const q of recent) {
    const a = answers.find((ans) => ans.questionId === q.id);
    pairs.push(`Q: ${q.questionText}`);
    if (a) pairs.push(`A: ${a.transcript}`);
  }
  return pairs.join('\n');
}

// ── Public service API ─────────────────────────────────────────────

export interface GenerateQuestionsParams {
  config: InterviewConfig;
  resume: ResumeData;
}

export interface EvaluateAnswerParams {
  config: InterviewConfig;
  question: InterviewQuestion;
  answer: CandidateAnswer;
  resume: ResumeData;
  conversationHistory: string;
}

export interface GenerateFollowUpParams {
  config: InterviewConfig;
  currentQuestion: InterviewQuestion;
  candidateAnswer: CandidateAnswer;
  evaluation: AnswerEvaluation;
  resume: ResumeData;
  followUpCount: number;
  conversationHistory: string;
}

export interface GenerateReportParams {
  config: InterviewConfig;
  resume: ResumeData;
  questions: InterviewQuestion[];
  answers: CandidateAnswer[];
  durationMinutes: number;
}

export const groqService = {
  async validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    if (!apiKey || !apiKey.trim().startsWith('gsk_')) {
      return { valid: false, error: 'API key must start with "gsk_".' };
    }
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      if (res.ok) return { valid: true };
      if (res.status === 401) return { valid: false, error: 'Invalid API key.' };
      return { valid: false, error: `Groq responded with status ${res.status}.` };
    } catch {
      return { valid: false, error: 'Could not reach Groq. Check your internet.' };
    }
  },

  async generateQuestions(params: GenerateQuestionsParams): Promise<InterviewQuestion[]> {
    const { config, resume } = params;
    const systemPrompt = `You are an expert technical interviewer conducting a mock interview for a ${config.jobRole} position.

Generate exactly ${config.questionCount} interview questions based on the candidate's resume and target role. The questions should:
- Mix categories: technical, behavioral, situational, and background questions
- Progress from easier to harder difficulty
- Reference specifics from the resume (projects, technologies, experience)
- Be clear and specific, not vague or generic
${config.additionalInstructions ? `\nAdditional instructions from the candidate: ${config.additionalInstructions}` : ''}

Respond in JSON format:
{
  "questions": [
    {
      "questionText": "...",
      "category": "technical|behavioral|situational|background",
      "difficulty": "easy|medium|hard",
      "contextOrRationale": "Why this question is relevant"
    }
  ]
}`;

    const raw = await groqRequestWithRetry({
      apiKey: config.groqApiKey,
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Candidate's resume:\n${truncateResume(resume.rawText)}` },
      ],
      temperature: 0.75,
    });

    const parsed = parseJsonResponse(raw, questionsArraySchema);

    return parsed.questions.map((q, i) => ({
      id: crypto.randomUUID(),
      index: i,
      questionText: q.questionText,
      category: q.category as QuestionCategory,
      difficulty: q.difficulty,
      contextOrRationale: q.contextOrRationale,
      isFollowUp: false,
      followUpDepth: 0,
      status: i === 0 ? 'in_progress' as const : 'pending' as const,
    }));
  },

  async evaluateAnswer(params: EvaluateAnswerParams): Promise<AnswerEvaluation> {
    const { config, question, answer, resume, conversationHistory } = params;

    if (!answer.transcript.trim()) {
      return {
        score: 1,
        strengths: [],
        missingConcepts: ['No answer was provided'],
        areasOfImprovement: ['Provide a substantive response to interview questions'],
        suggestedAnswer: 'The candidate should prepare a structured response addressing the key aspects of the question.',
        interviewerFeedback: 'No response was given for this question.',
        shouldFollowUp: false,
      };
    }

    const systemPrompt = `You are evaluating a candidate's interview answer for a ${config.jobRole} position.

Evaluate fairly based on:
- Technical correctness
- Depth of understanding
- Clarity of explanation
- Relevance to the question
- Practical reasoning and trade-off awareness

The candidate's experience level should be considered based on their resume context.

Recent conversation context:
${conversationHistory}

Respond in JSON:
{
  "score": <1-10>,
  "strengths": ["..."],
  "missingConcepts": ["..."],
  "areasOfImprovement": ["..."],
  "suggestedAnswer": "A strong model answer...",
  "interviewerFeedback": "Brief feedback as if spoken by interviewer",
  "shouldFollowUp": true/false,
  "followUpReason": "Why a follow-up would help (optional)"
}`;

    const raw = await groqRequestWithRetry({
      apiKey: config.groqApiKey,
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Resume summary: ${truncateResume(resume.rawText, 1000)}

Question (${question.category}, ${question.difficulty || 'medium'}): ${question.questionText}

Candidate's answer: ${answer.transcript}`,
        },
      ],
      temperature: 0.5,
    });

    return parseJsonResponse(raw, evaluationSchema);
  },

  async generateFollowUp(params: GenerateFollowUpParams): Promise<InterviewQuestion | null> {
    const { config, currentQuestion, candidateAnswer, evaluation, followUpCount, conversationHistory } = params;

    if (followUpCount >= 2) return null;
    if (!evaluation.shouldFollowUp) return null;

    const systemPrompt = `You are conducting a mock interview for a ${config.jobRole} position. Based on the candidate's answer, decide whether a targeted follow-up question would meaningfully deepen the evaluation.

Rules:
- Only ask a follow-up if the candidate's answer reveals an interesting area to explore (mentioned a technology, made a claim worth probing, etc.)
- Do NOT follow up just to increase question count
- Do NOT rephrase the original question
- Keep follow-ups concise and directly based on what the candidate actually said
- This is follow-up #${followUpCount + 1}. Max allowed: 2 per main question.

Previous conversation:
${conversationHistory}

Respond in JSON:
{
  "shouldFollowUp": true/false,
  "question": {
    "questionText": "...",
    "category": "technical|behavioral|situational|background",
    "difficulty": "easy|medium|hard",
    "contextOrRationale": "..."
  }
}

If shouldFollowUp is false, omit the question field.`;

    const raw = await groqRequestWithRetry({
      apiKey: config.groqApiKey,
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Original question: ${currentQuestion.questionText}\n\nCandidate's answer: ${candidateAnswer.transcript}\n\nEvaluation note: ${evaluation.followUpReason || 'Consider probing deeper.'}`,
        },
      ],
      temperature: 0.6,
    });

    const result = parseJsonResponse(raw, followUpSchema);
    if (!result.shouldFollowUp || !result.question) return null;

    return {
      id: crypto.randomUUID(),
      index: 0, // Will be set by caller
      questionText: result.question.questionText,
      category: result.question.category as QuestionCategory,
      difficulty: result.question.difficulty,
      contextOrRationale: result.question.contextOrRationale,
      isFollowUp: true,
      followUpForId: currentQuestion.id,
      followUpDepth: (currentQuestion.followUpDepth || 0) + 1,
      status: 'in_progress',
    };
  },

  async generateReport(params: GenerateReportParams): Promise<PerformanceReport> {
    const { config, resume, questions, answers, durationMinutes } = params;

    const qaData = questions.map((q) => {
      const a = answers.find((ans) => ans.questionId === q.id);
      return {
        id: q.id,
        question: q.questionText,
        category: q.category,
        isFollowUp: q.isFollowUp,
        answer: a?.transcript || '(no answer)',
        priorScore: a?.evaluation?.score,
        priorStrengths: a?.evaluation?.strengths,
        priorMissing: a?.evaluation?.missingConcepts,
      };
    });

    const systemPrompt = `You are generating a comprehensive interview performance report for a ${config.jobRole} mock interview.

The interview had ${questions.filter((q) => !q.isFollowUp).length} main questions and ${questions.filter((q) => q.isFollowUp).length} follow-up questions over ${durationMinutes} minutes.

Provide an honest, specific assessment. Do not invent scores for skills not tested. Base your feedback only on the actual questions asked and answers given.

Question/Answer data:
${JSON.stringify(qaData, null, 2)}

Resume context: ${truncateResume(resume.rawText, 800)}

Respond in JSON:
{
  "overallScore": <0-100>,
  "summary": "2-3 sentence overall assessment",
  "strengths": ["specific strength 1", ...],
  "areasForImprovement": ["specific area 1", ...],
  "recommendations": ["actionable recommendation 1", ...],
  "categoryScores": [
    {"category": "Technical Knowledge", "score": <0-100>, "feedback": "..."},
    {"category": "Problem Solving", "score": <0-100>, "feedback": "..."},
    {"category": "Communication", "score": <0-100>, "feedback": "..."},
    {"category": "Practical Understanding", "score": <0-100>, "feedback": "..."},
    {"category": "Depth of Reasoning", "score": <0-100>, "feedback": "..."}
  ],
  "questionBreakdowns": [
    {
      "questionId": "id from input",
      "score": <0-100>,
      "strengths": ["..."],
      "missingConcepts": ["..."],
      "suggestedAnswer": "model answer",
      "feedback": "brief feedback"
    }
  ]
}

Only include category scores for areas that were actually evaluated. The questionBreakdowns must cover every question ID provided.`;

    const raw = await groqRequestWithRetry({
      apiKey: config.groqApiKey,
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the full performance report now.' },
      ],
      temperature: 0.4,
      maxTokens: 6000,
    });

    const parsed = parseJsonResponse(raw, reportSchema);

    const mainCount = questions.filter((q) => !q.isFollowUp).length;
    const followUpCount = questions.filter((q) => q.isFollowUp).length;

    return {
      id: crypto.randomUUID(),
      interviewId: '',
      jobRole: config.jobRole,
      overallScore: parsed.overallScore,
      summary: parsed.summary,
      strengths: parsed.strengths,
      areasForImprovement: parsed.areasForImprovement,
      recommendations: parsed.recommendations,
      categoryScores: parsed.categoryScores,
      questionBreakdowns: parsed.questionBreakdowns.map((qb) => {
        const q = questions.find((qq) => qq.id === qb.questionId);
        const a = answers.find((aa) => aa.questionId === qb.questionId);
        return {
          questionId: qb.questionId,
          questionText: q?.questionText || '',
          category: q?.category || '',
          isFollowUp: q?.isFollowUp || false,
          candidateAnswer: a?.transcript || '',
          score: qb.score,
          strengths: qb.strengths,
          missingConcepts: qb.missingConcepts,
          suggestedAnswer: qb.suggestedAnswer,
          feedback: qb.feedback,
        };
      }),
      mainQuestionsCount: mainCount,
      followUpQuestionsCount: followUpCount,
      durationMinutes,
      createdAt: new Date().toISOString(),
    };
  },

  buildConversationHistory,
};

export { GroqApiError };
