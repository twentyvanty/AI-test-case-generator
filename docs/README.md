# Project documentation

Documentation for the **AI Test Case Generator** senior project. It records how the system is built, what was done in each work session, and why key choices were made. It's written so the team can pick the project back up at any point and reuse it in the senior project report.

| Document | Read it when you want to know… |
|---|---|
| [architecture.md](architecture.md) | How the system fits together: tech stack, folders, auth flow, data model, AI pipeline |
| [development-log.md](development-log.md) | What was built in each session, how it was checked, and what's left |
| [decisions.md](decisions.md) | Why something was done a certain way (short decision records) |
| [roadmap.md](roadmap.md) | What's done, what's next, and the plan for later milestones |
| [ai-providers.md](ai-providers.md) | How the AI pipeline works and how to switch or add an AI provider *(added in Slice 2)* |

API reference: run the backend and open **http://localhost:5001/api/docs** (Swagger).

## How we work

Features are built **one slice at a time**. Each slice is planned, approved, built, then checked by the team before the next one starts. At the end of every slice:

1. Add a dated entry at the top of `development-log.md`.
2. Tick the slice off in `roadmap.md`.
3. Add any new decision to `decisions.md`.
4. Update `architecture.md` if the structure, data model or flow changed.
5. Document any new endpoint in Swagger (an `@openapi` comment above the route).

## Known out-of-date content elsewhere

The root [README](../README.md) predates these docs. Its "Testing Techniques Supported" section still lists TDD and BDD from the older version of the project. The current plan supports equivalence partitioning, boundary value analysis, decision tables and state transitions (see [roadmap.md](roadmap.md)). Update the README when the team rewrites it.

Never put secrets in these docs. Name environment variables, never their values.
