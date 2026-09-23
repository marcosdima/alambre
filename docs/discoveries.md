---
title: Discoveries
summary: Reusable patterns observed in app development that could be rescued into the alambre framework.
---

# Discoveries

Register of reusable patterns observed while building the reference application Colguetti (`apps/colguetti`) that could be rescued into `alambre`.

Each entry captures the pattern, where it appeared, and the candidate abstraction (if any). Nothing here is an adopted decision until it is validated and discussed in a design review.

## Structured collection persistence (discovered in I2)

**Pattern:** the app needs persisted collections of typed records (items, later alarms) with add/update/remove, plus plain JSON get/set/remove helpers.

**Where it appears:** `apps/colguetti/src/storage/` (json-storage, collection), `apps/colguetti/src/items/` (items-context, items-model).

**Current alambre surface is a poor fit:** `Storage` only supports string get/set (`packages/alambre/src/types/actions.ts`); there is no remove and no JSON handling. The config capability is flat string fields, not typed lists.

**Candidate for alambre:**

- Extend the `Storage` contract with an optional `remove` (`get(key)`, `set(key, value)`, `remove(key)`). Optional method keeps it additive; contract test in `tests/public-api.test.ts` must be updated.
- A content-driven capability factory `createCollectionProvider` — content = key + initial records, framework supplies load/CRUD/persist, mirroring the existing `createConfigProvider` shape.
- Validate against a second consumer (alarms in I3) before proposing.

**Status (I6): ADOPTED.** `Storage.remove` (optional) and `createCollectionProvider` ship with `alambre` (see `packages/alambre/CHANGELOG.md`, `docs/architecture.md` §8, and the Q3 decision log). Colguetti's items and alarms are the validating consumers.

## Screen forms need navigation params (discovered in I2)

**Pattern:** edit screens need to know which record they are editing, but the navigator behavior does not carry params.

**Where it appears:** `apps/colguetti/src/views/items/ItemForm.tsx` uses a `RouteIntent` context (`apps/colguetti/src/navigator/RouteIntent.tsx`) to pass `itemId` from the list into the form subpage.

**Candidate for alambre:** the navigator `navigate(target, { subpage })` settings could accept arbitrary params carried by the page path, or expose an optional `params` on the navigation settings. The `RouteIntent` context is the app-level prototype.

**Status (I6): NOT EXTRACTED.** Navigational params keep their app-level prototype (`RouteIntent`) until a second consumer demonstrates reuse. Same for the shared `createId` util (trivial, app-owned).

## The app re-implements the capability pattern with React context (discovered in I2)

**Pattern:** `ItemsProvider` (`apps/colguetti/src/items/items-context.tsx`) is essentially a content-driven provider: load on mount, typed actions, persist, context + hook. It reads like a manual rewrite of `createConfigProvider` with a richer (non-string) payload and async load.

**Candidate for alambre:** feeds into the `createCollectionProvider` idea above; also suggests a generic "async-loading provider" shape. If a `createCollectionProvider` lands in alambre, Colguetti's items and alarms both become its consumers.

**Status (I6): ADOPTED — superseded by `createCollectionProvider`.** `ItemsProvider` and `AlarmsProvider` are thin adapters now wrapping the shipped capability (see the first entry).

## Local-notification plan differs structurally from framework value (I4)

**Pattern:** recurring alarms must produce one repeating notification per selected weekday, with a persisted scheduling plan that is diffed against storage on every change (`ambos keys: schedule plan + reminders`).

**Where it appears:** `apps/colguetti/src/notifications/` (schedule, sync, NotificationsWatcher) and `apps/colguetti/src/checklist/checklist-model.ts` (pending detection, resend cadence).

**Assessment:** the scheduling/diff logic is lean and reusable, but it sits inside the `expo-notifications` ecosystem the app owns (ecosystem-first). The `Storage` contract (`remove`) + `createCollectionProvider` candidates remain the framework takeaways. Not planned for extraction without a second consumer.

## Delight kept in the app (I4-I5)

**Pattern:** checkbox strikes through item names; confirmed routine flashes a drawn tick (`AlambreIcons.Tick` + `iconAnimation`) before navigating; reminders re-alert only while within the resend window so the app never spams.

**Where it appears:** `apps/colguetti/src/views/home/Home.tsx`.

**Assessment:** presentation and identity stay in the app per §2/§6. No alambre surface change needed.

## Undo / Redo history state behavior (discovered in cross-logic)

**Pattern:** interactive stateful experiences (board games, logic puzzles, form editors, canvases) require an undo/redo stack (`past`, `present`, `future`, `undo()`, `redo()`, `canUndo`, `canRedo`, optional `maxLimit`).

**Where it appears:** `apps/cross-logic/src/domain/history-model.ts` and `apps/cross-logic/src/session/game-context.tsx`.

**Candidate for alambre:**
- A pure headless hook `useHistoryState<T>(initialState, options)` and core history helpers `createHistory<T>`, `pushHistory`, `undoHistory`, `redoHistory`, `canUndo`, `canRedo`.
- Fully decoupled from UI and presentation.

**Status: ADOPTED (cross-logic).** Shipped in `alambre` (`src/hooks/use-history-state.ts`) and exported top-level as `useHistoryState` and history helpers. Validated with unit tests in `packages/alambre/tests/hooks/use-history-state.test.ts`.

## Elapsed time / stopwatch behavior (discovered in cross-logic & colguetti)

**Pattern:** apps require elapsed time tracking, pauses, countdowns or formatted time representations (logic puzzle timer in Cross Logic, routine activation windows in Colguetti).

**Where it appears:** `apps/cross-logic/src/session/game-context.tsx` and `apps/colguetti/src/checklist/activation-context.tsx`.

**Candidate for alambre:**
- A headless `useStopwatch` hook exposing `{ seconds, isRunning, start, pause, reset, formattedTime }` and pure helper `formatStopwatchTime`.
- Presentation remains 100% owned by the application.

**Status: ADOPTED (cross-logic, colguetti).** Shipped in `alambre` (`src/hooks/use-stopwatch.ts`) and exported top-level as `useStopwatch` and `formatStopwatchTime`. Validated with unit tests in `packages/alambre/tests/hooks/use-stopwatch.test.ts`.

## Headless animation stagger coordination (discovered in cross-logic, base-template, playground)

**Pattern:** sequential UI elements (menu buttons, list cards, settings sections) benefit from staggered entrance timing, but coupling timing to specific visual transitions (`FadeInDown`, `FadeInLeft`, springs) or layout containers causes awkward abstractions and restricts design freedom.

**Where it appeared:** `cross-logic` animation experiments, `base-template` navigation menus, and `playground` test cards.

**Candidate for alambre:**
- A pure headless delay calculation `calculateStaggerDelay(index, options, isReducedMotion)`.
- A headless hook `useStagger(options)` returning `{ getDelay(index), isReducedMotion }`.
- Automatically respects accessibility preferences: returns `0` when `useReducedMotion()` is active to prevent sluggish stalls.
- Optional context propagation (`StaggerProvider`, `useStaggerItem`) for deep trees.
- Concrete visual animations, curves, and wrappers remain 100% owned by the application.

**Status: ADOPTED.** Shipped in `alambre` (`src/hooks/use-stagger.tsx`) and exported top-level (`useStagger`, `calculateStaggerDelay`, `StaggerProvider`, `useStaggerItem`). Validated with unit tests in `packages/alambre/tests/hooks/use-stagger.test.tsx`.

## Decoupled two-layer layout and gesture animation for swipe-to-dismiss (discovered in playground & base-template)

**Pattern:** transient cards (such as toasts, modals, banners, or dismissible list rows) combining gesture-driven swipe-to-dismiss (`Gesture.Pan`) with Reanimated unmount layout animations (`exiting={FadeOut*}`) suffer from a severe visual glitch: when dismissed via swipe, the view is translated off-screen; upon unmount, Reanimated's exiting layout animation takes over native positioning starting from the layout origin (`translateX: 0`), instantaneously teleporting the card back into the screen center and playing the exit animation on an already-dismissed element.

**Where it appeared:** `apps/playground/src/providers/toast.tsx` and `apps/base-template/src/providers/toast.tsx`.

**Solution / Architectural Pattern:**
1. **Decouple into two layers:**
   - Outer layout container (`cardWrapper`): owns `key={id}`, `entering={FadeInDown / FadeInUp}`, and `exiting={isGestureDismissed ? undefined : exitAnimation}`.
   - Inner interactive element (`card`): owns gesture styles from `useAnimatedStyle` (`translateX`, `translateY`, clamped `opacity`).
2. **Dynamic `exiting` suppression:**
   - Track `isGestureDismissed`. When the user flings/swipes past the dismissal threshold, immediately set `isGestureDismissed = true` before invoking `dismiss()`.
   - When the component unmounts, Reanimated evaluates `exiting` as `undefined` and cleanly unmounts without creating an exiting snapshot at the origin.
   - For auto-dismiss timers and explicit close button taps (where no gesture occurred), `isGestureDismissed` remains `false`, seamlessly executing `FadeOutDown` or `FadeOutUp`.
3. **Clamped opacity during drag:**
   - Use `Extrapolation.CLAMP` on gesture drag interpolation so opacity smoothly transitions from `1` to `0` without negative opacity glitches.

**Status: ADOPTED.** Standardized in `apps/base-template/src/providers/toast.tsx` and documented in `docs/reference/behaviors.md` §3.