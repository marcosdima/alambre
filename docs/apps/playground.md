---
title: Playground App Verification & Documentation
summary: Interactive proving ground and testbed for UI primitives, gesture physics, carousels, and rich parameter sandboxes.
---

# Playground (`apps/playground`)

`apps/playground` (`@alambre/playground`) is the dedicated interactive proving ground in the monorepo. It isolates UI experiments, kinetic physics, and edge-case parameter testing so that `apps/base-template` remains a clean, production-ready starter template.

---

## 1. Playground Directives & Principles

To maintain agility and prevent playground from becoming an unmaintained graveyard of dead tests:

1. **Rich Configuration Sandboxes:** Every experimental view MUST provide interactive controllers (`AppSlider`, `AppSegmentedControl`, `AppSwitch`, `AppButton`) rather than static, read-only mockups. Parameters like velocity, damping, scale, gaps, and intervals must be tunable in real time.
2. **Real-Time Interactive Evaluation:** Sliders and toggles immediately reflect changes on active physics and layout, paired with live numeric readouts, status badges, and reset/replay triggers (`↺`).
3. **Zero Consolidated Clutter:** When an experimental feature or component is consolidated, formalized into `packages/alambre`, and adopted in `apps/base-template` (e.g. `ToastProvider`, `useStagger`, base navigation), its scratch views in playground are retired. Playground only hosts active frontiers.
4. **Empirical Multiplatform Verification:** Touch gestures, spring physics, and container transitions must be verified on live emulators/devices across Android, iOS, and Web before proposing framework extraction.
5. **Pure Math Isolation:** Motion and layout calculations (e.g. snap intervals, active index derivation, scroll targets) are isolated as pure, testable functions before being bound to Reanimated worklets.

---

## 2. Active Testbeds and Capabilities

### A. Dynamic Carousel & Containers (`CarouselTest`)
Experimental laboratory for horizontal snapping containers, 3D card physics, and native gesture synchronization:

* **Snapping Architecture:**
  * Uses native `Animated.ScrollView` with `snapToInterval = cardWidth + cardGap` and `decelerationRate="fast"`.
  * Computes `sideInset = (SCREEN_WIDTH - cardWidth) / 2` with `contentContainerStyle={{ paddingHorizontal: sideInset }}` so the active card is always centered in the viewport.
  * UI-thread scroll synchronization via Reanimated `useAnimatedScrollHandler` updating `scrollX` with zero JS bridge lag.
* **Transition Effects:**
  * **Scale Mode:** Continuous interpolation (`interpolate(scrollX, [(i-1)*interval, i*interval, (i+1)*interval], [minScale, 1.0, minScale])`).
  * **Cover Flow 3D Mode:** Card rotation around Y-axis (`rotateY: [-36deg, 0deg, 36deg]`) combined with 3D `perspective: 800` and scale transformation.
  * **Flat Mode:** Crisp snapping without scale or rotation transformations.
* **Interactive Pagination Dots:**
  * Active dot expands dynamically from `8px` to `24px` pill indicator.
  * Color morphing using `interpolateColor` between `theme.border` and `theme.primary`.
  * Touch-to-jump: Tapping any dot smoothly invokes `scrollTo({ x: targetX, animated: true })`.
* **Rich Sandbox Controls:**
  * **Card Width Slider:** `50%` to `95%` of screen width.
  * **Card Gap Slider:** `4px` to `28px` spacing.
  * **Min Scale Slider:** `70%` to `100%` scale for adjacent cards.
  * **Auto-Play Switch & Interval Slider:** Configurable auto-rotation from `1.5s` to `6.0s` with auto-reset cleanup.
  * **Manual Navigation & Reset:** Previous/Next buttons and `↺` reset trigger to quickly restore default values.

### B. UI Components Catalog (`ComponentsTest`)
Comprehensive living catalog and testbed for tactile, accessible components before promoting them to `packages/alambre` or `apps/base-template`:

#### 1. Buttons & Typography
* **`AppButton` (`src/components/AppButton.tsx`):**
  * **Variants:** `'solid'`, `'outline'` (backward compatible default), `'soft'`, and `'ghost'`.
  * **Semantic Tones:** `'primary'`, `'neutral'`, `'success'`, `'warning'`, and `'danger'`.
  * **Sizing Tokens:** `'sm'` (34px), `'md'` (44px, standard mobile touch target), `'lg'` (52px).
  * **Tactile Spring Physics:** Press-in triggers `withTiming(0.96)` scale; press-out rebounds with `withSpring(1, { damping: 14, stiffness: 320 })`.
  * **Slots & States:** `leftIcon`, `rightIcon`, square `iconOnly` mode, and `loading` indicator with contrast-matched spinner.
* **`AppTitle` & `AppText` (`src/components/AppTitle.tsx`):**
  * **`AppTitle`:** Heading levels 1 (28px hero), 2 (22px section), and 3 (17px card), supporting inline badges and subtitle lockups.
  * **`AppText`:** Semantic body variants (`'body'`, `'caption'`, `'subtitle'`, `'muted'`, `'code'`).

#### 2. Inputs & Form Controls
* **`AppTextInput` (`src/components/AppTextInput.tsx`):**
  * **Variants:** `'outline'` (bordered), `'soft'` (tonal background), `'underlined'` (sleek bottom border).
  * **Semantic Validation Tones:** `'default'`, `'success'`, `'warning'`, `'danger'` (auto-escalates on `errorMessage`).
  * **Sizing Tokens:** `'sm'` (36px), `'md'` (46px), `'lg'` (54px).
  * **Dynamic Motion:** Reanimated border color interpolation (`interpolateColor`) on focus/blur with smooth active glow.
  * **Interactive Slots:**
    * `clearable`: instant one-tap clear button (`CircleX`) that resets content and maintains focus.
    * `isPassword`: interactive reveal toggle switching between `AlambreIcons.Eye` (open) and `AlambreIcons.EyeOff` (slashed).
    * `multiline`: auto-expanding textarea support with top-aligned text.
    * Animated helper text and error message rows (`TriangleAlert`).
* **`AppSwitch` (`src/components/AppSwitch.tsx`):**
  * **Spring Physics:** Thumb glides with Reanimated `withSpring` (stiffness 300, damping 16).
  * **Thumb Squish Feedback:** Thumb stretches horizontally (`scaleX: 1.15`) on press-in and snaps back on release.
  * **Color Morphing:** Track interpolates between inactive surface color and active semantic tones.
  * **Layout:** Standalone switch or compound label + subtitle row.
  * **Sizing:** `'sm'`, `'md'`, `'lg'`.

#### 3. Cards & Badges
* **`AppCard` (`src/components/AppCard.tsx`):**
  * **Variants:** `'outlined'` (crisp 1.5px border), `'elevated'` (ambient shadow with depth), `'soft'` (tinted background).
  * **Interactive Mode:** When `onPress` is supplied, wraps with `Pressable` and reacts with tactile spring scale (`scale: 0.98` press-in, spring release).
  * **Structured Slots:** Header (title, subtitle, badge, action button, chevron), body content, and divider-separated footer.
  * **Selection State:** `selected` prop highlights borders in `theme.primary` with active surface tinting.
* **`AppBadge` & `AppChip` (`src/components/AppBadge.tsx`):**
  * **`AppBadge`:** Non-interactive status tags with semantic tones (`'primary'`, `'neutral'`, `'success'`, `'warning'`, `'danger'`) across `'soft'`, `'solid'`, and `'outline'` variants.
  * **`AppChip`:** Interactive tactile chips for filter bars (`selected` state with checkmark icon and spring scale) and dismissible tags (`onRemove` with hit-slop `'X'`).

#### 4. Real-World Mobile Showcases
* **Team Directory Search:** Live filtering list driven by `AppTextInput` (with `AlambreIcons.Search`) and quick-clear reset.
* **Authentication Form:** Email with left icon and Password with `Eye`/`EyeOff` mask toggle.
* **Checkout Promo Code:** Validated read-only input with `tone="success"` and checkmark accessory.
* **Form Error Alert:** Input with inline validation error and warning icon.
* **Plan / Tier Selector:** Full-width selectable cards with active checkmarks and spring scale feedback.
* **E-Commerce Product Card:** Header badges, product specs, pricing, and action footer.
* **Settings Action Row:** Chevron navigation row with press feedback.

#### 5. Modals & Action Sheets
* **`AppDialog` (`src/components/AppDialog.tsx`):**
  * **Anatomy:** Centered modal surface with rounded corners (24px), subtle border, and deep ambient elevation.
  * **Animations:** Backdrop fades in (`withTiming`), dialog card scales in with spring (`scale: withSpring(1, { damping: 18, stiffness: 300 })`). Exit animation plays smoothly before unmounting native modal.
  * **Semantic Tone Badges:** Circular tone icon (`'primary'`, `'danger'`, `'warning'`, `'success'`, `'neutral'`) with contrast-matched soft background.
  * **Action Row:** Dual side-by-side buttons (`confirmLabel` + `cancelLabel`) or single full-width button with `confirmLoading` spinner support.
  * **Custom Body:** Accepts `{children}` for embedding form inputs (e.g. rename workspace) or custom notifications.
* **`AppActionSheet` (`src/components/AppActionSheet.tsx`):**
  * **Anatomy:** Bottom-sheet drawer with grab handle, option items, header title/description, safe-area bottom clearance (`useSafeAreaInsets`), and optional full-width cancel button.
  * **Pan Gesture Physics:** Drag-to-dismiss with `Gesture.Pan()`. Downward drags track finger position with velocity-based dismissal threshold (>70px or >500px/s velocity). Upward dragging provides rubber-band resistance clamped at -45px.
  * **Bottom Overshoot Skirt:** 350px solid surface skirt rendered directly below the sheet container to prevent showing the background viewport during spring overshoot or upward pulling.
  * **Configurable Spring Dynamics:** Exposes `springConfig` (`damping`, `stiffness`, `mass`), defaulting to a calm, critically-damped profile (`damping: 32, stiffness: 220`) that eliminates jarring oscillation while allowing caller overrides.
  * **Dynamic Backdrop Interpolation:** Dimmed overlay fades out proportionally as the sheet is dragged downward.
  * **Inner `GestureHandlerRootView`:** Guarantees touch and gesture dispatching across Android modal windows.

### C. Text Animations Laboratory (`TextAnimationsTest`)
Interactive proving ground and showcase for kinetic typography, number counters, and wave motion:

* **`TickerText` (`src/components/text-animations/TickerText.tsx`):**
  * **Slot-Machine Rolling Numbers:** Stacked digit columns (0-9) with tabular numeral font metrics (`fontVariant: ['tabular-nums']`) that eliminate horizontal jitter.
  * **Spring Physics Presets:** Dynamic spring interpolation supporting `'bouncy'`, `'snappy'`, and `'calm'` spring configs.
  * **Staggered Spin Direction:** Staggered start delay per digit column (`staggerMs: 30`) supporting both `'right-to-left'` (place value order) and `'left-to-right'` spin waves.
  * **Mixed Content:** Automatically handles prefix (`$`, `+`, `🪙`), suffix (`pts`, `HP`, `/ 100`), commas, decimals, and negative symbols.
* **`TypewriterText` (`src/components/text-animations/TypewriterText.tsx`):**
  * **Sequential Revelation:** Reveals characters with configurable typing speed (`speed: 20ms - 80ms`) and initial pause.
  * **Blinking Animated Cursor:** Reanimated continuous pulse (`withRepeat(withSequence(withTiming(...)))`) supporting custom cursor glyphs (e.g. `▍` or `|`) and `hideCursorOnComplete`.
  * **Loop & Replay:** Supports infinite loop mode with customizable pause (`pauseOnLoopMs`) and programmatic replay.
* **`WavyText` (`src/components/text-animations/WavyText.tsx`):**
  * **Sine Wave Ripple:** Staggered sine wave bouncing animation across individual characters with configurable `amplitude` (4px to 14px), duration, and phase delay.
  * **Playful Delights:** Ideal for victory banners, "Level Up", "JACKPOT!", and turn notifications.
* **Card Game HUD Prototype:**
  * Living integration mockup simulating a turn-based card game: real-time HP depletion/restoration, gold loot counter, turn progression, and dynamic typewriter combat dialogue log.

### D. Drag & Drop Proving Ground (`DndTest`)
Physical micro-interactions and gesture collisions testbed:

* **`DndProvider` & Primitives:** Context-driven spatial coordinate tracking (`Draggable`, `Droppable`, `SortableRow`).
* **Neighbor Shift Physics:** Real-time geometric displacement of adjacent items during active card drag.
* **Drop Target Detection:** Mathematical overlap calculations against target zones with auto-rebound upon cancel.
* **Rich Sandbox Toggles:** Switchable drop animations (instant, spring snap, dissolve), neighbor shifting modes, and live hand reset.

---

## 3. Validation

Run linting, typechecking, and tests:
```bash
pnpm --filter @alambre/playground lint
pnpm --filter @alambre/playground typecheck
pnpm --filter @alambre/playground test
```
To run the playground app locally:
```bash
pnpm --filter @alambre/playground start
```
