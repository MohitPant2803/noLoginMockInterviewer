# AI-Powered Mock Interview Platform

A full-featured, voice-interactive AI mock interview platform built with React 19, Vite, TypeScript, and Tailwind CSS. The platform enables candidates to upload a PDF or DOCX resume, select a target role, participate in an adaptive voice-based technical and behavioral mock interview, tackle dynamic follow-up questions, receive structured performance evaluations, and export a comprehensive PDF scorecard.

---

## 1. Architecture, Privacy & Security Considerations

### Client-Only Architecture (Zero Server Storage)

This application is **frontend-only**. There is no custom backend, database, Express server, or remote session storage.

- **Direct Browser-to-Groq Communication**: Model requests (`generateQuestions`, `evaluateAnswer`, `generateFollowUp`, and `generateReport`) are executed directly from the candidate's browser to the Groq Cloud API (`api.groq.com`).
- **Temporary In-Memory Storage**:
  - The candidate's Groq API key is stored **only in transient React/Zustand memory**.
  - The API key, resume text, audio transcripts, and session state are **never written to `localStorage`**, `sessionStorage`, `IndexedDB`, or cookies.
  - Refreshing or closing the browser tab immediately and permanently wipes all session data from memory.
- **Data Flow & Privacy Disclosure**:
  > **Note on Data Transmission**:
  > While the application does not store data on any application server, resume text, target role context, and candidate responses are transmitted over HTTPS directly to Groq's API for AI inference. [Groq's data handling policies](https://groq.com/privacy-policy/) apply to those inference requests.
  >
  > **Security Trade-Off**: Direct client-to-API inference requires entering the API key in the browser. In browser environments, credentials exist in client memory and network inspector payloads. This architecture was chosen as a conscious, rapid-development trade-off for personal evaluation and self-practice. It is **not recommended as a production architecture for multi-user commercial software**, which should always proxy requests through a secured backend.

---

## 2. Implemented Features

### 1. In-Browser Resume Ingestion
- **Document Text Extraction**: Uses `pdfjs-dist` (via web workers) for PDF documents and `mammoth` for Word documents (`.docx`). Text extraction happens entirely inside the browser.
- **Drag-and-Drop**: Interactive dropzone supporting `.pdf` and `.docx` up to 5MB with live validation. Legacy `.doc` files are explicitly detected and rejected with conversion advice.
- **Editable Extracted Content**: Extracted resume text is populated into an editable textarea, letting candidates review, polish, or append notes before starting.
- **Direct Text Input**: Alternative tab to paste raw resume text with character and word counters.

### 2. Interview Configuration
- **Job Role Selector**: Searchable common tracks (*Software Engineer, Frontend Developer, Backend Developer, Full Stack Developer, Data Analyst, Data Scientist, Product Manager, Business Analyst*) plus a dynamic **Custom Role** input.
- **Interview Length**: Main question options: **5, 10, 15, or 20 questions** with estimated time tags. Main question counts are strictly preserved (follow-up questions do not count against the limit).
- **Interviewer Instructions**: Optional focus instructions with quick-select preset chips (*"Focus more on technical depth"*, *"Ask questions based on my projects"*, *"Include practical problem-solving questions"*, *"Make the interview challenging"*, *"Focus on fundamentals rather than advanced topics"*).
- **Groq API Key**: Masked input with a show/hide toggle and format validation (`gsk_` prefix and length checks).

### 3. Voice Interaction & Keyboard Control
- **Speech Recognition (STT)**: Integrated with the browser's native Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`). Provides live interim hearing feedback and accumulates final transcripts without duplication.
- **Hands-Free Spacebar Shortcut**: Pressing `Space` toggles microphone recording on and off, preventing default page scrolling. Automatically disabled when typing in inputs or textareas.
- **Manual Typed Input Fallback**: Candidates can seamlessly type or edit answers if a microphone is unavailable or speech recognition is unsupported.
- **Text-to-Speech (TTS)**: Built on the browser's `SpeechSynthesis` API. Speaks questions aloud with customizable mute/unmute and question replay controls. Audio automatically pauses when the candidate starts recording.

### 4. Adaptive Groq Interviewer
- **Context-Aware Question Generation**: Uses candidate resume specifics and target role to generate structured questions covering Technical, Behavioral, Situational, and Background domains with difficulty progression.
- **Real-Time Answer Evaluation**: Groq evaluates submitted answers on technical correctness, clarity, depth, and trade-off awareness, assigning a score out of 10 along with identified strengths and missing concepts.
- **Dynamic Follow-Ups**: If an answer mentions an intriguing implementation (e.g. caching strategies, architectural decisions, edge cases), the AI probes with a tailored follow-up question (capped at a maximum of 2 follow-ups per main question).

### 5. Final Performance Report & PDF Export
- **Comprehensive Scorecard**: Overall score out of 100, competency breakdown bars, and categorized evaluation.
- **Question-by-Question Deep Dive**: Accordion view of every question asked, submitted answer, score, demonstrated strengths, missing concepts, interviewer feedback, and suggested stronger model answers.
- **Actionable Recommendations**: Concrete topics to practice and revise based on observed interview performance.
- **Client-Side PDF Generation**: One-click download of a multi-page, formatted PDF report using `jspdf` and `jspdf-autotable`.

---

## 3. Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | Modern UI framework with concurrent rendering |
| **Vite 6** | Fast development server and optimized production bundler |
| **TypeScript** | Strict type safety across domain types and stores |
| **Tailwind CSS** | Utility-first dark-mode design system |
| **React Router 7** | Client-side routing with clean navigation guards |
| **Zustand 5** | Modular, strictly in-memory global state |
| **React Hook Form + Zod** | Form management and schema validation |
| **pdfjs-dist & mammoth** | Client-side PDF and DOCX document text extraction |
| **jspdf & jspdf-autotable** | In-browser PDF scorecard compilation and download |
| **Web Speech API** | Browser-native SpeechRecognition and SpeechSynthesis |
| **Groq Cloud API** | Ultra-low latency Llama-3.3-70b-versatile inference |
| **Sonner & Lucide React** | Toast notifications and accessible iconography |

---

## 4. Project Structure

```text
NologinInterviewer/
├── .env                  # Non-sensitive client environment variables
├── .env.example          # Environment variable template
├── index.html            # Vite entry point
├── package.json          # Dependencies & build scripts
├── tsconfig.json         # Strict TypeScript compiler configuration
├── vite.config.ts        # Optimized Vite configuration with chunk splitting
├── tailwind.config.js    # Design system styling tokens
└── src/
    ├── components/
    │   ├── ui/           # Atomic components (Button, Input, Textarea, Card, Badge)
    │   ├── layout/       # App chrome (Header, Footer, RootLayout)
    │   ├── landing/      # HeroSection, FeaturesSection
    │   ├── setup/        # SetupForm, ResumeInput, ApiKeyInput
    │   ├── interview/    # InterviewRoom, InterviewProgress, QuestionDisplay, AnswerInput
    │   └── report/       # ReportView (Scorecard, accordions, PDF export)
    ├── hooks/            # Custom hooks (useVoiceRecognition, useSpeechSynthesis, useInterviewSession)
    ├── lib/              # Utility helpers (cn, formatBytes) and constants
    ├── pages/            # Page routes (Landing, Setup, Interview, Report, NotFound)
    ├── routes/           # React Router route tree
    ├── services/         # Decoupled service layer (groqService, resumeService, pdfService)
    ├── store/            # Modular in-memory Zustand stores (config, resume, interview, report)
    ├── types/            # Domain TypeScript interfaces (Config, Session, Question, Report, Mammoth)
    ├── App.tsx           # Router provider root
    ├── index.css         # Tailwind base and component directives
    └── main.tsx          # Application entry point
```

---

## 5. Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (tested on Node v22)
- **Browser**: Modern Chromium-based browser (Google Chrome, Microsoft Edge, Brave) is recommended for native Web Speech API recognition support.

### Installation

```bash
# Clone the repository
git clone https://github.com/MohitPant2803/noLoginMockInterviewer.git
cd noLoginMockInterviewer

# Install dependencies
npm install
```

### Running Locally

```bash
# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Browser Compatibility & Speech API Support

- **Speech Recognition (Voice Input)**: Supported out-of-the-box in Google Chrome, Microsoft Edge, and Chromium-based browsers. If running in Firefox or Safari where `SpeechRecognition` is restricted, the UI automatically falls back to manual typed answers.
- **Speech Synthesis (Voice Playback)**: Supported in all modern evergreen browsers (Chrome, Edge, Firefox, Safari).
- **Client Document Extraction**: Fully functional in all modern browsers supporting Web Workers and `FileReader`.
- **In-Memory Longevity**: Because state is preserved in memory, refreshing or navigating away ends the current interview session. The app includes pause/resume controls and confirmation dialogs to prevent accidental session termination.
