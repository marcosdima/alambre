---
id: RFC-0006
title: "Proposal 6: Traveling Wavefront & Kinetic Orchestration Architecture (`useWavefront`, `calculateWavefrontPhase`)"
status: RESOLVED
author: @lead
scope: alambre (core/kinetics, hooks)
summary: "Traveling wavefront & kinetic orchestration architecture (`useWavefront`, `calculateWavefrontPhase`)."
---

[← Back to Proposals Index](./index.md)

# Proposal 6: Traveling Wavefront & Kinetic Orchestration Architecture (`useWavefront`, `calculateWavefrontPhase`)

### Status: RESOLVED
- Shipped headless wavefront orchestrator `useWavefront` (with alias `useKineticOrchestrator`) in `packages/alambre/src/hooks/use-wavefront.ts`.
- Added closed-form analytical curves (`criticallyDampedCurve`, `bouncyCurve`, `cubicEaseOutCurve`, `polynomialOvershootCurve`), traveling wave worklet `calculateWavefrontPhase`, Apple-style duration springs, and frame-budgeted stagger windowing in `packages/alambre/src/core/kinetics.ts` and `packages/alambre/src/hooks/use-stagger.tsx`.
- Optimized `@alambre/ui` components (`AnimatedCascade`, `WavyText`, `CountUpText`) to eliminate $N$-ODE spring concurrency overload and layout thrashing.
- Contract-tested and verified with testbed in `apps/playground/src/views/kinetics/KineticOrchestratorTestbed.tsx`.

### 1. Current Problem
- **$N$-ODE Spring Concurrency Overload:** When cascading or staggering entering animations across $N$ list items or tags, each child running `withSpring()` creates an active C++ numerical ODE step solver in Reanimated on the UI thread. With 30–50 items, this saturated the frame budget (4–6ms/frame on 120Hz displays), triggering frame drops and touch latency.
- **Layout Thrashing Cascade:** `AnimatedCascade` paired staggered entries with `LinearTransition.springify()`. When mounting $N$ items sequentially, every mount triggered a layout cascade update across all preceding siblings, causing an $O(N^2)$ Yoga layout calculation storm on the UI thread.
- **Micro-Timer Thread Flooding:** Infinite text animations (`WavyText`) spun up $N$ separate timers and $2N$ shared values, competing with gesture responders for UI thread cycles.

### 2. Proposed Solution
1. **Mathematical Closed-Form Traveling Wavefront:**
   - Coordinate $N$ items with a single master progress clock ($\tau \in [0, 1]$) driven by timing or spring.
   - Partition phase on the UI thread analytically:
     $$\phi_i(\tau) = \operatorname{clamp}\left( \frac{\tau \cdot T_{\text{total}} - i \cdot \Delta t}{D}, 0, 1 \right)$$
   - Evaluate closed-form analytical transfer functions (Critically Damped, Bouncy, Overshoot, Cubic) in scalar worklets, eliminating $N$ concurrent numerical ODE integrators.
2. **Paced Stagger Windowing:**
   - In `useStagger`, provide batch windowing (`batchSize`, `batchIntervalMs`) via `calculateBudgetedStaggerDelay` to prevent scheduling spikes.
3. **GPU-Accelerated Cascade:**
   - Ensure staggered entrances run purely on GPU-backed transforms (`transform`, `opacity`) without invoking Yoga layout transitions during initial waterfall mounting.
4. **Single-Clock Harmonic Text:**
   - Refactor looping text animations to a single UI-thread periodic clock evaluated with harmonic wave functions (`wrapPhase`, `harmonicValue`).

### 3. Pros & Cons
- **Pros:**
  - Reduces CPU footprint of staggered animations from $O(N)$ active ODE solvers to $O(1)$ master clock with zero frame drops.
  - 100% backward compatible: preserves existing `kinetics` spring and timing definitions while adding duration springs and analytical curves.
  - Completely eliminates initial layout thrashing in cascade lists.
- **Cons:**
  - Closed-form curves assume monotonic progress $\tau \in [0, 1]$; highly dynamic runtime interruption mid-wave requires driving $\tau$ with a master spring.

---

[← Back to Proposals Index](./index.md)
