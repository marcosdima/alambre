# Cross Logic

A deductive **logic grid puzzle** game (a.k.a. Einstein puzzles): cross out impossible pairings across categories and tick the correct ones until every clue is satisfied.

It is the second application built on `alambre` and a validation surface for framework behavior beyond the reference product (`apps/colguetti`): interactive grid state, headless undo/redo history, automatic crossing rules and session persistence.

## Overview

- **Difficulties:** `easy`, `medium`, `hard` (built-in puzzle catalog in `src/domain/puzzles/`).
- **Modes:** `zen` (no penalty) and `challenge` (a wrong tick is a mistake; three mistakes defeat the game).
- **Auto-cross:** a config flag (`autoCross`) that crosses out the pairings excluded by a tick.
- **Clue strikethrough:** manually mark clues as used.
- A running timer, best-time tracking and a victory modal close the loop.

## What is wired in

- Expo SDK 54 / React Native 0.81 (native run with `expo run:android`).
- `alambre` capabilities and behaviors over a `Storage` adapter (`src/storage/`):
  - `createConfigProvider` — `autoCross`, `defaultMode`, `defaultDifficulty` (`src/providers/config.ts`).
  - `createLightDarkProvider` (`src/providers/theme.ts`).
  - `createLangProvider` (es/en, `src/providers/lang.tsx`).
  - `NavigatorProvider` + `ToastProvider` with an app-owned toast body (`src/providers/toast.tsx`).
  - `createCollectionProvider` for completed-game records (`src/session/records-context.tsx`).
- Storage helpers `getJson`/`setJson`/`removeJson` to persist and restore the active game (`src/session/game-context.tsx`).
- App-owned presentation: `AppButton`, `AppTitle`, `ToggleLightDark`, `ConfirmDialog` and the grid components under `src/components/`.

## Framework validation

This app is where the undo/redo and elapsed-time patterns were first prototyped before being adopted by `alambre` as `useHistoryState` and `useStopwatch`. The local models still live in `src/domain/history-model.ts`, which is what `packages/alambre` was validated against.

## Commands

From the repository root:

```bash
pnpm --filter @alambre/cross-logic start
pnpm --filter @alambre/cross-logic android    # expo run:android
pnpm --filter @alambre/cross-logic ios        # expo run:ios
pnpm --filter @alambre/cross-logic lint
pnpm --filter @alambre/cross-logic typecheck
pnpm --filter @alambre/cross-logic test
```

Inside the monorepo the app resolves `alambre` from its TypeScript source through Metro; rebuild the library after a framework change with `pnpm --filter alambre build`.
