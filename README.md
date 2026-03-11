# Recruiter Copilot

An AI-powered candidate screening tool that helps recruiters evaluate resumes against job descriptions. Upload or paste resumes, define job requirements, and get structured screening reports with match scores, evidence-backed conclusions, and follow-up questions — all powered by Claude.

## How to Run Locally

### Prerequisites

- Node.js 18+
- Yarn (or npm)
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/sir-babagee/recruitment-reviewer.git
cd recruitment-reviewer
```

2. Install dependencies:

```bash
yarn install
```

3. Create a `.env.local` file in the project root:

```
ANTHROPIC_API_KEY=your-api-key-here
```

Optionally, override the default model:

```
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

4. Start the development server:

```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
yarn build
yarn start
```

## Technologies Used

| Technology | Version | Purpose |
|---|---|---|
| Next.js (App Router) | 16.1.6 | Full-stack React framework |
| React | 19.2.3 | UI rendering |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling (v4 with `@tailwindcss/postcss`) |
| Vercel AI SDK | 6.x | Structured output generation via `generateText` + `Output.object` |
| @ai-sdk/anthropic | 3.x | Claude provider for the AI SDK |
| Zod | 4.x | Schema validation for LLM output |
| unpdf | 1.4.0 | Serverless-friendly PDF text extraction |
| Lucide React | 0.577.0 | Icons |

**Hosted on:** Vercel

## Project Structure

```
app/
├── api/
│   ├── parse-pdf/route.ts       # PDF upload -> text extraction (unpdf)
│   └── screen/route.ts          # AI screening endpoint (Claude + AI SDK)
├── components/
│   ├── JobSetupForm.tsx          # Step 1: job title, description, requirements
│   ├── CandidatePanel.tsx        # Step 2: resume input (paste or PDF upload)
│   ├── ScreeningResults.tsx      # Step 3: results container, tabs, export
│   ├── CandidateResult.tsx       # Individual candidate report view
│   └── CompareView.tsx           # Side-by-side candidate comparison table
├── lib/
│   ├── prompts.ts                # System and user prompts sent to Claude
│   ├── schemas.ts                # Zod schema defining the screening output
│   └── types.ts                  # TypeScript interfaces
├── globals.css                   # Tailwind v4 theme and global styles
├── layout.tsx                    # Root layout with fonts
└── page.tsx                      # Main app: stepper, state management, orchestration
```

## Assumptions and Design Decisions

**Prompt engineering over fine-tuning.** The screening logic (scoring rubric, red flag detection, recommendation mapping) is entirely encoded in the system prompt. This keeps the system transparent, auditable, and easy to iterate on without model retraining.

**Structured output with fallback repair.** The AI SDK's `Output.object()` enforces the Zod schema, but LLMs can still produce malformed output. A `deepRepairJSON` function fixes double-encoded JSON strings, and `coerceToSchema` handles type mismatches (e.g., the model returning `evidence` as a string instead of an array) and pads short arrays to meet schema minimums.

**Explicit date injection.** The current date is injected into the prompt in multiple locations with strong emphasis. LLMs trained on older data tend to assume they're in a past year, which causes incorrect tenure calculations. The prompt includes a concrete arithmetic example to anchor the model.

**Client-side state only.** All application state lives in `page.tsx` via `useState`. There's no external state library — the app is simple enough that React state + prop drilling is sufficient. Sessions are persisted to `localStorage` (max 10, FIFO).

**unpdf over pdf-parse.** The original `pdf-parse` library depends on `pdfjs-dist` which requires native modules (canvas, workers) that fail in Vercel's serverless environment. `unpdf` is a pure-JavaScript alternative built specifically for serverless runtimes.

**Scoring system.** Base score of 50, with must-haves worth +10 to +15 (or -15 to -20 if missing), nice-to-haves worth +3 to +5 (no penalty if missing), and a relevance bonus for recent experience. Final score maps to Strong Yes (80-100), Maybe (50-79), or No (0-49).

**Up to 3 candidates per screening.** This keeps API costs and response times manageable while still allowing basic comparison. Candidates are screened in parallel via `Promise.all`.

## "If I Had 1 More Week..." Improvements

- **Streaming results.** Replace the current request/response flow with `streamText` so users see results populate in real-time instead of waiting 30-60 seconds for all candidates to finish.
- **Batch processing.** Support screening more than 3 candidates at once with a queue system and progress indicators.
- **Database-backed sessions.** Replace `localStorage` with a proper database (e.g., Postgres via Prisma) so sessions persist across devices and support team collaboration.
- **Authentication.** Add user accounts so recruiters can manage their own screening history and share results with hiring managers.
- **Resume parsing improvements.** Add OCR support for image-based/scanned PDFs using a service like Tesseract or a cloud OCR API.
- **Customizable scoring weights.** Let recruiters adjust how heavily must-haves vs. nice-to-haves are weighted, rather than using fixed values in the prompt.
- **Email/Slack integration.** Send screening summaries directly to hiring managers with a share link or formatted message.
- **Testing.** Add unit tests for schema validation and prompt construction, integration tests for the API routes, and E2E tests for the full screening flow.
- **Rate limiting and cost tracking.** Track API usage per session and add guards against accidental expensive runs.
- **Multi-model support.** Let users choose between different LLM providers (OpenAI, Google, etc.) for screening, with a comparison mode to see how different models evaluate the same candidate.
