---
title: Project Guidelines
summary: Purpose, structure, agent autonomy rules, code quality, testing, and documentation conventions for this repository.
---

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
* `apps/cross-logic` — logic puzzle game application validating game sessions, history state, and grid models.
* `apps/base-template` — the application template: a generic, product-free skeleton on top of `alambre`, intended to provide a solid, opinionated starting point for future applications. It is rebuilt when lessons from the reference application make the wiring worth updating, and its canonical standalone copy is published as the GitHub template repository `marcosdima/base-expo` (regenerated with `scripts/export-template.sh`). Apps bootstrapped with *"Use this template"* depend on the published `alambre` package (npm/pnpm) and are independent from this repository.
* `apps/playground` — the interactive proving ground: an isolated environment for testing animation parameters, toast behaviors, edge cases, and UI primitives without cluttering the starter template.

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

---

## 14. Aesthetic Cleanup Lot (feature/aesthetic-cleanup)

A batch of visual refinements carried out on `feature/aesthetic-cleanup` before merging into `main`. The decisions are shared across the framework and both apps.

### Sun fills amber, shapes stop filling black

`base/` `Circle` defaults to `fill: 'none'` so strokes stay outlines; the SVG default (black fill) was leaking into composed shapes like the catalog icons. `Sun` now defaults `fill` to amber `#fbbf24` (overridable); a consumer can still supply `fill` to change it, but the framework no longer identity-paints.

### `Path` primitive re-introduced with a shared drawing contract

`base/` `Path` is restored as a valid icon primitive: `pathLength` is normalized to `1` and the draw animation uses `strokeDasharray: 1` via `useIconAnimation` — the same contract as `Circle` and `Line`. Rotation is relative to `(0, 0)` (consistent with the other primitives). This enables the catalog icons to draw arcs and smooth curves without native path measurement.

### Catalog icons redesigned

The nine catalog icons in `apps/colguetti/src/items/icon-catalog.tsx` were rewritten with `Circle`, `Line` and the new `Path` primitives, following the user-provided descriptions (argolla diagonal + perforated key, bifold wallet, smartphone with notch, folded document, umbrella + J-hook, water bottle with droplet, meds composition, charger with USB-C loop, backpack dome + pocket + straps).

### TimePicker: `visibleCount` defaults to 3

`visibleCount` changed from `5` to `3` (previous / current / next value visible) to keep the viewport compact while the increment/decrement arrows and wrap-around at range edges still cover all values. A scroll wheel with momentum and snap is deferred; the fixed-tap viewport avoids nested-scroll and layout-jump issues.

### Toggle disc: per-theme colors, lower opacity

The light/dark switcher's disc sits over a fixed-position background circle; its opacity was lowered to `0.22` so it no longer draws attention away from the icon underneath. The circle color is now **owned by the app** via a per-theme mapping: light `#0b525b`, dark `#9eebce`. Both `apps/colguetti/src/components/ToggleLightDark.tsx` and `apps/base-template/src/components/ToggleLightDark.tsx` share this presentation; `Settings.tsx` provides the per-theme circle hex. The framework has no opinion on the toggle's look.

### Alarm count i18n

The hard-coded `"{count} ítems"` string in `Alarms.tsx` moved into `lang.alarms.count` (with a fallback to `lang.alarms.itemsLabel` when the count is zero), keeping alarm rows fully localised.

### Confirm: dead `resolve` field removed

`Confirm` no longer carries the `resolve` callback: the state owns it in a ref. The public type stays `{ data: RegisterConfirm }`; `data` is the only visible field. This eliminates the unused leakage introduced when the confirm behavior was extracted.

---

## 15. Background Alarms, Permissions & OS Synchronization

Lessons and contracts established during the development of Colguetti 1.0 (`apps/colguetti`):

### Android exact alarms and battery Doze

On Android 12+ (API 31+), Android restricts exact background task execution to conserve battery. When a device enters Doze mode, standard scheduled notifications (`AlarmManager.setAndAllowWhileIdle`) are batched into OS maintenance windows, delaying alarms by 9–15+ minutes.

To guarantee reliable delivery:
* **Permissions:** Android 12 requires `android.permission.SCHEDULE_EXACT_ALARM`. Android 13/14 (API 33+) requires `android.permission.USE_EXACT_ALARM` for alarm/timer applications (which is granted automatically at install time).
* **Exact triggers:** Use exact `DATE` triggers (`trigger: { type: 'date', date: futureDate }`) instead of relative time intervals when waking from background.
* **Dedicated High-Priority Notification Channel:** Notifications must target a dedicated channel (e.g. `colguetti-alarms`) configured with `AndroidImportance.MAX`, `vibrationPattern`, and `sound: true`. On Android 8+, once a notification channel is created on device, its importance cannot be programmatically elevated; any priority elevation requires a freshly named channel.

### Reactive `AppState` synchronization

External state transitions—such as a user opening system settings via `Linking.openSettings()` to enable permissions or the device sleeping while a routine window elapses—do not emit JavaScript callbacks while the app is backgrounded.

To prevent frozen counters or stale permission indicators:
* Subscribe to `AppState.addEventListener('change', (state) => { if (state === 'active') ... })`.
* On `'active'`, immediately re-read system permissions via `Notifications.getPermissionsAsync()` without requiring an app process restart.
* Re-evaluate `new Date()` upon resume so expired routines close cleanly and immediate alerts fire without UI stalls.

---

## 16. E2E Testing with Maestro & Out-of-App Transitions

End-to-end testing with Maestro must account for interactions that navigate outside the application's view hierarchy:

### System settings and external URLs

1. **System settings (`Linking.openSettings()`):**
   * Tapping system settings opens `com.android.settings`.
   * To return cleanly without relying on brittle relative `back` presses, use `launchApp: { clearState: false }` in subflows (`apps/colguetti/e2e/subflows/return-to-app.yaml`). This brings the application back to the foreground with full React state preserved and triggers `AppState` listeners.

2. **External URLs (`Linking.openURL()`):**
   * External links launch the default browser (Chrome).
   * To prevent Chrome's First Run Experience (terms and sync wizard) from blocking unattended CI or emulator runs, `scripts/e2e.sh` automatically writes `echo 'chrome --disable-fre' > /data/local/tmp/chrome-command-line` on connected adb devices prior to running test flows.

3. **Runtime permissions dialogs:**
   * Handled conditionally via `runFlow: when: visible: ".*(Allow|Permitir).*"` or pre-granted via `adb shell pm grant` in `scripts/e2e.sh`.
