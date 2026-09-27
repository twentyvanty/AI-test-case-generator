# Roadmap

_Last updated: 2026-09-26_

## Milestone 1 — Main tester flow, end to end (before the demo)

Goal: a tester can go **Requirement → Scenarios → Test cases → Report** on a real database, with AI generation, validation and retries.

| # | Slice | Status |
|---|---|---|
| 1 | Database schema (Requirement, GenerationRun, Scenario, TestCase, UserPreference) | ✅ Done 2026-09-26 |
| — | Project documentation (`docs/`) | ✅ Done 2026-09-26 |
| — | Swagger API docs (`/api/docs`) | ✅ Done 2026-09-26 |
| 2 | AI pipeline: providers (Gemini + mock), output schemas, rule checks, generate → validate → retry ×3, provider guide | ✅ Built 2026-09-26, awaiting a real-key check by the team |
| 3 | Requirements API + Step 1 page: text or document upload (PDF/DOCX/MD/TXT), technique selection, "let AI suggest", 4-step stepper | ⏳ Next |
| 4 | Scenarios API + Step 2 page: draft/redraft, select, edit, add, history of last 10 with restore, "needs review" warning | ⏳ |
| 5 | Test cases API + Step 3 page: validation results (4 checks), tabs per scenario, full test-case editor, regenerate | ⏳ |
| 6 | Report + export: coverage and traceability, Excel/CSV export with column picker, real project stats, remove mocks | ⏳ |

## Later milestones

| Milestone | Scope |
|---|---|
| **M2 — Test execution** | Run test cases in the app: pass / fail / blocked / not run, testing notes, image attachments; results in the report; real Dashboard data |
| **M3 — History & Account** | History page for all generations across projects (restore anywhere); Account page (profile, language, saved export template); move to a paid AI provider |
| **M4 — Roles** | Keycloak realm roles `tester` (default), `developer`, `admin`; project sharing; developer view of failed test cases; admin overview |
| **M5 — Credits & scale** | Credit system (token usage is already recorded per generation); background jobs for long generations |

## Ideas collected (not yet scheduled)
- AI analyses a requirement and suggests suitable techniques (planned in Slice 3).
- Regenerate test cases after they've been generated (Slice 5).
- Add scenarios and test cases by hand, in addition to the generated ones (Slices 4–5).
