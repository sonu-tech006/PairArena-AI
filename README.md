# PairArena AI — Production Engineering Interview & Learning Platform

> **Tagline:** Learn. Practice. Collaborate. Get Interview-Ready.

PairArena AI is an all-in-one technical interview preparation and collaboration platform combining:
1. **Live Collaborative Coding Rooms:** Real-time synchronized Monaco Editor powered by Socket.IO, candidate presence, execution output streaming, shared timers, text chat, and structured interviewer rubrics.
2. **Multi-Language Online Compiler:** Sandboxed execution engine supporting Python, JavaScript, TypeScript, and C++ with custom input, memory limits, and sub-second execution.
3. **DSA Practice & Question Bank:** Verified problem library with public & hidden test suites, progressive hints, and optimal Big-O explanations.
4. **Structured Technical Academy:** In-depth interactive pathways covering:
   - Data Structures & Algorithms
   - Full-Stack Engineering (Node.js, Express, WebSockets, DBs)
   - Machine Learning & Deep Learning
   - Generative AI, LLMs & Production RAG
   - High-Level & Low-Level System Design
   - Computer Science Fundamentals
5. **AI Tutoring (Gemini 3.8 Flash):** Step-by-step intuition, code reviews, time/space complexity analysis, on-demand quiz generation, and Hinglish response mode.
6. **Personalized Revision Center:** Leitner-style spaced-repetition flashcards with confidence ratings (1–5), review intervals, and cheatsheet notes.
7. **Timed Assessments & PDF Reports:** Evaluated mock assessments with auto-submit and downloadable PDF reports generated via `jsPDF`.
8. **Curated Video Hub:** Masterclasses mapped to curriculum tracks with optional YouTube Data API v3 integration.
9. **Performance Analytics:** Interactive Recharts dashboards for weekly study time, problem trends, and verdict breakdown.

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7, Monaco Editor (`@monaco-editor/react`), Recharts, Lucide React, jsPDF.
- **Backend:** Node.js, Express, TypeScript (`tsx`), Socket.IO, Cookie-Parser, JWT, BcryptJS, Multer.
- **AI Engine:** Google Gemini API (`@google/genai`) using `gemini-3.8-flash`.
- **Compiler Execution:** Wandbox Cloud Compiler API (`POST /compile.json`) supporting C++, Python, JavaScript, TypeScript, and Java with request timeout, output limits, and an isolated local sandbox fallback.
- **File Storage:** MongoDB GridFS (bucket `uploads`) using the official MongoDB driver `GridFSBucket` API for streaming upload, authenticated download, and deletion of avatars, documents, and generated PDF reports.
- **Database:** Local durable JSON file engine with MongoDB Atlas client sync readiness via `MONGODB_URI`.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Available variables:
- `PORT`: Server port (default: 3000)
- `GEMINI_API_KEY`: Google Gemini API key (automatically injected in AI Studio Secrets)
- `GEMINI_MODEL`: Model identifier (default: `gemini-3.8-flash`)
- `CODE_EXECUTION_PROVIDER`: Code execution provider (`wandbox`)
- `WANDBOX_BASE_URL`: Wandbox API base URL (`https://wandbox.org/api`)
- `STORAGE_PROVIDER`: File storage provider (`gridfs`)
- `MONGODB_URI`: Existing MongoDB connection string (used for data persistence and GridFS bucket `uploads`)
- `YOUTUBE_API_KEY`: Optional YouTube Data API v3 key for dynamic video queries

### 3. Run Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## 🔑 Pre-seeded Demo Credentials

- **Interviewer Account:**
  - Email: `alex.chen@pairarena.dev`
  - Password: `DemoPassword123!`
- **Candidate Account:**
  - Email: `elena@pairarena.dev`
  - Password: `DemoPassword123!`

---

## 📡 REST API Endpoints (`/api/v1`)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/auth/login` | POST | Authenticate user & issue HTTP-only cookie + JWT |
| `/auth/register` | POST | Create new account with technical onboarding |
| `/auth/me` | GET | Retrieve authenticated profile |
| `/problems` | GET | List coding challenges with filters |
| `/problems/:slug` | GET | Get problem description, public test cases & starter code |
| `/compiler/run` | POST | Execute arbitrary code in isolated sandbox |
| `/submissions/submit` | POST | Evaluate solution against public and hidden test cases |
| `/interviews` | POST/GET | Create or list live collaborative interview rooms |
| `/interviews/:id` | GET | Retrieve room details, timer state & problem |
| `/interviews/:id/feedback` | POST | Record interviewer scorecards and issue PDF report |
| `/learning-paths` | GET | Retrieve curriculum tracks and lesson catalog |
| `/learning-paths/topic/:slug` | GET | Get lesson Markdown, code samples, and mini-quiz |
| `/ai/chat` | POST | Multi-turn coaching with Gemini 3.8 Flash |
| `/ai/explain` | POST | Deep-dive code review and Big-O complexity analysis |
| `/assessments` | GET | List timed assessments |
| `/assessments/:id/submit` | POST | Grade answers and calculate percentage score |
| `/revision/flashcards` | GET/POST | Spaced repetition flashcard queue |
| `/revision/flashcards/:id/review` | POST | Update card confidence (1-5) and next review date |
| `/storage/upload` | POST | Authenticated streaming upload of files to MongoDB GridFS `uploads` bucket |
| `/storage/file/:fileId` | GET | Stream file download with private ownership verification |
| `/storage/file/:fileId` | DELETE | Delete file from GridFS with owner/admin authorization |
| `/storage/my-files` | GET | List authenticated user's uploaded GridFS documents |
| `/reports` | GET | Retrieve performance reports for PDF download |
| `/resources/youtube` | GET | Search curated or live YouTube tutorials |
| `/admin/health` | GET | Inspect backend health, Wandbox, and GridFS status |

---

## ⚡ Socket.IO Real-Time Events

- `interview:join` — Join room with role (interviewer/candidate/observer).
- `participant:presence` — Broadcast updated room roster and avatars.
- `code:change` — Synchronize editor buffer across peers in room.
- `language:change` — Synchronize programming language selection.
- `timer:control` — Interviewer pause, start, or +15m extension actions.
- `chat:message` — Peer-to-peer interview room messaging.
- `submission:run` — Broadcast test execution events and outputs.

---

## 🛡️ Security, Compiler & Storage Architecture

1. **Wandbox Execution Provider:**
   - Compiler dispatch is routed server-side via `POST https://wandbox.org/api/compile.json`.
   - Valid compiler identifiers are used: `gcc-head` (C++), `cpython-3.12.7` (Python), `nodejs-20.17.0` (JavaScript), `typescript-5.6.2` (TypeScript), and `openjdk-jdk-21+35` (Java).
   - Upstream limits: 15s timeout, 128KB code limit, 64KB stdin limit, and 64KB output truncation to prevent memory exhaustion.
   - Resilient Fallback: If Wandbox is temporarily unreachable, rate-limited, or when executing intense hidden test suites, an isolated sandboxed child process automatically executes the code safely.

2. **MongoDB GridFS Bucket Storage (`uploads`):**
   - Reuses the configured `MONGODB_URI` connection without extra external storage accounts or credentials.
   - Stream-based data pipeline: file contents stream directly to/from `GridFSBucket` without converting or buffering large files as base64 in database documents.
   - Security & Access Control: All uploads record user metadata; private documents enforce authenticated owner/admin checks before download or deletion.
   - Validation: Enforces a 10MB maximum file size and strict MIME type allowlisting (images, PDFs, text, Markdown, WebM audio/video).

3. **Session & Data Protection:**
   - Passwords hashed with bcrypt (salt rounds 10).
   - JWT tokens signed with server-side secret and verified on protected endpoints.
   - Hidden evaluation test cases are strictly guarded server-side and never exposed to the client prior to evaluation.
