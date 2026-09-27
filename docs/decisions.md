# Decision records

Short records of important choices: the situation, what we decided, and what follows from it. Newest at the bottom. Add a new record rather than editing an old one; if a decision changes, add a new record that replaces it.

---

### D-001 — Keycloak for authentication
**Context.** Testers need accounts with email/password and Google login. More roles (developer, admin) may come later.
**Decision.** Use Keycloak (Docker) as the identity provider. The frontend logs in with OpenID Connect, and the backend verifies JWTs against Keycloak's public keys.
**Consequences.** Registration, password reset, social login and roles come from configuration, not our code. Our database only keeps a `User` row linked by `keycloakId`. Roles (M4) will be Keycloak realm roles.

### D-002 — Mock data behind service functions
**Context.** The UI was designed before the backend features existed.
**Decision.** Pages only call functions in `frontend/src/services/`. Until an API exists, those functions return data from `frontend/src/mocks/`.
**Consequences.** Connecting a real API changes only the service function. The mock files are deleted as each slice lands.

### D-003 — The real 4-step workflow drives the design
**Context.** The lovable.dev design showed a 3-step flow that didn't match how testers actually work.
**Decision.** The flow is Requirement → Scenarios → Test cases → Report. The design's look and components are reused, but screens are adapted to this flow.
**Consequences.** The existing requirement-page drafts get reworked in Slices 3–6.

### D-004 — Build in slices, checked between each
**Context.** The scope is large, and the team wants to be able to step in and change direction.
**Decision.** Work is split into small slices. Each is planned, approved, built and checked before the next starts, and every slice ends with a docs update.
**Consequences.** Slower per feature, but mistakes are caught early and the docs stay current for the report.

### D-005 — Gemini free tier now, provider-agnostic AI layer
**Context.** The team hasn't chosen a paid AI provider (OpenAI / Gemini / Claude are candidates), and the demo is close.
**Decision.** Build the AI layer behind a common provider interface. Implement a **Gemini** provider (free tier) and a **mock** provider (used for tests and when no API key is set).
**Consequences.** Switching provider later means changing env vars or adding one provider file (guide: `docs/ai-providers.md`). Free-tier limits and privacy apply (D-010).

### D-006 — The validator uses a different model from the generator
**Context.** A model checking its own output tends to agree with itself.
**Decision.** Generator and validator are configured separately (`AI_GENERATOR_*` / `AI_VALIDATOR_*`). On the free tier they're two different Gemini models. Deterministic checks (format, duplicates, leaked secrets) run in code before the AI validator.
**Consequences.** Less bias than self-checking, but still the same vendor. A different provider for the validator can come with the paid tier.

### D-007 — Store numbers, not display codes
**Context.** The UI shows codes like REQ-0001, SC-01 and TC-0001.
**Decision.** Tables store an integer `number`, unique within the parent (`@@unique([projectId, number])` etc.), and the app formats the code.
**Consequences.** No string parsing, and the code format can change without a migration. New numbers are `max + 1`, so deleted numbers aren't reused.

### D-008 — Techniques are string keys, not a database enum
**Context.** More testing techniques will be added over time.
**Decision.** Store technique keys (e.g. `"boundaryValue"`) as strings/JSON. The list of techniques lives in code.
**Consequences.** Adding a technique needs no migration, only code and translations.

### D-009 — Keep every AI generation as a GenerationRun
**Context.** Testers want to bring back earlier generations, and a credit system may come later.
**Decision.** Every AI call is stored with its input, output snapshot, validation results per attempt, models used and token usage. The UI shows the latest 10 per requirement and kind, and "restore" copies a snapshot back.
**Consequences.** Full history and audit. Token usage is already there for credits (M5). The table grows over time, and old runs can be pruned later if needed.

### D-010 — Free-tier privacy caveat
**Context.** Google states that content sent on the Gemini free tier may be used to improve its products; paid-tier content isn't.
**Decision.** Use only sample or non-confidential requirements while on the free tier. Move to a paid tier before real client documents are used.
**Consequences.** This is recorded in `docs/ai-providers.md` and should be mentioned in the project report's limitations.

### D-011 — Synchronous generation for the demo
**Context.** AI generation can take 10–60 seconds, and the demo is close.
**Decision.** Generation endpoints respond when the pipeline finishes (no job queue). The UI shows a loading state.
**Consequences.** Simple to build. For heavy use, move to background jobs with polling (M5).

### D-012 — Gemini SDK: `@google/genai` with `models.generateContent`
**Context.** The old `@google/generative-ai` package is superseded by `@google/genai`. Google's newest examples use an `interactions` API, but the SDK still provides `models.generateContent`.
**Decision.** Use `@google/genai` (v2.24) with `ai.models.generateContent`, which supports a system instruction, a JSON-schema response (`responseJsonSchema`), a request timeout and token usage (`usageMetadata`). Remove `@google/generative-ai`.
**Consequences.** Only `ai/providers/gemini.provider.js` depends on the SDK, so a later API change touches one file.

### D-013 — Duplicate detection: exact duplicates fail, near-duplicates warn
**Context.** The plan first said "≥ 85% similar = duplicate". But boundary-value cases like "Enter age 17" and "Enter age 18" are deliberately almost identical text, and would have been rejected.
**Decision.** After normalising (case, spacing, punctuation; digits kept), identical titles, or identical steps + expected result, **fail**. Titles ≥ 92% similar (character-pair similarity, which also works for Thai) only **warn**. The AI validator also looks for semantic duplicates.
**Consequences.** Legitimate boundary cases pass. Subtle duplicates are flagged for the tester rather than blocking generation.

### D-014 — Which AI errors stop the pipeline
**Context.** Retrying costs free-tier requests, and some errors can't be fixed by retrying.
**Decision.**
- Quota/rate-limit errors, a rejected API key, and an unknown model name are **fatal**: the run stops at once as `FAILED` with a clear message.
- Invalid JSON or other temporary provider errors count as a failed attempt and are retried.
- If the **validator** is unavailable, the generator's output is kept but marked `NEEDS_REVIEW`. It's never auto-approved without an AI check.

**Consequences.** Fewer wasted calls, clear messages for configuration problems, and no unchecked output presented as validated.

### D-015 — Handling a slow or overloaded free-tier AI service
**Context.** The first real runs (2026-09-27) hit three service problems:
- `gemini-3.8-flash` answered "high demand" (503) several times.
- One request hung for 17 minutes.
- A whole run took 37 minutes, because the SDK re-sent every timed-out request and the pipeline treated timeouts as quality failures.

Separately, the `gemini-2.5-*` models turned out to be unavailable to new keys, and Gemini rejected list-size limits in our JSON schema.
**Decision.**
- **Service problems are handled in the provider, not by the 3 quality attempts:**
  - busy → wait and retry the same model twice (3 s, 8 s)
  - still busy, or no answer within 120 s → switch to a fallback model
  - fallback also failing → stop with "try again in a few minutes"
- We enforce the time limit ourselves: an abort signal **plus** a hard deadline (`Promise.race`) that stops waiting even if the SDK ignores the abort. We don't rely on the SDK's own retry, which also re-sends timed-out requests.
- **Default models** chosen by measurement: generator `gemini-3.5-flash` (fallback `gemini-3.7-flash`), validator `gemini-3.5-flash-lite` (fallback `gemini-3.1-flash-lite`).
- An invalid request (HTTP 400) stops at once.
- List-size limits (`minItems`/`maxItems`) aren't sent to the provider; zod still enforces them.
- The results record which model actually answered, and how long each call took.

**Consequences.** The worst case is bounded to minutes, not half an hour. Model names may need updating as Google retires models; the AI guide shows how to list the models a key can use.

### D-016 — Duplicate test cases also compare the precondition
**Context.** In a real run, two boundary cases ("link used at 29:59" and "at exactly 30:00") had identical steps and expected results and differed only in their precondition, and were wrongly flagged as duplicates (a refinement of D-013).
**Decision.** Two test cases are exact duplicates only if their precondition, steps and expected result are all the same (or their titles are).
**Consequences.** Legitimate boundary cases pass. Real duplicates are still caught.
