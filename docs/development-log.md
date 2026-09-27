# Development log

Newest entries first. Each entry records the goal, what was built, the decisions made (and why), how it was checked, and what's left.

---

## 2026-09-27 — Slice 3: Requirements API + Step 1 page

**Goal.** Make requirements real (saved in MySQL) and build Step 1 of the tester flow: write the requirement (or attach documents), choose techniques, and draft scenarios with the AI.

**Design input.** The team had two drafts of this page: an older white design (requirements added in a small form on the project page, then a 3-tab page with an "AI module" picker) and a newer black design (one page with **4 steps**: Requirement → Scenarios → Test cases → Report). We kept the **flow of the black design** and the **look of the white design**. The black design's "API key" card was dropped: the server's own key is used (D-020). Step 1 is one column, read top to bottom, so it's easy for anyone to follow.

**What was built**
- **Backend** (`routes` → `controllers` → `dto` → `services`, like projects):
  - `requirement.routes.js`: list, create, get, edit, delete requirements under `/api/projects/:projectId/requirements`. Requirements are addressed by their number in the project (REQ-0001 = number 1).
  - Two AI endpoints: `…/:number/technique-suggestions` and `…/:number/scenario-drafts`. Each runs the Slice 2 pipeline and saves a `GenerationRun`. A successful draft replaces the scenarios and sets the status to `SCENARIOS_READY`.
  - `document.routes.js`: `POST /api/documents/extract-text` reads PDF (`unpdf`), DOCX (`mammoth`), Markdown and TXT, via `multer` in memory. Nothing is stored.
  - Swagger comments and schemas for all 8 new operations.
  - Node's request timeout raised to 10 minutes, for long AI runs.
- **Frontend**:
  - `RequirementPage` handles `/requirements/new` and `/requirements/:number`, with the 4-step tabs. Steps unlock by status.
  - Step 1 (`RequirementStep`) has three numbered cards:
    1. describe (title + details)
    2. attach files; their text is added to the details, and removing a file takes its text out again
    3. choose techniques: option cards, "Let AI choose", and "Suggest with AI", which shows the AI's reason under each card
  - "Draft scenarios" saves first, then drafts.
    - FAILED → a red message, and the page stays on Step 1.
    - NEEDS_REVIEW → Step 2 with a yellow note listing the issues.
  - Step 2 is a temporary read-only scenario list (Slice 4 builds the real one).
  - The project page lists real requirements with a status badge. "Add requirement" opens the new page.
  - A small `request()` helper (`services/http.ts`) is used for every API call and shows the backend's own error messages.
- **Removed** (no longer used): `mocks/requirements.ts`, the old Setup/Review/Validate step components, `AddRequirementForm`, `EditableTitle`, `ScenarioCard`, `utils/exporters.ts`, and their text strings. They're still in git history; Slices 4–6 rebuild those steps on real data.

**Bug found and fixed on the way.** A brand-new user's first page load sends several requests at once. On MySQL, Prisma's `upsert` is "find, then create", so two requests both tried to create the user, and one failed with 500 "Failed to load projects". `getOrCreateUser` now retries once on that unique-constraint error.

**Decisions:** D-017 (one requirement page with 4 steps), D-018 (file text merged into the editable details; files not stored), D-019 (AI endpoints answer 201 with the run's status), D-020 (no user API key).

**How it was checked**
- `npm test`: **53 tests** pass: the 42 from Slice 2, plus requirement validation (DTO) tests and document-reading tests (a hand-built PDF, a DOCX fixture, Thai Markdown/TXT, a damaged file).
- The services were run against the real database with the mock AI:
  - numbering 1, 2
  - other users get nothing
  - edit, delete (the scenarios go with it)
  - suggestion saved
  - a draft saves scenarios and sets the status
  - `MOCK_FAIL_MODE=busy` keeps the old scenarios
  - `always` → NEEDS_REVIEW
- Swagger spec: valid (`redocly lint`).
- **Browser test** (headless Chrome, a temporary Keycloak user, mock AI), end to end:
  - create a project and a requirement
  - attach MD + DOCX + a Thai-named TXT; remove one file
  - suggest techniques; draft scenarios
  - reload, edit, save
  - busy AI, needs review
  - project list, phone width (no sideways scrolling), Thai, delete

  No errors in the page. The temporary user and its data were deleted afterwards.
- Frontend `npm run lint` and `npm run build` pass.

**Follow-ups**
- Team checkpoint: try it with the real Gemini key (English and Thai requirements).
- Slice 4: the real Step 2 (select, edit, add, redraft, history of the last 10 runs with restore).
- Scanned PDFs (images only) give no text; OCR isn't planned for M1.

---

## 2026-09-27 — Slice 2 fixes from the first real Gemini runs

**Goal.** The team's first real run with a Gemini key failed. Make the pipeline robust against a slow or overloaded free-tier service.

**What happened in the real runs**
1. `gemini-3.8-flash` answered "This model is currently experiencing high demand" (HTTP 503) 3 times in a row. The old code retried immediately and used up all 3 quality attempts.
2. The suggested workaround model, `gemini-2.5-flash`, was **no longer available to new keys** (404), even though Google's pricing page still listed it.
3. Test-case generation failed with "Request contains an invalid argument" (400). Narrowed down by sending schema variants: Gemini rejected the **list-size limits** (`maxItems`) in our JSON schema.
4. After those fixes, a run passed but took **37 minutes**. A direct measurement showed one `gemini-3.8-flash` request hanging for 17 minutes, and the SDK was re-sending every request that hit our 60 s timeout.
5. A false duplicate: two boundary cases (29:59 vs 30:00) differed only in their precondition.

**What was changed**
- `ai/providers/gemini.provider.js`:
  - our own time limit per request (120 s, `AI_REQUEST_TIMEOUT_SECONDS`)
  - busy → wait 3 s / 8 s and retry the same model
  - busy or too slow → **fallback model**
  - still failing → `ProviderUnavailableError` with "try again in a few minutes"
  - 400 → stops at once
  - Google's own message is shown for "model not available"
  - the model that actually answered is reported
- `ai/providers/index.js`: new default models from measurements. Generator `gemini-3.5-flash` (fallback `gemini-3.7-flash`), validator `gemini-3.5-flash-lite` (fallback `gemini-3.1-flash-lite`).
- `ai/schemas.js`: `minItems`/`maxItems` are no longer sent to the provider; zod still checks them.
- `ai/checks/duplicates.js`: the precondition is part of the duplicate comparison.
- `ai/orchestrator.js`: records which model answered and how many **seconds** each AI call took. `try-ai.js` prints both.
- `ai/errors.js`: new `ProviderUnavailableError`; `ProviderError` can be marked `fatal`.
- Mock: new `MOCK_FAIL_MODE=busy`.

**Decisions:** D-015 (handling a slow or overloaded service; default models), D-016 (precondition in the duplicate check).

**How it was checked**
- `npm test`: **41 tests** pass, including:
  - busy → retry → success
  - busy → fallback
  - a hanging model is cut off and the fallback is used
  - both models hanging → a clear error
  - a 400 isn't retried
  - quota and bad-key errors skip the fallback
  - the fallback model is recorded
  - same steps but a different precondition isn't a duplicate
- Real SDK: a request with a 1 s limit was cancelled after 1.0 s and reported "didn't answer within 1 s".
- Real models: listed the models the key can use; `gemini-3.5-flash`, `-3.5-flash-lite`, `-3.7-flash`, `-3.8-flash` and `-3.1-flash-lite` answered; the `2.5` models returned 404.
- One real test-case request on `gemini-3.5-flash` took 30 s and 67 s in two tries (9 cases).
- A first run with the new defaults still took 1,146 s: requests ran past the 120 s limit, although the cancel signal had worked in the 1 s test. The root cause couldn't be pinned down because it didn't happen again. Fix: a **hard deadline** that stops waiting when time is up, even if the SDK ignores the cancel signal (plus a test with a request that ignores it), and an `AI_DEBUG=1` log of every request.
- **Final real end-to-end run: PASSED in about 93 s in total**, while Google was answering "busy" to most requests:
  - Scenarios: 5 busy answers → waits → fallback `gemini-3.7-flash` answered in 7 s → validator 1.6 s → **PASSED** (53 s).
  - Test cases: 1 busy answer → `gemini-3.5-flash` answered in 31 s → validator 2 s → **PASSED** (41 s). There was 1 near-duplicate *warning* (registered vs unregistered email), which is shown to the tester, as designed.
  - Output quality: boundary cases at 29:59 / 30:00 / 30:01 with the difference in the precondition, state transitions, and email partitions, all with fake data.

**Follow-ups**
- In `backend/.env`, remove `GEMINI_GENERATOR_MODEL=gemini-2.5-flash` (that model no longer works).
- Free-tier AI calls take 30–70 s each. The Step 2/3 pages (Slices 4–5) need a clear "generating…" state, and possibly background jobs later (roadmap M5).

---

## 2026-09-26 — Project docs, Swagger API docs, AI pipeline (Slice 2)

_Awaiting the team's checkpoint: a run with a real Gemini key (see "Follow-ups")._

**Goal.** Before building more features: document the project, make the API browsable, and build the AI "engine" the 4-step flow will use.

**What was built**
- **Project docs** (`docs/`):
  - [README](README.md) index
  - [architecture](architecture.md) with Mermaid system and ER diagrams
  - this development log, backfilled from the start of the project
  - [decisions](decisions.md) D-001 to D-014
  - [roadmap](roadmap.md)
  - [AI providers guide](ai-providers.md)

  The root README links here.
- **Swagger:**
  - UI at `http://localhost:5001/api/docs`, raw spec at `/api/docs.json`
  - every endpoint documented by an `@openapi` comment above its route
  - "Authorize" works with a Keycloak login (OAuth2 + PKCE) or a pasted token
  - Keycloak settings moved to `backend/config/keycloak.js`, shared with the auth middleware
- **AI pipeline** (`backend/ai/`):
  - Three functions: `suggestTechniques`, `draftScenarios`, `generateTestCases`.
  - Each runs generate → format check (zod) → code checks (duplicates, leaked secrets and personal data) → AI validator (a different model) → up to 3 attempts, where retries are told the previous issues.
  - Results: `PASSED`, `NEEDS_REVIEW` (best draft + issues), or `FAILED`.
  - Providers: **Gemini** (`@google/genai`, JSON-schema output, token usage, clear quota/key/model errors) and a **mock** (offline, with `MOCK_FAIL_MODE` to simulate failures).
  - Prompts guard against prompt injection, answer in the requirement's language, and require fake test data.
- **Developer tool:** `backend/scripts/try-ai.js` runs the pipeline from the terminal (explained in the AI guide).
- **Dependencies:** added `zod`, `@google/genai`, `swagger-ui-express`, `swagger-jsdoc`; removed `@google/generative-ai`.

**Decisions:** D-012 (Gemini SDK), D-013 (duplicates: exact fail, near warn; changed from the plan so boundary-value cases aren't rejected), D-014 (which errors stop the pipeline).

**How it was checked**
- `npm test`: 29 tests pass, covering:
  - retries and a pass on attempt 2
  - `NEEDS_REVIEW` after 3 failures
  - a quota error or bad key stops after 1 call
  - a validator outage gives `NEEDS_REVIEW`
  - format checks
  - duplicate rules (including Thai text)
  - the secret and personal-data scan
  - provider selection
- `try-ai.js` was run in every mock mode, with the expected output each time.
- The Gemini call was sent with a deliberately fake key. Google answered `API_KEY_INVALID`, which proves the request format is accepted. The pipeline stopped after 1 attempt with a clear message.
- Swagger: the spec passes `redocly lint` (2 harmless warnings: no license, localhost server), the UI shows all 4 endpoints, and a call without a token returns 401.
- All 4 Mermaid diagrams render.

**Follow-ups**
- **Team checkpoint:** create a free key at aistudio.google.com, set `GEMINI_API_KEY`, and run `try-ai.js scenarios` and `cases` on real requirements in English and Thai. Judge the quality and check the results.
- Not yet verified: that the Gemini models accept every keyword in our JSON schemas, and real output quality. Both need a real key.
- For Swagger's Keycloak login, add the redirect URI and web origin in Keycloak (see [architecture.md](architecture.md#api-docs-swagger)).
- The `openai` package is still installed but unused. Keep it for a possible OpenAI provider, or remove it.

---

## 2026-09-26 — Slice 1: database schema for the tester flow

**Commit:** `23df944` (together with the UI drafts below)

**Goal.** Create the tables the real 4-step tester flow needs, before building any API or AI code on top.

**What was built**
- New tables: `Requirement`, `GenerationRun`, `Scenario`, `TestCase`, `UserPreference` (see the ER diagram in [architecture.md](architecture.md#data-model)).
- New enums: `RequirementStatus`, `GenerationKind`, `GenerationStatus`, `ItemSource`.
- `Project.description` changed from `VARCHAR(191)` to `TEXT`, because descriptions longer than 191 characters used to fail.
- Migration `20260926144741_add_requirement_flow`.

**Decisions** (details in [decisions.md](decisions.md))
- Store a `number` and format codes like REQ-0001 in the app (D-007).
- Techniques are stored as string keys in JSON, so a new technique needs no migration (D-008).
- `GenerationRun` stores the full output snapshot (for restore) and token usage (for a future credit system) (D-009).

**How it was checked**
- A throwaway script ran against the real MySQL database, and all 9 checks passed:
  - inserts into every table, including Thai text and a 5,000-character requirement
  - duplicate REQ and TC numbers are rejected
  - deleting a requirement also deletes its runs, scenarios and test cases
  - deleting a run keeps its scenarios
  - the test data was cleaned up afterwards
- `prisma migrate diff` shows the database is identical to `schema.prisma`, and the backend boots.

---

## 2026-09-26 — Real workflow defined and roadmap agreed

**Goal.** Replace the UI-first approach with a plan built around the real tester workflow.

**Outcome**
- Main flow: **Requirement → Scenarios → Test cases → Report**, with an AI generator, a *separate* AI validator, up to 3 retries, then "needs manual review", plus a history of the last 10 generations.
- Milestone 1 (before the demo, about 2–4 weeks away) is just this flow end to end on a real database, split into 6 slices. Later milestones: test execution, history/account pages, roles, credits. See [roadmap.md](roadmap.md).
- AI provider: the Gemini free tier for now, with a mock provider for development. A paid provider is chosen later (D-005).
- Working style: one slice at a time, checked by the team between slices (D-004).

---

## 2026-09-26 — UI drafts: Dashboard, Workspace, Project, Requirement pages

**Commit:** `23df944`

**Goal.** Build the team's design (made in lovable.dev) in the real app, starting with mock data.

**What was built**
- **Design system:**
  - Tailwind tokens: colors `ink`, `brand`, `success`, `warning`, `danger`; fonts Space Grotesk, IBM Plex Sans / Sans Thai / Mono.
  - Glass-style cards and a soft gradient background.
  - New shared components: `PageHeader`, `ButtonLink`, `BackLink`, `ProgressBar`, `Dropzone`, `FieldLabel`, `SectionLabel`, `CardTitle`.
- **App shell:**
  - Sticky top nav, and a sidebar with sections and recent runs.
  - EN/TH toggle that is remembered across visits.
  - Avatar menu with the account link and logout.
- **Dashboard:** stat cards, weekly activity bar chart (pure CSS), technique mix, failing by area, quick actions, recent runs.
- **Workspace:** real project list and create-project popup, with project cards (key, coverage, requirement count, "updated 2 hours ago").
- **Project page:** add-requirement form, requirement list, coverage & traceability card.
- **Requirement page:** a 3-step draft (Setup / Review scenarios / Validate & report) with inline editing, a pass/fail/open status table, and CSV and Markdown downloads.
- **Backend:** `GET /api/projects/:id` (returns the project only if it belongs to the user).
- The whole UI was scaled down after feedback that everything looked too big.

**Decisions**
- The "Vantar QA" name and logo in the design were placeholders, so the app keeps its own name.
- Mock data sits behind service functions (`services/dashboard.ts`, `services/requirements.ts`), so pages won't change when real APIs arrive (D-002).

**How it was checked:** type-check, lint and build passed, and headless-Chrome screenshots of every page at desktop and phone widths, in English and Thai.

**Follow-ups:** these drafts get reworked into the real 4-step flow in Slices 3–6.

---

## 2026-09-25 — Codebase review, cleanup, routing and shared components

**Commit:** `6fb53d7`

**Goal.** Understand the existing code, remove leftovers from the old version of the project, and set up foundations for new pages.

**What was done**
- **Reviewed the architecture** (summarised in [architecture.md](architecture.md)).
- **Removed leftovers:**
  - the old glassmorphism `App.css`
  - the old TDD/BDD `requirements.md`
  - a duplicate root `index.html` and an empty root `package-lock.json`
  - an unused spinner
- **Fixed the frontend build:** `npm run build` was failing because the TypeScript/ESLint configs were in the repo root. They were moved into `frontend/`.
- **Added real routing** with `react-router-dom` (the back button and page links now work).
- **Added shared UI components:** `Button`, `Card`, `Badge`, `Modal`, `TextInput`/`TextArea`, `Spinner`, plus `AppLayout`.
- **Moved hardcoded URLs into config** (`frontend/src/config.ts`, backend env vars), keeping the old values as defaults.
- **Bug fixes:**
  - The Keycloak access token wasn't refreshed, so API calls failed after about 5 minutes. It's now refreshed before each request.
  - The backend loaded `.env` too late for some modules. It now loads first.
  - A `console.log` that printed the access token was removed.
- Fixed two lint errors in `AuthProvider` (split into `AuthContext.ts`).

**How it was checked:** type-check, lint and production build all passed.

---

## Before 2026-09-25 (from git history)

- 2026-09-17 to 2026-09-19: the project foundation was rebuilt:
  - projects API (`GET/POST /api/projects`)
  - i18n setup
  - custom Keycloak theme and Google login
  - backend restructured into routes, controllers, dto and services
- 2026-04 and earlier: an older single-page version generated TDD/BDD test cases directly with Gemini. It was replaced by the current project-based design.
