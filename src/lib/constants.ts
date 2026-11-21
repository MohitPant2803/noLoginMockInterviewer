export const APP_CONFIG = {
  appName: import.meta.env.VITE_APP_NAME || 'AI Mock Interviewer',
  defaultGroqModel: import.meta.env.VITE_GROQ_DEFAULT_MODEL || 'llama-3.3-70b-versatile',
  defaultQuestionCount: 5,
  supportedQuestionCounts: [5, 10, 15, 20] as const,
  supportedFileTypes: ['.pdf', '.docx'] as const,
  supportedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ] as const,
  maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
};

export const STANDARD_ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Data Scientist',
  'Product Manager',
  'Business Analyst',
  'Custom',
] as const;

export const QUESTION_COUNT_OPTIONS = [
  {
    count: 5,
    label: '5 Questions',
    duration: '~15 min',
    description: 'Quick screening & core fundamentals',
  },
  {
    count: 10,
    label: '10 Questions',
    duration: '~30 min',
    description: 'Standard technical & behavioral round',
  },
  {
    count: 15,
    label: '15 Questions',
    duration: '~45 min',
    description: 'In-depth assessment & system design',
  },
  {
    count: 20,
    label: '20 Questions',
    duration: '~60 min',
    description: 'Comprehensive hiring loop simulation',
  },
] as const;

export const INSTRUCTION_PRESETS = [
  'Focus more on technical depth.',
  'Ask questions based on my projects.',
  'Include practical problem-solving questions.',
  'Make the interview challenging.',
  'Focus on fundamentals rather than advanced topics.',
] as const;
