# Project Guidelines

## 1. Purpose

This repository exists to build and maintain a solid, reusable foundation for developing React Native applications.

The main reusable framework is `packages/alambre`. It provides generic infrastructure and capabilities that are useful across applications, such as theming, language management, animation systems, data/API infrastructure, and other reusable application foundations.

The repository may also contain example applications, prototypes, and validation projects. These applications are primarily used to exercise the framework, expose weaknesses, and guide its evolution.

The goal is not to build a framework that attempts to solve every possible application need. The framework should remain focused on reusable infrastructure and abstractions.

---

## 2. Project Structure

The main conceptual boundaries are:

* `packages/alambre` — the reusable framework.
* `apps/*` — example, validation, and prototype applications used to exercise and evolve the framework.
* `docs/` — project documentation and architectural knowledge.

The repository also contains:

* `apps/colguetti` — the reference application: a real product built on `alambre` that exercises the framework, exposes weaknesses, and guides its evolution. Prototyping for potential framework capability happens here first.
* `apps/base-template` — the application template: a generic, product-free skeleton on top of `alambre`, intended to provide a solid, opinionated starting point for future applications. It is rebuilt when lessons from the reference application make the wiring worth updating.

An application created from the template should be able to evolve independently from `apps/base-template` and from this repository.

---

## 3. Architecture Principles

### 3.1 Dependency direction

Dependencies must flow from applications toward reusable packages.

Applications may depend on `alambre`.

`alambre` must not depend on application-specific code.

The framework should remain usable without knowing anything about a particular application, prototype, or product.

### 3.2 Reuse without speculation

A capability should belong in `alambre` when it represents genuinely reusable application infrastructure.

Examples include concepts such as:

* language management
* theming
* animation infrastructure
* configuration
* reusable data/API infrastructure
* other generic application foundations

Potential reuse alone is not sufficient justification for introducing an abstraction.

When reuse is uncertain, prefer implementing and validating the idea in an application first.

### 3.3 Framework boundaries

`alambre` should provide reusable infrastructure and abstractions, not attempt to become a general-purpose library containing every solution an application might need.

Application-specific behavior belongs in applications.

UI or domain concepts should only become part of the framework when there is a clear and justified reusable concept behind them.

### 3.4 Preserve established concepts

Existing architectural decisions should be respected.

An implementation may be improved, simplified, refactored, or replaced when the underlying architectural concept remains intact.

However, replacing an established concept with a fundamentally different one is an architectural decision and must not be done implicitly.

---

## 4. Agent Autonomy

Agents are expected to work as autonomously as possible within the established architecture.

### 4.1 Autonomous changes

An agent may independently:

* improve implementations
* simplify internal code
* refactor implementation details
* improve providers or capabilities
* reorganize internal code when appropriate
* improve tests
* remove unnecessary complexity
* fix bugs
* improve performance or maintainability

These changes do not require prior approval when they preserve the established architectural concepts and project boundaries.

Agents should validate their changes rather than waiting for manual verification.

### 4.2 Architectural decisions

An agent must stop and consult before making a change that fundamentally alters an established concept, boundary, or architectural direction.

Examples include:

* replacing a fundamental abstraction with a different conceptual model
* changing the dependency boundaries between applications and packages
* deciding that an application capability should become framework infrastructure
* removing an established architectural concept because the agent believes another model is fundamentally better
* introducing a major new architectural layer

When such a situation is encountered, the agent should:

1. Clearly identify the problem or limitation.
2. Explain why the existing approach may be insufficient.
3. Present the relevant alternatives.
4. Recommend an option and explain why.
5. Wait for discussion and approval before implementing the conceptual change.

The goal is not to minimize agent autonomy. The goal is to preserve human control over architectural direction while allowing agents to handle implementation decisions independently.

---

## 5. Framework Extraction

When an agent encounters functionality that may be reusable, it should analyze whether the functionality belongs in `alambre`.

If the concept is clearly generic infrastructure, the agent may propose adding it to the framework.

If the reuse case is uncertain, the preferred approach is to experiment with the functionality in an application first.

Agents must not extract application code into `alambre` solely because it *could potentially* be reused.

When extraction would represent a new architectural decision, the agent should present the reasoning and recommendation before applying it.

---

## 6. Code Quality

Code should prioritize:

* clarity
* type safety
* maintainability
* simple composable abstractions
* explicit dependencies
* appropriate reuse
* minimal unnecessary complexity

TypeScript should remain strongly typed. Avoid `any` and do not weaken existing type safety to make an implementation easier.

Existing linting and TypeScript rules must not be disabled or weakened to accommodate a change.

Prefer existing dependencies and React Native capabilities when they adequately solve the problem.

Do not introduce abstractions without a concrete reason to have them.

---

## 7. Testing and Validation

Changes are not considered complete while known lint, typecheck, test, or build failures remain.

Validation should be performed progressively:

1. Validate the affected package or application.
2. Run relevant tests and static checks.
3. Run the repository-wide validation when appropriate.
4. Confirm the final state before considering the work complete.

Agents should add or update tests when behavior changes or when a new reusable capability warrants coverage.

Tests should validate behavior and architectural contracts rather than implementation details unnecessarily.

---

## 8. Documentation

Project knowledge should primarily live under `docs/`.

Documentation should describe concepts, decisions, architecture, and workflows rather than duplicate implementation details unnecessarily.

Tool-specific configuration files such as `AGENTS.md`, `.clinerules`, or agent definitions should remain minimal and should not become competing sources of truth.

When an architectural decision is made, update the appropriate documentation so that future agents and contributors can understand the reasoning behind it.

---

## 9. Git

Changes should be committed in coherent units.

Use the following commit format:

```text
[action]: [headliner]

* Important change 1.
* Important change 2.
```

Allowed actions include:

* `add`
* `update`
* `fix`
* `refactor`
* `remove`
* `test`

Local commits are allowed and encouraged when they represent coherent completed work.

Do not amend or rebase commits unless explicitly requested.

---

## 10. Working Philosophy

Prefer understanding and improving the system over blindly following existing implementation patterns.

When an implementation can be made substantially simpler without changing the architecture, prefer the simpler implementation.

When requirements or architectural intent are ambiguous, surface the ambiguity rather than silently choosing a fundamentally different direction.

Agents should challenge existing implementations when there is a concrete reason to do so, while distinguishing between:

* improving an implementation, and
* changing the concept itself.

The first is part of autonomous development.

The second requires discussion.

---

## 11. Deferred Work

Items intentionally left for a future implementation, kept here so they are not lost:

* **Toast with actions in `alambre` (rejected for destructive confirmations)** — `ToastProvider` supports action buttons (`RegisterToast.actions`, added in commit `77b4efe`), but using them as a replacement for destructive confirmations in `apps/colguetti` was rejected: a confirmation is a blocking decision, while a toast is a transient, non-blocking affordance (progress bar, close button, non-modal overlay do not fit a decision the user must take). Destructive confirmations now use the `ConfirmProvider`/`useConfirm` behavior (extracted from colguetti's `ConfirmDialog`). Revisit toast actions only for non-destructive quick actions (e.g. undo).
* **Alarm with no weekdays selected** — the alarm form treats weekdays as optional (validation only requires a name). The intended semantics for an alarm without days is a one-time alarm: it fires today and auto-disables after confirming. Not implemented yet because it touches the alarm model and the scheduler. Until decided and built, an alarm with no days simply never fires.

---

## 12. Reference App: Alarm Activation Flow

`colguetti` alarms do not auto-start a routine when they fire. A scheduled alarm *proposes* activation: Home offers the day's pending alarms with an explicit "Activate" button, and the weekly notification only invites the user to open the app ("¿Querés activarla?").

Activating starts a per-alarm activation window (default 10 min, 1–60, editable in the alarm form). The routine runs inside that window with a live countdown. The missing-items set is a snapshot of the items unchecked at activation; while the app is open, ticking items re-agendas the alert, and with the app closed the last snapshot stands.

On expiry the routine closes and does not return until the next scheduled occurrence; confirming a closed routine no longer counts.

The notification layer mirrors this:

* Weekly invites carry an "Activar" action that opens the app onto the running routine.
* When items are missing at expiry, an alert with the unchecked snapshot fires; its "Posponer 10 min" action extends the window (or re-opens the routine if it was already closed) and opens the app.
* When everything was checked, a success alert fires instead.
* Tapping an invite lands on the proposal; tapping the missed alert lands on the missed result so it can be re-activated.

Routines persist as `colguetti.activeRoutine`; confirmed routines still write a `confirmations` entry. The snooze interval is fixed at 10 minutes and is not per-alarm.

---

## 13. Framework Evolution: Storage and Confirm

Two capabilities were extracted from the reference application into `alambre`, once validated by the apps:

* **Storage layer** — `createStorage({ getItem, setItem, removeItem })` adapts an app's key-value binding to the framework `Storage` contract, and `getJson`/`setJson`/`removeJson`/`readCollection`/`writeCollection` provide JSON access over it. The storage bootstrap (`RawStorage`/`JsonStorage` types, json helpers, `toAlambreStorage`) was duplicated byte-for-byte across `apps/colguetti` and `apps/base-template`; both now build a single `app/src/storage/index.ts` from `createStorage` and keep only the AsyncStorage binding (`utils/storage.ts`) app-side, since `alambre` stays agnostic of React Native modules. Cross-cutting reads outside React (the notification scheduler) use `readCollection`/`writeCollection` directly.

* **Confirm dialog behavior** — `ConfirmProvider`/`useConfirm` mirror the `ToastProvider` pattern: `confirm(request)` returns a promise resolved by the app-registered `ConfirmComponent` (`onConfirm` → `true`, `onCancel`/`dismiss` → `false`). `alambre` ships the blocking-confirmation concept; the look & feel stays in the app (`apps/colguetti/src/components/ConfirmDialog.tsx`), which also defaults the cancel label from the app language. This replaces the previous in-app `ConfirmDialog` wiring (one `useState` target + `visible` prop per view) in the delete flows of `Alarms` and `Items`.

`apps/base-template` was rebuilt on these lessons (§2), removing its copies of the storage layer.
