# Roadmap

_Last updated: 2026-11-12_

## Milestone 1 — Main tester flow, end to end (before the demo)

Goal: a tester can go **Requirement → Scenarios → Test cases → (Test scripts) → Report** on a real database, with AI generation, validation and retries.

| # | Slice | Status |
|---|---|---|
| 1 | Database schema (Requirement, GenerationRun, Scenario, TestCase, UserPreference) | ✅ Done 2026-09-26 |
| — | Project documentation (`docs/`) | ✅ Done 2026-09-26 |
| — | Swagger API docs (`/api/docs`) | ✅ Done 2026-09-26 |
| 2 | AI pipeline: providers (Gemini + mock), output schemas, rule checks, generate → validate → retry ×3, provider guide | ✅ Done 2026-09-27 (checked with a real Gemini key) |
| 3 | Requirements API + Step 1 page: text or document upload (PDF/DOCX/MD/TXT), technique selection, "let AI suggest", 4-step stepper, draft scenarios | ✅ Built 2026-09-27, checked by the team with the real key |
| 4 | Scenarios API + Step 2 page: edit, add, delete, generate more, redraft, history of last 10 with restore, "needs review" warning; **Recently deleted** (7-day restore) for requirements and scenarios. (Priority, added here, was removed in Slice 5, D-028.) | ✅ Built 2026-09-30, used on the website since |
| 4.5 | **Switch the AI provider to OpenRouter** (free models now, paid later = only an `.env` change) | ✅ Done 2026-11-07 (models measured and confirmed with the team's key) |
| 4.6 | **Requirement images:** attach screenshots, scans, UI mock-ups or diagrams in Step 1; a vision model (Gemini 3.5 Flash, OpenRouter as backup) reads them into editable requirement text | ✅ Built 2026-11-10, awaiting the team's check |
| 5 | **Test cases** (Step 3): generated in batches from the scenarios without cases (D-030), table with Open / Pass / Fail, edit / delete (Recently deleted); scenarios lock once they have test cases (D-029); "needs review" note + AI notes + "mark as reviewed"; "test cases may be out of date" panel; **Report** step (Step 5) with coverage and CSV downloads; **History → Generated**; scenario priority removed (D-028). Built in parts 5a–5d | ✅ Done 2026-11-12 (checked on the website with real AI: English and Thai on Gemini) |
| 6 | **Defect report** under the Step 3 table (with up to 3 screenshots per defect, stored behind login) and defects in the Report | ⏳ Next |
| 7 | Test scripts step (Step 4, AI-generated, optional) + Account page (profile, security via Keycloak, usage) | ⏳ |
| 8 | **Real Dashboard:** recent runs (dashboard + sidebar), runs this week, weekly activity, technique mix and total test cases from real data; `mocks/dashboard.ts` deleted | ⏳ |

The final UI design for Slices 5–7 is the published mock-up (claude.ai/artifact/5GLTgUvHekRwz9WwuyjnTs).

## Later milestones

| Milestone | Scope |
|---|---|
| **M2 — Test execution** | Run test cases in the app: pass / fail / blocked / not run, testing notes, image attachments; results in the report; real Dashboard data |
| **M3 — History & Account** | Restore from History → Generated (the list itself is done in Slice 5); Account page (profile, language, saved export template); move to a paid AI provider |
| **M4 — Roles** | Keycloak realm roles `tester` (default), `developer`, `admin`; project sharing; developer view of failed test cases; admin overview |
| **M5 — Credits & scale** | Credit system (token usage is already recorded per generation); background jobs for long generations |

## Ideas collected (not yet scheduled)
- Read scanned PDFs with OCR (not planned for M1).
- Add test cases by hand (scenarios can already be added by hand).
- Gemini and OpenRouter as automatic backup for each other for text steps (as images already do); wait-and-retry on Gemini's 5-requests-a-minute limit.
- Show the real recent runs in the sidebar (now placeholder data; with the Dashboard, Slice 8).
