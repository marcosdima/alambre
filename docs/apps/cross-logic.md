---
title: Cross Logic Backlog and Decisions
summary: Architectural decisions, backlog units, and validation protocol for apps/cross-logic improvements.
---

# Cross Logic: Improvements & Backlog

This document serves as the single source of truth for the backlog and closed decisions of `apps/cross-logic` during the execution of `feature/cross-logic-improvements`.

---

## 1. Context & Scope

`apps/cross-logic` is a deductive logic grid puzzle application (Einstein puzzles) built on `alambre`. It exercises interactive grid state, undo/redo history, automatic crossing rules, and session persistence.

This batch of improvements refines the core grid interaction model, streamlines navigation and puzzle selection, introduces record tracking and replay, implements an in-app puzzle creator with formal solver verification, and polishes the theme toggle aesthetic.

---

## 2. Closed Decisions

The following architectural and product decisions are closed and not subject to redesign:

1. **Puzzle Creator**: Structured clues (`Clue.relation` typed) + solver that mandates a unique solution matching the declared `solutionTuples`.
2. **Creator Dimensions**: Up to 4 categories × 4 items.
3. **Derived Auto-cross**: Inferred `auto-cross` cells are purely derived and non-interactive; they can only be cleared by unticking the tick that justifies them.
4. **Execution Order**: The 6 units must be executed in the exact defined sequence.
5. **Git Protocol**: Work must be performed on branch `feature/cross-logic-improvements` (never on `main`), with exactly one commit per unit following `docs/project.md` §9 format.

---

## 3. Backlog Units

### Unit 1: Bug X Inferidas (`recomputeAutoCross`)
- **Problem**: Incremental mutation (`applyAutoCross`/`removeAutoCross` alongside `cellTapped` in `game-context`) causes bugs where unticking a cell may inadvertently remove crosses that are still justified by other existing ticks.
- **Solution**: Replace incremental cross mutation with a pure, idempotent `recomputeAutoCross` function.
- **Rule**: Cells marked as inferred `auto-cross` are derived, non-interactive, and cleared only when no active tick justifies them.
- **Verification**: Regression test where tick at (0, 0) crosses out (0, 1); tick at (1, 1) also justifies crossing (0, 1) or its row/col; unticking (1, 1) leaves (0, 1) crossed because (0, 0) remains ticked.

### Unit 2: Títulos
- **Changes**: Remove difficulty badge from `GameScreen` and `VictoryModal`.
- **Header**: Game header displays the puzzle title (`puzzle.title`).

### Unit 3: Menú
- **Changes**:
  - Simplify `Home.tsx` to serve as a clean main menu (e.g. Play, Puzzle Creator, History, How to Play, Settings).
  - Add new view `GameSelect` allowing difficulty selection, game mode selection (Zen vs Challenge), and puzzle selection (list of available puzzles or random pick).
  - Update routing and navigation tree (`navigator.tsx`, `AppNavigatorBody.tsx`).
  - Add full i18n support in `es` and `en` for all new menu and selection strings.

### Unit 4: Historial
- **Changes**:
  - Enhance `records-context` to compute and store best times indexed by `(puzzleId, mode)`.
  - Add a dedicated `History` view displaying completed games, best times, and statistics.
  - Implement replay capability: launching a game directly into the selected puzzle via `startNewGame(difficulty, mode, puzzleId)`.

### Unit 5: Creador de Puzzles
- **Changes**:
  - Implement `domain/solver.ts`: logic solver that validates that a puzzle has one and only one unique solution, and verifies that this solution matches the declared `solutionTuples`.
  - Guided UI for creating puzzles: categories/items definition (up to 4x4), solution configuration, structured clue builder (`Clue.relation`).
  - Real-time / validation feedback: ✅ Valid (unique solution matching declared tuples), ⚠️ Underconstrained / Multiple solutions, ❌ Contradictory / Invalid.
  - Persistence: `puzzles-context` (`cross-logic.customPuzzles` in storage) placed above `GameProvider`, passing custom puzzles to `service.ts` so they appear in `GameSelect`.
  - Note: Sharing / export functionality is deferred.

### Unit 6: Sombra del Toggle de Tema
- **Changes**:
  - Theme toggle presentation refinement: scale growth of ~10% and drop shadow underneath the light/dark icons.

---

## 4. Validation Protocol

Per `docs/project.md` §7 and `.agents/AGENTS.md`:
1. `pnpm --filter @alambre/cross-logic lint`
2. `pnpm --filter @alambre/cross-logic typecheck`
3. `pnpm --filter @alambre/cross-logic test`
4. Repo-wide check before completion: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
