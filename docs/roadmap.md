# Roadmap

_Last updated: 2026-11-06_

## Milestone 1 — Main tester flow, end to end (before the demo)

Goal: a tester can go **Requirement → Scenarios → Test cases → Report** on a real database, with AI generation, validation and retries.

| # | Slice | Status |
|---|---|---|
| 1 | Database schema (Requirement, GenerationRun, Scenario, TestCase, UserPreference) | ✅ Done 2026-09-26 |
| — | Project documentation (`docs/`) | ✅ Done 2026-09-26 |
| — | Swagger API docs (`/api/docs`) | ✅ Done 2026-09-26 |
| 2 | AI pipeline: providers (Gemini + mock), output schemas, rule checks, generate → validate → retry ×3, provider guide | ✅ Done 2026-09-27 (checked with a real Gemini key) |
| 3 | Requirements API + Step 1 page: text or document upload (PDF/DOCX/MD/TXT), technique selection, "let AI suggest", 4-step stepper, draft scenarios | ✅ Built 2026-09-27, checked by the team with the real key |
| 4 | Scenarios API + Step 2 page: edit, add, delete, priority (AI-suggested, tester can change), generate more, redraft, history of last 10 with restore, "needs review" warning; **Recently deleted** (7-day restore) for requirements and scenarios | ✅ Built 2026-09-30, awaiting the team's check with the real key |
| 4.5 | **Switch the AI provider to OpenRouter** (free models now, paid later = only an `.env` change) | ✅ Built 2026-11-06, models to be confirmed with the team's key |
| 4.6 | **Requirement images:** attach screenshots, scans, UI mock-ups or diagrams in Step 1; a vision model (`nemotron-3.5-super-vl`) reads them into editable requirement text | ⏳ Next |
| 5 | Test cases (Step 3, per the final mock-up): generate from scenarios, table with Pass/Fail/Open, edit/delete (Recently deleted), CSV downloads, coverage card; "needs review" actions + "mark as reviewed"; "test cases may be out of date" warning; History → Generated; scenario priority removed | ⏳ |
| 6 | Defect report (with screenshots) + Report step (Step 5) | ⏳ |
| 7 | Test scripts step (Step 4, AI-generated, optional) + Account page (profile, security via Keycloak, usage) | ⏳ |
| 8 | **Real Dashboard:** recent runs (dashboard + sidebar), runs this week, weekly activity, technique mix and total test cases from real data; `mocks/dashboard.ts` deleted | ⏳ |

The final UI design for Slices 5–7 is the published mock-up (claude.ai/artifact/5GLTgUvHekRwz9WwuyjnTs).

## Later milestones

| Milestone | Scope |
|---|---|
| **M2 — Test execution** | Run test cases in the app: pass / fail / blocked / not run, testing notes, image attachments; results in the report; real Dashboard data |
| **M3 — History & Account** | History page for all generations across projects (restore anywhere); Account page (profile, language, saved export template); move to a paid AI provider |
| **M4 — Roles** | Keycloak realm roles `tester` (default), `developer`, `admin`; project sharing; developer view of failed test cases; admin overview |
| **M5 — Credits & scale** | Credit system (token usage is already recorded per generation); background jobs for long generations |

## Ideas collected (not yet scheduled)
- Read scanned PDFs with OCR (not planned for M1).
- Regenerate test cases after they've been generated (Slice 5).
- Add scenarios and test cases by hand, in addition to the generated ones (Slices 4–5).
