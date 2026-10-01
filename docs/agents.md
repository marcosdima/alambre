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
| **Agent Experience** | `@ax` | `flash` | Gemini 3.8 Flash | AX / Agent-DX crash-test dummy. Blindly consumes `alambre` APIs to validate if headless hooks and stores are LLM-friendly and prevent hallucinations. |

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

## 3. UI Verification & Testing Strategy

The repository follows a tiered testing strategy to balance fast iteration, resource efficiency, and visual fidelity:

1. **Component & Contract Testing (Headless):** Fast unit and contract testing with Vitest. Validates hooks, states, formatting, timer steps, and accessibility properties without launching native emulators.
2. **Deterministic UI Hierarchy (Emulator):** When verifying layout, alignment, or component placement on the Android emulator, use native XML inspection (`uiautomator dump`) to evaluate exact element bounding boxes (`[left, top][right, bottom]`) rather than guessing from pixels.
3. **Multimodal Visual Inspection:** For animations, physics, and visual aesthetics, use the single repository script `scripts/ui-capture.sh`:
   - Captures `.agents/artifacts/screen.png` and dumps `.agents/artifacts/hierarchy.xml`.
   - Read the image directly using Antigravity's native `view_file` (Gemini 3.1 Pro is multimodal).
   - **Strict prohibition:** NEVER generate disposable, ad-hoc Python scripts (`analyze_image.py`, etc.) to measure or inspect screenshots. Use `view_file` or inspect the XML hierarchy directly.

Flow:
1. `adb devices` to confirm the device.
2. Install/relaunch the build: `pnpm --filter <app> apk:install` (or `expo run:android`).
3. Run `scripts/ui-capture.sh` to extract `screen.png` and `hierarchy.xml`.
4. Inspect `screen.png` via `view_file` or check numeric bounds in `hierarchy.xml`.
5. Interact deterministically: `adb shell input tap/swipe`.
6. Iterate until the surface matches the contracts in `docs/ui.md`.

---

## 4. Documentation Retrieval

`docs/` is the single source of truth. All agents follow `.agents/skills/docs-retrieval/SKILL.md`:

- Enter through the catalog `docs/reference/index.md`.
- Locate a section by heading with search, never read whole documents.
- Cite `file:section` and never paraphrase architectural decisions.
- Respect existing structure and decision history when updating.

---

## 5. Dynamic Routing & Anti-Drift Guardrails

To prevent agent drift (such as a single agent assuming success on unverified native rendering tricks or prematurely marking discoveries as adopted), `@lead` dynamically routes incoming requests according to a 4-level classification:

| Level | Scope | Routing & Delegation | Quality Gate | Token Cost |
| --- | --- | --- | --- | --- |
| **Level 1: Local Tactical** | Typos, minor style adjustments, prop tweaks, unit test fixes. | **`@lead` delegates to `@ui` or `@tester`.** The lead strictly orchestrates and does not write code. | Progressive validation: `lint`, `typecheck`, `test`. | Minimal |
| **Level 2: UI Visual & Kinetic** | Animations (`playground`), gesture handling, screen transitions. | **`@lead` delegates to `@ui`.** | **Mandatory visual verification:** `scripts/ui-capture.sh` + `view_file`, or explicit user confirmation. Prohibited from closing the task solely on TypeScript compilation. | Moderate |
| **Level 3: Template & Reusable** | Screens in `base-template` (e.g. Settings), shared compound controls. | **`@ui` implements**, followed by **`@integrity` review (Flash tier)**. | Gate: accessibility verification (TalkBack/VoiceOver, single switch node) and ensuring zero leaks or unapproved dependencies in exportable `base-expo`. | Medium |
| **Level 4: Core Framework & API** | Changes to `packages/alambre`, new capabilities, `Storage` layer, SemVer bumps. | **Full pipeline:** `@lead` coordinates -> `@tester` creates regression suite -> `@integrity` audits contracts -> `@scribe` logs changelog/ADR. | Gate: contract tests in `packages/alambre/tests/public-api.test.ts` + documentation sync. | High (justified) |

### Anti-Drift Guardrails

1. **Zero Unverified Native Hacks:** If a proposed fix relies on non-standard React Native rendering assumptions (e.g. transparent ghost text spans, unusual flex overrides), the agent is strictly prohibited from considering it solved without empirical verification on device/emulator.
2. **Double-Signature Gate for Discoveries:** No agent may mark a pattern as `ADOPTED` in `docs/discoveries.md` unilaterally. New patterns must be logged as `PROPOSAL` by `@scribe` or the author, and can only transition to `ADOPTED` after validation by a second consumer and sign-off by `@integrity`.
3. **Resource-Conscious Review Tiers:** Auditors and loggers (`@integrity`, `@scribe`, `@tester`) run in the `flash` tier to keep token consumption and response latency minimal during day-to-day work.