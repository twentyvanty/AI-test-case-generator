# Development log

Newest entries first. Each entry records the goal, what was built, the decisions made (and why), how it was checked, and what's left.

---

## 2026-11-14 — Slice 6a-1: Defects (backend)

**Goal.** First part of Slice 6: testers can log defects for a requirement. Backend only; the defect table under Step 3 is part 6b, screenshots part 6a-2.

**What was built**
- Migration `add_defects`: a `Defect` table. Number DEF-1, DEF-2… per requirement, unique and never reused (deleted ones count). Severity (Critical / Major / Minor / Trivial, default Major), priority (High / Medium / Low, default Medium), status (Open / In progress / Fixed / Closed, default Open), opened on (default today), closed on, notes, an optional linked test case.
- Rules (`services/defect-rows.js`): Closed without a date → closed today; back to Open / In progress → the close date is cleared (unless one is sent); the close date can't be before the open date. A new link must point at an active test case of the same requirement. If the linked case is deleted, the defect shows it as deleted; deleted for good → the link is cleared and the defect stays.
- Endpoints `GET/POST …/defects`, `PATCH/DELETE …/defects/:defectNumber` with `@openapi` (new Swagger tag "Defects"). A new `BadRequestError` answers 400 for a request that doesn't fit (a test case not in the requirement, dates in the wrong order).
- Recently deleted: new type `defect` (list, restore with its number, delete forever, 7-day purge). The requirement detail gains `defectCount`.
- Frontend (small): History → Recently deleted shows deleted defects as "Defect · REQ-0001 · DEF-2" and links a restored one to Step 3. EN + TH ("Defect" kept in English in Thai, like "Test Case").

**How it was checked**
- `npm test`: **144 tests** (9 new: field checks, dates, the close-date rules, API shape, the trash type).
- Migration SQL read before applying; replay check empty.
- A database check with the mock AI and two temporary users (deleted afterwards): 20 checks, including numbering after a delete, restore keeping DEF-2, another user getting 404, the linked test case deleted and then deleted for good, delete forever and the 7-day purge.
- The controllers answer 400 / 404 / 201 / 204 as documented; Swagger lists both paths.
- Frontend `tsc`, `lint`, `build` and the i18n check pass.

---

## 2026-11-14 — Stated assumptions, interrupting flows, neutral prompt examples

**Goal.** Two problems seen in Test 9 (GPT-6 Luna) and run 5 (Gemini 4 Hydrogen) of the AI Test Log, fixed as general rules rather than school-specific ones, without growing the prompts' rule count.

**What was built** (prompts only)
- `prompts/generateTestCases.js`: valid and invalid values come from the requirement; an undefined "invalid" gets a clearly wrong value and an "Assumed rule (not in the requirement): …" precondition. (Title and description rules merged to keep the count.)
- `prompts/planTestData.js`: conventions only name test data, never validation rules (in the plan prompt and the batch rules).
- `prompts/validate.js`: test cases → warn on an unstated assumption; use case → a flow that can happen during other flows must name every flow it can interrupt (and, in test cases, have a case for each).
- `techniques.js`: the same interrupting-flow rule in the use-case guidance.
- Neutral examples: "BK-" book ids instead of "SCH-" school codes; "Chapter 4 · 112", "(continued)" and "regis-tration" in the image reader instead of words from the test page.
- `docs/ai-providers.md`: "Changing a prompt: rules of thumb".

**Rule count** (rule lines per system prompt), before → after: scenarios 12 → 12, plan 11 → 11, test cases 15 → 15, scenario validator 13 → 13, test-case validator 13 → 13, image 11 → 11. Words: about +240 in total. Read through every prompt for contradictions: one found and fixed (the scenario validator was told to check "a case for each" flow, which only applies to test cases).

**Decision:** D-036.

**How it was checked:** `npm test`: **135 tests** (3 new: the assumption rule and its warn-only check; the interrupting-flow rule; no prompt contains words from the test documents). The mock can't judge prompts; the real check is one run of the school use case, which the user runs.

---

## 2026-11-14 — The image reader skips page furniture

**Goal.** Improvement 3 from Test 8 of the AI Test Log. The three stored reads of the book page (`ImageRead` #9–11, Gemini 4 Carbon, 683 words each) were otherwise exact, but contained:
- `(Contd.)`, `300 Software Testing` (running header + page number), `(Contd.)` in the middle of the Edit flow
- 4 words split at line ends (`updat-`/`ing`, `informa-`/`tion`, `mes-`/`sage`, `can-`/`celled`)
- the book's line wrapping inside sentences

**What was built** (prompt only): `ai/prompts/readImage.js` gained one rule with the only exceptions to "transcribe exactly": skip page furniture, rejoin hyphen-split words (keeping real hyphens like "e-mail" or "8-20"), join lines that only wrap inside a paragraph (without a space in Thai), and keep anything that might not be furniture.

**How it was checked:** `npm test`: **132 tests** (1 new: the rules are in the prompt, and the exact-transcription rule is still there). The mock can't read images, so the real effect needs one upload of the same page. Its `ImageRead` row can then be compared with #9–11 without another AI call.

---

## 2026-11-14 — One test-data plan for all test-case batches

**Goal.** Improvement 2 from Test 8 of the AI Test Log: batches made up their own test data (mixed school codes), and one case deleted a record other cases needed.

**What was built** (backend only)
- Migration `add_test_data_plan`: `Requirement.testDataPlan` (JSON, nullable) and the run kind `TEST_DATA_PLAN`.
- AI: `planTestData()` with a new prompt (`prompts/planTestData.js`) and schema (conventions + up to 20 records); format check for repeated ids and the sensitive-data check; at most 2 tries (the batches wait for it, and run without it if it fails); a mock answer. `ai/test-data-plan.js` keeps the plan add-only and uses only a PASSED plan.
- The test-case prompt gets the plan and the rules (shared records are read-only; a case that changes data sets up its own record, named with its scenario number). Batches now see each scenario's number. The validator gets the plan and only warns when a case breaks it.
- `generateTestCasesFor`: plan first (its own run, same `generationId`), saved on the requirement, then the batches with the plan. `refreshStatus` clears the plan when no test cases are left. History → Generated doesn't list plan runs.
- Swagger: the run kind, `testDataPlan` in the requirement detail, and the generation description.

**Decision:** D-035.

**How it was checked:**
- `npm test`: **131 tests** (10 new: the plan pipeline without a validator, at most 2 tries, secrets and repeated ids rejected and never used, add-only merge, a failed plan keeps the old one, the prompts with and without a plan, the validator only warns, the plan cleared with the last test case, History ignores plan runs).
- Migration SQL read before applying (one enum value, one nullable column); replay check empty.
- A database check with the mock AI and a temporary user (deleted afterwards): the plan is saved, both batches get the same plan, a second click only adds a record, History doesn't list it, and deleting every scenario clears it. With the AI "busy", the plan run is saved as FAILED and the batches still run without a plan.

**Follow-ups:** one paid run of the school use case to compare with Test 8 (only with the user's go-ahead); show the plan on screen later; improvement 3 (image prompt) next.

---

## 2026-11-14 — Scenarios no longer fail for "no concrete test data"

**Goal.** Fix the first of three improvements found in Test 8 of the AI Test Log: the GPT validator applied the use-case rule "concrete data" to scenarios, so good scenarios failed all 3 attempts.

**What was built** (prompts only, no code or API change)
- `ai/techniques.js`: the use-case guidance separates scenarios (one per flow, no made-up test data) from test cases (step by step, concrete test data).
- `ai/prompts/draftScenarios.js`: scenario descriptions name the requirement's inputs, conditions and values but don't invent test data.
- `ai/prompts/validate.js`: a scenario-only note: scenarios are outlines; missing test data or steps is never a fail or a warning; technique guidance about steps, test data or preconditions applies to test cases.

**Decision:** D-034.

**How it was checked:** `npm test`: **121 tests** (1 new: the note is in the scenario validator only, the test-case validator still asks for concrete values, and the generator prompt and use-case guidance say the same).

**Follow-ups:** one paid run of the same school use case to compare with Test 8 (only with the user's go-ahead). Improvements 2 (shared test-data plan across batches) and 3 (image prompt skips page furniture) come next, one at a time.

---

## 2026-11-12 — Image reads are logged (`ImageRead`)

**Goal.** Measure requirement-image reads like the other AI steps: an image test failed late at night ("Gemini is busy… Also: OpenRouter is busy…") and left no trace, because image reads weren't saved.

**What was built**
- Migration `add_image_read_log`: a new `ImageRead` table (user, file name, type, size, status, attempts, model, seconds, text, checks, tokens, error).
- `readImageText()` also returns the pipeline result and the wall time; `services/image-read.service.js` turns it into a row and saves it. The upload controller logs every image read, success or failure. A logging error never fails the upload.
- No API or screen change; Swagger's description of the upload endpoint mentions the log.

**Decision:** D-033.

**How it was checked:** `npm test`: **120 tests** (2 new: a successful and a failed read become the right rows). A database check with the mock AI: both reads saved for a temporary user (Thai file name included), and deleted with the user. Migration replay check: empty.

---

## 2026-11-12 — More test design techniques (syntax, pairwise, use case)

**Goal.** Add techniques the team asked for, after checking which ones fit a system that works from requirement text and writes manual test cases.

**What was built**
- `ai/techniques.js`: **Syntax testing**, **Combinatorial (pairwise) testing** and **Use case (scenario-based) testing**, each with a description and AI guidance that includes when the technique applies. The validator prompt gained a rule for each.
- Mock provider: scenario and test-case templates for the three techniques; a fix so boundary-value scenarios don't repeat the same limit (the mock read a number twice from the title and the description).
- Frontend: the technique list, type, and EN + TH names and descriptions; the picker now has 8 cards (7 techniques + "Let AI choose").
- README: the technique list now matches the app (it listed TDD and BDD, which the app doesn't have, and missed state transition).

**Decision:** D-032 (and why cause-effect graphing, random testing and "evidence-based" weren't added yet).

**How it was checked:** `npm test`: **118 tests** (4 new: the technique list, guidance and validator rules, the new keys in AI answers, and every technique end to end through the pipeline with the mock AI). Swagger lists the new keys. Frontend `tsc`, `lint`, `build` and the i18n check pass.

**Follow-ups:** one real-AI run per new technique on a matching requirement, logged in the AI Test Log; the team decides about the other techniques.

---

## 2026-11-12 — Slice 5: Test cases (Step 3), Report (Step 5) and History → Generated

**Goal.** Finish the main tester flow from the final mock-up: generate test cases from the scenarios, run them (Open / Pass / Fail), edit or delete them, and see coverage and downloads in a Report step. Also remove scenario priority, act on the AI's review notes, and list past generations in History.

The slice was built and checked in parts, each committed on its own, because building it all at once was hard to follow: 5a, 5b, 5c-1, 5c-2, 5d-1, 5d-2 (these docs).

**What was built**
- **5a: Priority removed, database migration.**
  - Scenario `priority` and the unused `selected` are dropped from the database, AI schema, prompt, mock, API and screens (D-028).
  - The migration `add_test_case_flow` also adds `TestCase.status` (`OPEN` / `PASS` / `FAIL`), `TestCase.runId`, `TestCase.deletedWithScenario` and `GenerationRun.reviewedAt`.
- **5b: Test-case API and the lock rules.**
  - `POST …/test-case-drafts` generates cases **only for scenarios that have none yet**; new cases continue the numbering, existing ones are never replaced. `GET / PATCH / DELETE …/test-cases` list, edit (status or text) and delete (to Recently deleted).
  - **Lock rules (D-029):** a scenario with test cases can't be edited; drafting again or restoring an earlier draft is refused once test cases exist (409); deleting a scenario takes its test cases along, and restoring it brings them back with their Pass/Fail.
  - **Batching (D-030):** test cases are generated in batches of at most 8 estimated cases, two batches at a time, each saved as its own run. A failed batch stops the generation but keeps the earlier batches' cases.
  - The requirement's status now follows what it has (no scenarios → DRAFT, scenarios → SCENARIOS_READY, test cases → CASES_READY).
  - `POST …/runs/:runId/reviewed` ("Mark as reviewed").
  - The test-case validator judges cases against the scenarios they were written for, and only fails values a scenario names (others are a warning).
- **5c-1: Steps 1 and 2.**
  - **Generate N test cases →** / **View test cases →**; a waiting message with an estimate; a clear message when only some batches succeeded.
  - Locked scenarios show "🔒 N test cases", have no Edit, and warn before deleting; Redraft and History → Restore are disabled with an explanation.
  - **"Test cases may be out of date"** panel for scenarios added after generating, with **Generate test cases for them**.
  - **Review note** for NEEDS_REVIEW runs (issues grouped as missing / technique / other, **Add a scenario for this**, **Mark as reviewed**), and collapsed **AI notes to check** for runs that passed with warnings.
  - Five step tabs: Requirement · Scenarios · Test cases · Test scripts · Report. Step 1 shows **Open scenarios →** once test cases exist.
- **5c-2: Step 3, Report and Recently deleted.**
  - Step 3 (full width, as in the mock-up): cases grouped by scenario, a pass checkbox plus an Open / Pass / Fail dropdown, a ⋯ menu with Edit (dialog) and Delete, the summary, the out-of-date banner and the notes of **every** batch's run (`caseRuns` in the requirement detail). The defect report will go under the table (Slice 6).
  - Step 5 (Report): the Coverage & traceability card with **Download report** and **Download test case table** (CSV with a Thai-safe BOM). Step 4 is a placeholder with **Skip to report**.
  - Recently deleted lists test cases, and scenarios show "+ N test cases (restored with it)".
- **5d-1: History → Generated.** `GET /api/history/generations` and a Generated card (filters, counts, Open). One click is one entry: the batches of a test-case generation share a `generationId`.

**Fixes along the way**
- **Empty AI answers** (D-031): an overloaded free host sometimes answered with no text; the app retried the same model 3 times and never tried the fallback. An empty answer now counts as "busy".
- **False "possible duplicate" notes:** the code check flagged boundary cases such as "4th / 5th / 6th link" in every real run. Titles that differ in their numbers are no longer near-duplicates.
- The waiting message showed a translation key (a plural text used without a count); the i18n check now catches this.
- The ⋯ menu closed when the page scrolled; it now moves with its button.
- Thai uses **"Test Case"** everywhere (it had "กรณีทดสอบ" and "เคส" in places).

**What real AI runs showed** (numbers in `docs/ai-providers.md` and the team's AI Test Log)
- 4 English scenarios fit one request (84 s); **8 Thai scenarios timed out** on both models. Batches of 4 scenarios still failed in Thai (101 s per batch); batches of at most 8 estimated cases passed all 26 Thai cases first try.
- **Gemini 3.5 Flash** wrote 18 test cases in about 31 s (English) and 34 s (Thai), every batch first try. OpenRouter's free models took 6.5–32 s **per case** and often needed retries. Gemini's validator, though, answered a bare "pass" every time, so it is probably a lenient judge.
- On Gemini, Thai needed 33–53% more output tokens than English for the same requirement, in about the same time.
- Gemini's confirmed free limits: Flash 5 requests a minute and 20 a day, Flash Lite 15 a minute and 500 a day.

**Decisions:** D-028, D-029, D-030, D-031.

**How it was checked**
- `npm test`: **114 tests** pass (99 + 15 new): status rule, S-key mapping and numbering, batching, test-case DTO, validator note, empty answers, boundary titles, History grouping and counts.
- A database check with the mock AI and a temporary user (23 checks): lock rules and 409s, cascade delete and restore, numbering across batches, unlock after the last case is deleted, Mark as reviewed, status rules.
- Browser checks with the mock AI and temporary users (deleted afterwards), EN and TH: Steps 1–3 and 5, the notes, the menus and dialogs, downloads, Recently deleted and History.
- Migration replay check (empty migration), Swagger lint, frontend `tsc`, `lint`, `build` and the i18n check.

**Follow-ups**
- Gemini and OpenRouter as automatic backup for each other for text, as already done for images.
- Gemini's 5-requests-a-minute limit: wait and retry instead of stopping as "limit reached".
- A fair Thai vs English rerun on OpenRouter at a quiet time (health check first).
- The sidebar's "Recent runs" still shows placeholder data (Slice 8, Dashboard).

---

## 2026-11-10 — Slice 4.6: Requirement images

**Goal.** Let testers attach requirement **images** (screenshots, scans, UI mock-ups, diagrams) in Step 1, as the team requested.

**What was built**
- **AI module:**
  - a new `IMAGE_TEXT` pipeline kind with the prompt `prompts/readImage.js` (transcribe exactly, then a `Diagram/screen:` description) and the schema `{ text }`
  - `readRequirementImage()` in `ai/index.js`
  - the generator only, with the format check and retries; no validator
- **Providers:**
  - `generateJson` accepts `images`: OpenRouter sends them as `image_url` data URLs, Gemini as inline data, and the mock returns sample text
  - a model that can't take images gets a clear "set OPENROUTER_VISION_MODEL" message, instead of the JSON-mode stepping
  - `providers/index.js` gains a **vision** role (`OPENROUTER_VISION_MODEL` / `…_FALLBACK_MODEL`, `AI_VISION_PROVIDER`); the role settings are now one table per provider
- **Document service:**
  - PNG / JPG / WebP up to 5 MB, with a file-signature check
  - images go to the vision model, documents are still read by code
  - files are processed in parallel
  - an AI failure returns `error` for that image only
  - the response now includes `readBy` (`code` / `ai`) and `error`, documented in Swagger
- **Frontend:**
  - the dropzone accepts images (5 MB limit) and attachments show a thumbnail
  - "Reading … with AI…" while waiting
  - the badge **"Read by AI, please check"**, plus the same note in the text block header so it survives saving
  - clear messages for AI failures and images with no text
  - EN + TH

**Choosing the vision model (real key).** The first prompt let the model paraphrase Thai words, so it was tightened (copy exactly, keep line breaks, exact state names). Then the same Thai screenshot was read by every free image model:
- **nemotron-3-nano-omni** was the most accurate (76 s) → the vision model
- super-vl paraphrased, and once invented an unrelated requirement
- dots timed out; both Gemma models were overloaded

The partner company suggested **Gemini 3.5 Flash**. On a harder image, a Thai swimlane diagram, it read every label and the whole flow correctly in 34–37 s (one small typo). On the same diagram, super-vl invented a purchasing process and nano-omni timed out.

So images now go to **Gemini first** (when a Gemini key is set) and to OpenRouter (nano-omni → Gemma 31B) when Gemini is busy or out of quota. This uses a small `withBackupProvider` wrapper in `providers/index.js`. Details are in `docs/ai-providers.md`.

**Decision:** D-027.

**How it was checked**
- `npm test`: **99 tests** pass (85 + 14 new):
  - image prompt
  - vision role defaults and overrides
  - pipeline passing images
  - empty transcription retried
  - OpenRouter image message format
  - "can't read images" message
  - image type, size and signature checks
  - AI failure for one image
  - images not read as documents
  - Gemini-first vision with the OpenRouter backup: provider choice, switching when busy, the error when both are busy, no switch on setup errors
- The upload controller with the mock AI: a Thai-named PNG and a Markdown file in one upload → `readBy: ai` and `readBy: code`; a fake `.png` → 400.
- Real requests for the model comparison: a Thai screenshot and a Thai swimlane diagram. The final default setup read the diagram via Gemini in 34 s.
- Frontend `tsc`, `lint` and `build` pass.

**Follow-ups:** the team checks it on the website with real screenshots (English, Thai and a diagram).

---

## 2026-11-06 — Slice 4.5: OpenRouter as the AI provider

**Goal.** Switch the AI to OpenRouter (free models now, paid later) before the test-case and test-script slices add more AI calls, so their prompts are tuned on the provider actually used.

**What was built**
- `ai/providers/openrouter.provider.js`: the same interface as the Gemini provider.
  - Structured output (`json_schema` + `require_parameters`) first. If a model doesn't support it, it switches to JSON mode with the schema in the prompt, and remembers that per model.
  - Tolerant JSON parsing (code fences, text around the JSON).
  - Error mapping: 429/402 quota, 401 key, 404 model, 403 moderation, 5xx busy, and errors inside a 200 answer.
  - Token usage and the model that answered are recorded.
- `ai/providers/reliability.js`: the time limit, busy retries and fallback logic moved out of the Gemini provider, so both providers share the same tested code. Gemini's behaviour is unchanged; its existing tests still pass.
- `providers/index.js`: `openrouter` is the default when `OPENROUTER_API_KEY` is set, with provisional free models (generator `google/gemma-4-31b-it:free`, validator `nvidia/nemotron-3.5-super-vl:free`, plus fallbacks).
- `.env.example` and `docs/ai-providers.md`: OpenRouter setup, free-tier limits, privacy note, how to move to paid.

**Facts checked in OpenRouter's docs (2026-11-06).**
- Free models allow 20 requests a minute and 50 a day; 1,000 a day once $10 of credits has been bought.
- Only 4 of the 11 free models supported structured output, which is why there's a JSON-mode fallback.

**Decision:** D-025.

**How it was checked**
- `npm test`: **80 tests** pass (67 before + 13 new OpenRouter tests with a fake client):
  - structured output request
  - JSON-mode fallback remembered per model
  - busy → fallback
  - hang → time limit → fallback
  - quota / credits / key / model / moderation mapping
  - error inside a 200 answer
  - invalid JSON
  - `.env` model overrides
  - the full pipeline through the provider
- A real call to OpenRouter with a deliberately wrong key returned 401 and was shown as our clear "rejected the API key" message, with no retry.

**Checked with the team's real key (same day)**
- **Bug 1:** the first real run failed. Gemma doesn't support structured output, and OpenRouter's real message ("No endpoints found that **can handle** the requested parameters") didn't match the check. Fixed, and the test now uses the real wording.
- **Bug 2:** Gemma's free host answered "429 Provider returned error". That was the *host* being overloaded, not the account limit: the key showed 0 of 50 requests used. Such 429s are now treated as "busy" (retry → fallback), while the account's own "Rate limit exceeded" still stops at once.
- **Added a third way to ask for JSON** (`prompt` mode: no format option, schema only in the prompt) for models that support neither structured output nor JSON mode. The provider steps schema → json → prompt per model and remembers the result.
- **Measured all free models** with the same Thai prompt. All 8 tried answered with valid Thai JSON; both Gemma models were overloaded. New defaults:
  - generator `nvidia/nemotron-3-ultra-550b-a55b:free` (fallback `dots-studio/dots-3-note-preview:free`)
  - validator `xingchen-agi/xing4.0-29b-a4b:free` (fallback `cohere/north-mini-code:free`)

  Each fallback runs on a different host. Details are in `docs/ai-providers.md`.
- **First full run:** PASSED after 3 attempts (279 s); the final scenarios covered every rule. The validator is strict and sometimes wrong; to watch during Slice 5.
- `npm test`: **82 tests** pass.
- **After the Thai run (2026-11-07):**
  - The Thai requirement got English scenarios.
  - The fast validators failed good drafts with false claims → NEEDS_REVIEW.
  - xing's host was often busy.

  Fixes:
  - the output language is now detected in code and stated at the end of every prompt (D-026)
  - a fairer validator prompt (fail only concrete problems)
  - validator → `dots-3-note-preview` (fallback cohere); generator fallback → `recursive/flint-v1.0`

  `npm test`: **85 tests** pass.
- **Validator comparison (Thai requirement):**
  - xing/cohere and dots each ended NEEDS_REVIEW after 3 attempts, with false objections; dots also garbled Thai.
  - `nvidia/nemotron-3.5-super-vl:free` **PASSED in 2 attempts**, and its objections were correct (the missing login and initial-status scenarios, which the generator then added). It became the default validator.
  - The output was fully Thai, confirming the language fix.

---

## 2026-09-30 — Slice 4: Scenarios step, priority and Recently deleted

**Goal.** The real Step 2: review the AI's scenarios and shape them before test cases are generated. Plus a 7-day "Recently deleted", requested during planning.

**Design input.** The team compared the white and black designs and chose the **white design's layout and actions** (add, edit, delete, generate more, redraft), plus the **priority level** from the black design. The black design's stat tiles, keep/drop checkboxes and `REQ-104.1` tags weren't used. Every scenario on the list will be expanded into test cases; unwanted ones are deleted.

**What was built**
- **Database** (migration `add_priority_and_soft_delete`):
  - `Scenario.priority`
  - `deletedAt` on Requirement / Scenario / TestCase
  - the scenario and test case number uniqueness moves from the database to the code (see D-024)
- **AI module**:
  - scenarios now include a risk-based `priority`
  - new "generate more" mode: the prompt lists the existing scenarios; the duplicate check and the validator compare new ↔ existing
  - the mock supports both
- **Backend**:
  - scenario endpoints: add, edit, delete, draft history, restore
  - `scenario-drafts` takes `{ mode: "replace" | "more" }`
  - every run stores a full snapshot for restore
  - `/api/trash`: list, restore, delete forever
  - hourly removal of items deleted over 7 days ago
  - all with Swagger docs
- **Frontend**:
  - Step 2 (`ScenariosStep`):
    - toolbar, summary line, cards with a priority dropdown
    - inline edit/add form
    - confirm dialogs for delete / redraft / restore
    - draft history modal
    - "Generate test cases" button (disabled until Slice 5)
  - The History page now shows **Recently deleted**. The delete dialogs point there.
  - Fixed from the team's screenshots: the thick blue focus box on the step tabs (now a soft ring for keyboard users only), and technique cards whose text sat too low.

**Problem found on the way: Prisma generated a wrong migration.** The generated SQL dropped the `TestCase → Requirement` foreign key but re-added `TestCase → Scenario`, which still existed, so MySQL stopped with "Duplicate foreign key constraint name" after 13 of 14 statements. The fix:
1. corrected the last statement in the migration file (with a comment)
2. added the missing key by hand
3. marked the migration as applied
4. removed the log row of the failed attempt

A replay of all migrations into a fresh database then gave **no differences**, so teammates' setups work.

**Decisions:** D-021 (priority), D-022 (generate more), D-023 (run snapshots), D-024 (Recently deleted).

**How it was checked**
- `npm test`: **67 tests** pass. New ones cover:
  - the priority schema
  - the "more" prompt and validator prompt
  - duplicates against existing scenarios
  - "more" with the mock
  - scenario DTOs
  - the 7-day date rules
- Services against the real database with the mock AI, **20 checks**:
  - replace/more numbering and snapshots
  - add/edit/delete; last one deleted → DRAFT
  - history + restore
  - a restored scenario renumbered when its number is taken
  - another user has no access
  - soft-deleted requirement listed, not reused, restored with its scenarios
  - delete forever
  - purge removes an 8-day-old item and keeps a 6-day-old one
  - a busy AI changes nothing
- Swagger spec valid (`redocly lint`).
- **Browser test** (headless Chrome, a temporary Keycloak user, mock AI), **16 checks**:
  - draft; priority change survives a reload; edit; add; delete
  - generate more; busy AI; redraft
  - history (including a failed run) → restore
  - History page restore; delete and restore a requirement
  - phone width; Thai

  No page errors. The temporary user and data were removed afterwards.
- Frontend `lint` and `build` pass.

**Follow-ups**
- Team checkpoint with the real Gemini key: are the AI's priorities sensible? Does "Generate more" avoid repeats? Does restoring an earlier draft work?
- Slice 5: test cases (and their deletes go to Recently deleted; queries must filter `deletedAt`).

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
