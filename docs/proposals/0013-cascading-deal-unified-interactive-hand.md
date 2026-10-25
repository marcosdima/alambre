---
id: RFC-0013
title: "Proposal 13: UI-Thread Cascading Deal & Unified Interactive Hand (`useCascadeFlight`, `useInteractiveHand`)"
status: RESOLVED
author: @lead
scope: alambre (kinetics)
summary: "UI-thread cascading deal & unified interactive hand (`useCascadeFlight`, `useInteractiveHand`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 13: UI-Thread Cascading Deal & Unified Interactive Hand (`useCascadeFlight`, `useInteractiveHand`)
- **Status**: RESOLVED (Implemented in `packages/alambre` — `computeSpatialCascadePlan` / `computeDealCascadePlan`, `calculateResponsiveHandFan`, `useCascadeFlight` / `useDealCascade`, UI-thread `useCascadeFlightItem`, `reorderHandItems`, `resolveHandReorderIndex`, and `useInteractiveHand`)
- **Author**: @lead

### 1. Current Problem
- **JS Timer Stagger Drift in Dealing:** `CascadeFlightItem.tsx` in `apps/playground` schedules sequential card deal launches using JavaScript `setTimeout(..., spec.startDelayMs)`. Under JS bridge traffic (e.g. multiplayer message processing or state updates), `setTimeout` introduces frame-pacing jitter compared to UI-thread animation delays.
- **Single-Mode Hand Interaction:** `CardHand.tsx` only supports single-card tap selection (`selectedCardId: string | null`) and upward swipe-to-play (`useKineticSwipe` with `directions: ['up']`). Production card games require:
  1. **Horizontal Drag-to-Reorder:** Dragging a card left/right along the curved hand fan to reorganize a hand, with neighboring cards smoothly shifting via spring physics to preview the new slot.
  2. **Seamless Drag-Out-to-Play Handoff:** Continuing that same drag upward past an escape threshold (or releasing over a table drop zone) to transition from hand reordering into a table play/toss without lifting the finger.
  3. **Multi-Card Combo Selection:** Selecting multiple cards simultaneously (pairs, straights, melds, or batch discards) with coordinated fan lift and batch play trajectories.

### 2. Proposed Solution
1. **UI-Thread Cascade Orchestrator (`computeSpatialCascadePlan<T>`, `useCascadeFlight<T>`):**
   - Promote generic `computeDealCascadePlan` and `calculateResponsiveHandFan` into `packages/alambre`.
   - Drive staggered flight delays natively on the Reanimated UI thread (`withDelay`) rather than JS `setTimeout`, exposing per-item landing callbacks (`onItemLanded`) and batch completion (`onCascadeComplete`).
2. **Headless Interactive Hand Hook (`useInteractiveHand<T>`):**
   - Manages ordered item state, single or multi-select sets (`selectionMode: 'single' | 'multiple'`, `maxSelected`), and responsive fan slot transforms.
   - Unified 2D pan gesture per item:
     - When `|translationY| < escapeThresholdY`: computes active hover slot index along the fan arc and shifts sibling slots in real time on the UI thread.
     - When `translationY < -escapeThresholdY`: exits reorder mode and hands off to free 2D drag/toss toward table drop zones.

### 3. Pros & Cons
- **Pros:**
  - Delivers AAA mobile card-game feel (Hearthstone / Balatro / Marvel Snap style in-hand sorting + drag-to-play + multi-card combos) as a reusable headless primitive.
  - Zero JS timer drift during rapid multi-card dealing.
- **Cons:**
  - Requires careful gesture arbitration on small screens so horizontal fan dragging and vertical pull-out transitions feel predictable.

---

[← Back to Proposals Index](./index.md)
