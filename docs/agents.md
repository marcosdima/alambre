# Agent System

This document is the single source of truth for the multi-agent coordination system used to work on this repository with [Google Antigravity](https://antigravity.google).

The system coordinates a small team of specialized roles. Each role is materialized as a custom subagent under `.agents/agents/<role>/agent.md`. Agent definition files remain thin wiring; the knowledge and contracts live here in `docs/` (see `docs/project.md` §8).

All roles share the retrieval protocol defined in `.agents/skills/docs-retrieval/SKILL.md`.

---

## 1. System Topology & Model Matrix

| Role | Identifier | Model Tier | Recommended Model | Primary Cognitive Load / Responsibility |
| --- | --- | --- | --- | --- |
| **Lead / Orchestrator** | `@lead` | `pro` | Gemini 3.1 Pro | Requirement decomposition, dependency mapping, conflict resolution, and final synthesis. Selectable as the primary agent. |
| **UI Specialist** | `@ui` | `pro` | Gemini 3.1 Pro (multimodal) | Component contracts, UX patterns, accessibility (a11y), layout verification against the running Android emulator. |
| **Test & QA Engineer** | `@tester` | `flash` | Gemini 3.8 Flash | Test suite authoring, edge case generation, mocks/fixtures setup, and test execution. High volume of tool calls, so the flash tier keeps cost low. |
| **Integrity & Docs** | `@integrity` | `flash` | Gemini 3.8 Flash | Strict auditing against specs/docs, detecting architectural drift, and API consistency against the public contract. |
| **Discoveries Logger** | `@scribe` | `flash` | Gemini 3.8 Flash | Capturing implementation discoveries, technical debt, trade-offs, and updating ADRs/logs. |

### Agent definition files

Each role is a subagent definition in `.agents/agents/<role>/agent.md` with `subagent: true`. `@lead` additionally sets `mainAgent: true` so it can be selected as the primary agent in the `/agents` panel.

Specialists are invoked via delegation from `@lead` (or directly from a conversation). Native Antigravity subagents (`research`, `browser`) are used as-is and are not redefined.

---

## 2. Model Routing

Model tiers are the routing unit Antigravity understands (`inherit | flash | pro`). Concrete models map to the tiers as follows: the `pro` tier resolves to the frontier reasoning model (Gemini 3.1 Pro), and the `flash` tier to the flash family (Gemini 3.8 Flash).

Routing rule: **the more reasoning the task requires, the higher the tier.**

| Complexity | Example task | Role | Tier |
| --- | --- | --- | --- |
| High reasoning | Conceptual architecture change, conflict resolution, baseline/SemVer decision | `@lead` | `pro` |
| High reasoning + multimodal | Designing `Button`/`TimePicker`, validating accessibility, reviewing layout on the emulator | `@ui` | `pro` |
| On-demand deep dive | Concurrency bug, race condition, non-trivial refactor | Any role invoked as needed | `pro` on demand via `/boost` |
| High volume of tools | Authoring/running tests, edge cases, mocks, lint/typecheck/build loops | `@tester` | `flash` |
| Search & consistency | Auditing the public API vs docs, drift detection | `@integrity` | `flash` |
| Summarization & logging | Discoveries, ADRs, changelog entries | `@scribe` | `flash` |

Mechanical, high-volume patterns run on `flash`; `pro` is reserved for critical decisions and interfaces. This preserves the shared token quota on the student plan.

For large multi-agent efforts, the native `/teamwork-preview` orchestrator (paid plans) complements this system; this matrix covers the manual, repeatable workflow.

---

## 3. UI Verification on the Android Emulator

`@ui` verifies work against the running Android emulator via `adb` instead of the web `browser` subagent.

Flow:

1. `adb devices` to confirm the device.
2. Install/relaunch the build: `pnpm --filter @alambre/colguetti apk:install` (or `expo run:android`).
3. Capture a screenshot: `adb exec-out screencap -p > .agents/artifacts/ui-<n>.png`, then read it as an image.
4. Interact deterministically: `adb shell uiautomator dump` for real element bounds, then `adb shell input tap/swipe`.
5. Iterate capture → decide → interact until the surface matches the contracts in `docs/ui.md`.

Screenshots are written to `.agents/artifacts/`, which is gitignored. Access to `adb` requires a permission rule for `command(adb)` (or ad-hoc approval) so the sandbox does not block emulator traffic.

### Forward notes

- Emulator verification currently lives only in `@ui`. If `@tester` later needs visual test verification, the same pattern should be replicated there without duplicating UI responsibility.
- The documentation corpus in `docs/` is retrieved through the structured retrieval skill (below). If the corpus grows beyond ~50 files or needs cross-repo semantic search, migrate to real embeddings (LanceDB or `sqlite-vec` via a `scripts/` indexer). Not built today.

---

## 4. Documentation Retrieval

`docs/` is the single source of truth. All agents follow `.agents/skills/docs-retrieval/SKILL.md`:

- Enter through the catalog `docs/reference/index.md`.
- Locate a section by heading with search, never read whole documents.
- Cite `file:section` and never paraphrase architectural decisions.
- Respect existing structure and decision history when updating.