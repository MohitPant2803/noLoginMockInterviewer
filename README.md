# AI-Powered Mock Interview Platform

A voice-based, client-only AI mock interview platform built with React 19, Vite, TypeScript, and Tailwind CSS. Candidates can upload a resume, define their target job role, engage in realistic interviews with dynamic follow-ups, and receive detailed performance feedback.

---

## 1. Architecture & Design Decisions

### Direct Browser-to-Groq Model (Client-Only)

This application operates **entirely within the browser**. There is no backend web server (e.g. Express, Django), no persistent database, and no server-side proxy.

- **Direct API Requests**: The browser connects directly to the Groq Cloud API endpoints for model inference.
- **Why this architecture was chosen**: We chose direct browser-to-Groq communication to maximize development velocity and keep the application zero-maintenance, requiring no hosted backend infrastructure.
- **Security Implications & Trade-Offs (Transparency)**:
  > **IMPORTANT NOTICE: This architecture is NOT production-secure.**
  > Making API requests directly from client-side JavaScript means API keys and network payloads reside in the browser environment. In this version:
  > - Users supply their own Groq API key via the setup form.
  > - The API key is stored **exclusively in React memory (Zustand in-memory store)**.
  > - The key is **NEVER** persisted to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
  > - Refreshing or closing the browser window completely wipes the key, resume data, and interview transcripts.
  >
  > While this in-memory strategy protects user data from persistent disk snooping or cross-session leakage, a production-grade commercial application would proxy all LLM traffic through an authenticated backend server to prevent client exposure.

### In-Memory Privacy Model

- **No Persistence**: Resumes, transcripts, candidate responses, and generated scorecards are never written to disk or browser storage.
- **Clean Session Teardown**: Exiting or reloading the page resets all in-memory Zustand stores immediately.

---

## 2. Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/) (Data router via `createBrowserRouter`)
- **State Management**: [Zustand](https://zustand.docs.pmnd.rs/) (Strictly in-memory; no persist middleware)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Toast Notifications**: [Sonner](https://sonner.emilkowal.ski/)

---

## 3. Project Structure

```text
NologinInterviewer/
├── .env                  # Non-sensitive client environment variables
├── .env.example          # Template for environment variables
├── index.html            # Vite HTML entry point
├── package.json          # Dependencies & scripts
├── tsconfig.json         # Strict TypeScript compiler options & path aliases
├── vite.config.ts        # Vite configuration & '@' alias mapping
├── tailwind.config.js    # Tailwind styling tokens
├── src/
│   ├── components/
│   │   ├── ui/           # Atomic UI elements (Button, Input, Textarea, Card, Badge)
│   │   ├── layout/       # App chrome (Header, Footer, RootLayout)
│   │   ├── landing/      # Hero and feature overview sections
│   │   ├── setup/        # Resume upload/paste, API key input, and setup form
│   │   ├── interview/    # Interview room stage and candidate response console
│   │   └── report/       # Performance scorecard and breakdown view
│   ├── hooks/            # Custom reusable hooks (e.g., useInterviewSession)
│   ├── lib/              # Utilities (cn, formatters) and app constants
│   ├── pages/            # Route page components (Landing, Setup, Interview, Report, NotFound)
│   ├── routes/           # React Router route tree definition
│   ├── services/         # Decoupled service layer (Groq API service stubs, resume service)
│   ├── store/            # Modular Zustand in-memory state stores
│   ├── types/            # Domain TypeScript interfaces (Config, Session, Question, Report)
│   ├── App.tsx           # Router provider root component
│   ├── index.css         # Tailwind base and component styles
│   └── main.tsx          # Application entry point
```

---

## 4. Routes

| Route | Purpose | Description |
|---|---|---|
| `/` | Landing page | Value proposition, feature highlights, and entry CTA |
| `/setup` | Interview Setup | Form to configure job role, question count, resume, instructions, and Groq API key |
| `/interview` | Interview Room | Live interview staging area, audio toggle, and active transcript console |
| `/report` | Performance Report | Detailed scorecards, competency breakdown, and improvement feedback |

---

## 5. Getting Started

### Prerequisites

- Node.js 18+ (tested on Node v22)
- npm or pnpm

### Installation

```bash
# Clone or navigate into the project directory
cd NologinInterviewer

# Install dependencies
npm install
```

### Development

```bash
# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Run strict TypeScript compilation and Vite bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 6. Implementation Roadmap

- **Phase 1 (Complete)**: Frontend foundation, routing, state management, strict TypeScript types, decoupled service layer, and setup validation.
- **Phase 2 (Upcoming)**: Client-side resume parsing (PDF/DOCX extraction) and Groq API prompt generation.
- **Phase 3 (Upcoming)**: Voice interaction (Web Speech API recognition and synthesis) with real-time feedback.
- **Phase 4 (Upcoming)**: Adaptive follow-up question logic and final performance scorecard generation.
