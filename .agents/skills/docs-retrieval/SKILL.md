---
name: docs-retrieval
description: Retrieval protocol for the alambre documentation corpus. Use whenever a task references project knowledge, decisions, or API contracts that live under docs/.
---

# Docs Retrieval Protocol

The `docs/` directory is the single source of truth for this repository
(see `docs/index.md`). Tool-level files such as `AGENTS.md` and agent
definitions are thin wiring and must never become competing sources of
knowledge.

Follow this protocol whenever you need to consult or update documentation.

## 1. Enter through the catalog

Start from `docs/index.md` (the catalog), then navigate to the relevant document:

- `docs/packages/alambre/architecture.md` — architectural principles, boundaries, headless primitives, public API contract (§8), and versioning (§9).
- `docs/packages/alambre/*.md` — headless capabilities, behaviors, hooks, storage, dnd, and text animations.
- `docs/packages/ui/overview.md` — tactile UI direction, headless-to-presentation layering, and platform traps.
- `docs/packages/ui/theme.md` & `components.md` — design tokens and tactile component contracts for `@some-alambre/ui`.
- `docs/packages/room-relay/architecture.md` — real-time room relay, simulated/WS/PartyKit transports, and turn engine.
- `docs/guidelines/agents.md` — the agent system, model routing, UI verification, and anti-drift guardrails (§5).
- `docs/guidelines/workflow.md` — validation order, E2E invocation, and commit format.
- `docs/guidelines/testing.md` — Maestro E2E flow architecture and unit test rules.
- `docs/guidelines/agents.md` §6 — the Extraction Audit: how reusable code is promoted to packages or templates.
- `docs/proposals/index.md` — pending framework changes, RFCs, and roadmap items.
- `docs/apps/*.md` — per-application contracts and constraints.

Do not guess content: read the index, then the specific file.

## 2. Locate sections by heading

Use search to jump to a heading instead of reading whole documents. The
reference mappings are stable:

- Public API surface → `docs/packages/alambre/architecture.md` §8.
- Versioning / baseline / SemVer → `docs/packages/alambre/architecture.md` §9.
- Validation order, E2E, commit format → `docs/guidelines/workflow.md`.
- Agent system, delegation, anti-drift → `docs/guidelines/agents.md` §5.
- UI contracts & platform traps → `docs/packages/ui/overview.md` and `docs/packages/ui/components.md`.

## 3. Cite, do not paraphrase

When an agent report or change references a decision, cite `file:section`
(e.g. `docs/packages/alambre/architecture.md` §8). Architectural and UI decisions are
contractual: never summarize them in a way that changes their meaning.

## 4. Updating documentation

When adding or changing documented knowledge:

1. Update the source `docs/*.md` file first — it is the truth.
2. Keep existing section numbering and structure stable; append when a new
   concept does not fit an existing section.
3. If the change adds a new document or entry, update the catalog
   entry in `docs/index.md`.
4. Do not log "discoveries" after finishing work. Reusable candidates are
   handled by the Extraction Audit (`docs/guidelines/agents.md` §6); only
   contract changes are documented (`docs/packages/alambre/architecture.md` /
   `docs/packages/ui/overview.md`), and pending design decisions go to `docs/proposals/index.md`.
5. Keep `frontmatter` (`title`, `summary`) accurate for retrieval.
6. Do not duplicate content into `AGENTS.md` or agent definitions.

## 5. Scaling note

The current corpus is small enough for this structured protocol. If it
grows beyond ~50 files or needs cross-repo semantic search, migrate to
embeddings (LanceDB or `sqlite-vec` via a `scripts/` indexer).