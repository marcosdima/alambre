# Agent System

This document is the single source of truth for the multi-agent coordination system used to work on this repository with [Google Antigravity](https://antigravity.google).

The system coordinates a small team of specialized roles. Each role is materialized as a custom subagent under `.agents/agents/<role>/agent.md`. Agent definition files remain thin wiring; the knowledge and contracts live here in `docs/` (see `docs/index.md`).

All roles share the retrieval protocol defined in `.agents/skills/docs-retrieval/SKILL.md`.

---

## 1. System Topology & Model Matrix

| Role | Identifier | Model Tier | Recommended Model | Primary Cognitive Load / Responsibility |
| --- | --- | --- | --- | --- |
| **Lead / Orchestrator** | `@lead` | `pro` | Gemini 3.1 Pro | Requirement decomposition, implementation of all production code, dependency mapping, conflict resolution, and final synthesis. Selectable as the primary agent. |
| **Code Reviewer & Investigator** | `@reviewer` | `flash` | Gemini 3.8 Flash | Architecture and API audits, framework/app boundary and dependency-direction review, regression-risk analysis, investigation of unfamiliar code, and second signature on proposed discoveries. |
| **Test & QA Engineer** | `@tester` | `flash` | Gemini 3.8 Flash | Test suite authoring, edge case generation, mocks/fixtures setup, and test execution. High volume of tool calls, so the flash tier keeps cost low. |
| **UI Reviewer** | `@ui-reviewer` | `flash` | Gemini 3.8 Flash | Static (source-only) audit of JSX, styles, and design tokens against the UI contracts — hierarchy, spacing, a11y, theming. No device access. |
| **UI Verifier** | `@ui-verifier` | `pro` | Gemini 3.1 Pro (multimodal) | Runtime verification on the running Android emulator — deterministic screenshots, UI hierarchies, and Maestro flows. Device-only. |

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
| High reasoning + multimodal | Validating a rendered surface, capturing and reading emulator screenshots | `@ui-verifier` | `pro` |
| On-demand deep dive | Concurrency bug, race condition, non-trivial refactor | Any role invoked as needed | `pro` on demand via `/boost` |
| High volume of tools | Authoring/running tests, edge cases, mocks, lint/typecheck/build loops | `@tester` | `flash` |
| Search & consistency | Auditing the public API vs docs, drift detection, boundary review | `@reviewer` | `flash` |
| Source-only UI audit | Reviewing JSX/styles/tokens against the UI contracts | `@ui-reviewer` | `flash` |

Mechanical, high-volume patterns run on `flash`; `pro` is reserved for critical decisions and interfaces. This preserves the shared token quota on the student plan.

For large multi-agent efforts, the native `/teamwork-preview` orchestrator (paid plans) complements this system; this matrix covers the manual, repeatable workflow.

---

## 3. UI Verification & Testing Strategy

The repository follows a tiered testing strategy to balance fast iteration, resource efficiency, and visual fidelity:

1. **Component & Contract Testing (Headless):** Fast unit and contract testing with Vitest. Validates hooks, states, formatting, timer steps, and accessibility properties without launching native emulators.
2. **Deterministic UI Hierarchy (Emulator):** When verifying layout, alignment, or component placement on the Android emulator, use native XML inspection (`uiautomator dump`) to evaluate exact element bounding boxes (`[left, top][right, bottom]`) rather than guessing from pixels.
3. **Multimodal Visual Inspection:** For animations, physics, and visual aesthetics, use the single repository script `scripts/ui-capture.sh`:
   - Captures `.agents/artifacts/screen.png` and dumps `.agents/artifacts/hierarchy.xml`.
   - Read the image directly using Antigravity's native `view_file` (`@ui-verifier` runs on the multimodal `pro` tier).
   - **Strict prohibition:** NEVER generate disposable, ad-hoc Python scripts (`analyze_image.py`, etc.) to measure or inspect screenshots. Use `view_file` or inspect the XML hierarchy directly.

### 3.1 Verification Efficiency and Cost

The `@ui-verifier` is the most expensive and time-consuming agent in the system due to the latency of booting emulators, driving Maestro UI flows, and processing screenshots with the multimodal `pro` tier. To conserve resources, follow these delegation rules:

- **Do NOT use for Logic/State:** Never use `@ui-verifier` to verify state machines, API calls, or business logic. Use `@tester` (Vitest) instead—it runs in milliseconds with zero UI overhead.
- **Do NOT use for Static Styling:** For padding, margins, colors, or flexbox layouts, use `@ui-reviewer` to audit the JSX against the design tokens. Static auditing is instantaneous.
- **Defer to the User if possible:** If the developer is actively working on the simulator with live-reload (Expo Go), they can press `CMD+R` and verify visual changes instantly. Default to handing the implementation back to the user for visual confirmation rather than invoking an agent boot sequence, unless an automated UI-thread run adds genuine required confidence.
- **WHEN to use `@ui-verifier`:** Reserve it **strictly** for Reanimated kinetics (native UI-thread physics), native module integrations, complex gestures, or hunting hard crashes (e.g., native layout crashes) that cannot be reproduced in Node/Vitest. When testing, ensure it is directed to isolated testbeds where navigation is direct and deterministic.

Flow:
1. `adb devices` to confirm the device.
2. Install/relaunch the build: `pnpm --filter <app> apk:install` (or `expo run:android`).
3. Run `scripts/ui-capture.sh` to extract `screen.png` and `hierarchy.xml`.
4. Inspect `screen.png` via `view_file` or check numeric bounds in `hierarchy.xml`.
5. Interact deterministically: `adb shell input tap/swipe`.
6. Iterate until the surface matches the contracts in `docs/framework/ui-decisions.md`.

---

## 4. Documentation Retrieval

`docs/` is the single source of truth. All agents follow `.agents/skills/docs-retrieval/SKILL.md`:

- Enter through the catalog `docs/index.md`.
- Locate a section by heading with search, never read whole documents.
- Cite `file:section` and never paraphrase architectural decisions.
- Respect existing structure and decision history when updating.

---

## 5. Dynamic Routing & Anti-Drift Guardrails

To prevent agent drift (such as a single agent assuming success on unverified native rendering tricks or prematurely marking discoveries as adopted), `@lead` dynamically routes incoming requests according to a 4-level classification:

| Level | Scope | Routing & Delegation | Quality Gate | Token Cost |
| --- | --- | --- | --- | --- |
| **Level 1: Local Tactical** | Typos, minor style adjustments, prop tweaks, unit test fixes. | **`@lead` implements directly**; it may delegate test authoring to `@tester`. Delegation is optional at this level. | Progressive validation: `lint`, `typecheck`, `test`. | Minimal |
| **Level 2: UI Visual & Kinetic** | Animations (`playground`), gesture handling, screen transitions. | **`@lead` implements**, then **`@ui-reviewer` (source audit)** and **`@ui-verifier` (device)**. | **Mandatory visual verification:** `scripts/ui-capture.sh` + `view_file`, or explicit user confirmation. Prohibited from closing the task solely on TypeScript compilation. | Moderate |
| **Level 3: Template & Reusable** | Screens in `base-template` (e.g. Settings), shared compound controls. | **`@lead` implements**, followed by **`@ui-reviewer` audit (Flash tier)**. | Gate: accessibility verification (TalkBack/VoiceOver, single switch node) and ensuring zero leaks or unapproved dependencies in exportable `base-expo`. | Medium |
| **Level 4: Core Framework & API** | Changes to `packages/alambre`, new capabilities, `Storage` layer, SemVer bumps. | **Full pipeline:** `@lead` implements and coordinates -> `@tester` creates regression suite -> `@reviewer` audits contracts -> `@lead` syncs docs/changelog. | Gate: contract tests in `packages/alambre/tests/public-api.test.ts` + documentation sync. | High (justified) |

### Anti-Drift Guardrails

1. **Zero Unverified Native Hacks:** If a proposed fix relies on non-standard React Native rendering assumptions (e.g. transparent ghost text spans, unusual flex overrides), the agent is strictly prohibited from considering it solved without empirical verification on device/emulator.
2. **Double-Signature Gate for Discoveries:** No agent may mark a pattern as `ADOPTED` in `docs/logs/discoveries.md` unilaterally. New patterns must be logged as `PROPOSAL` by the author (the `@lead`), and can only transition to `ADOPTED` after validation by a second consumer and second-signature review by `@reviewer`.
3. **Resource-Conscious Review Tiers:** The auditors (`@reviewer`, `@ui-reviewer`) and `@tester` run in the `flash` tier to keep token consumption and response latency minimal during day-to-day work.