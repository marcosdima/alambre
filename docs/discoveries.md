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

## Outer Pressable layout propagation in composite touchables (discovered in playground)

**Pattern:** When building interactive composite components (such as pressable cards `AppCard` or button shells `AppButton` wrapping an inner `Animated.View`), applying caller styles (`flex: 1`, `margin`, `width`) only to the inner animated view while leaving the outer `<Pressable>` unstyled causes flex containers to treat the touchable as unconstrained in cross/main axes, leading to horizontal blowouts and layout overflows on narrow mobile screens.

**Where it appeared:** `apps/playground/src/components/AppCard.tsx` and `apps/playground/src/views/components-test/ComponentsTest.tsx`.

**Solution / Architectural Pattern:**
1. Forward layout and sizing styles (`style`) directly to the outer `<Pressable>` element so parent flexbox layouts can calculate bounds accurately.
2. Maintain `width: '100%'` on the inner `Animated.View` so it fully expands into the measured touchable container.
3. Apply `flexShrink: 1` on title and text elements inside flex rows to guarantee clean truncation and prevent child elements from forcing container expansion.

**Status: ADOPTED in base-template.** Shipped in `apps/base-template/src/components/AppCard.tsx` and `AppBadge.tsx`.

## Tactile micro-physics for mobile components (discovered in playground)

**Pattern:** Standard flat press feedback (`opacity: 0.7`) often feels ungrounded or web-like. Mobile users expect tactile physical feedback that responds immediately to finger contact.

**Where it appeared:** `apps/playground/src/components/AppButton.tsx`, `apps/playground/src/components/AppSwitch.tsx`, `apps/playground/src/components/AppCard.tsx`, and `apps/playground/src/components/AppBadge.tsx`.

**Solution / Architectural Pattern:**
1. **Compress on press-in:** Use a rapid timing animation (`withTiming(0.95 - 0.98, { duration: 80 - 90 })`) upon `onPressIn` to mimic physical surface compression or thumb squish (`scaleX: 1.15` on switches).
2. **Elastic snap on release:** Use a tuned spring animation (`withSpring(1, { damping: 14 - 16, stiffness: 300 - 320 })`) upon `onPressOut` to produce a springy return without sluggish oscillation.
3. **UI-thread color interpolation:** Animate focus and active states using `interpolateColor` on shared values (`focusProgress`, `switchProgress`) to achieve 60fps color morphing without React re-renders.

**Status: ADOPTED in base-template.** Shipped in `apps/base-template/src/components/`.

## Gesture-driven bottom sheets and animated modal mounting (discovered in playground)

**Pattern:** Building custom animated modals (`AppDialog`) and bottom action sheets (`AppActionSheet`) in React Native often runs into two traps:
1. Native `<Modal visible={visible}>` instantly unmounts children as soon as `visible` becomes false, cutting off exit animations.
2. Pan gestures inside native modals on Android fail to respond because `<Modal>` creates a separate native window hierarchy that bypasses the root `GestureHandlerRootView`.

**Where it appeared:** `apps/playground/src/components/AppDialog.tsx` and `apps/playground/src/components/AppActionSheet.tsx`.

**Solution / Architectural Pattern:**
1. **Deferred unmounting via Reanimated callback:** Maintain an internal `mounted` state initialized to `visible`. When `visible` changes to false, run closing animations (`withTiming(0)` on backdrop, `withTiming(400)` on sheet `translateY`), and inside the animation completion callback invoke `runOnJS(setMounted)(false)`. Render `<Modal visible={mounted}>` so the native modal remains alive until exit animations complete.
2. **GestureHandlerRootView inside Modal:** Wrap the modal root layout with `<GestureHandlerRootView style={{ flex: 1 }}>` so PanGesture detectors receive touch events reliably across iOS and Android.
3. **Drag-to-dismiss resistance & backdrop interpolation:** During downward drag (`translationY > 0`), update sheet position directly, while applying strong rubber-band resistance clamped at -45px on upward over-dragging. Interpolate backdrop opacity dynamically against `translateY` so dragging down smoothly reveals the background.
4. **Bottom overshoot skirt:** Position an absolute view (`bottom: -350, height: 370`) matching the sheet's surface background that overlaps inside the container. When the sheet overshoots slightly upwards or the user pulls it up, this skirt moves synchronously, completely preventing background viewport see-through.
5. **Critically-damped spring default:** Use a higher damping ratio (`damping: 32, stiffness: 220, mass: 0.9`) to achieve a calm, swift entry without oscillating bounce, while exposing a `springConfig` prop for configurable dynamics.
6. **Edge-to-edge modal windows on Android (`navigationBarTranslucent`):** On Android, setting only `statusBarTranslucent` on `<Modal>` leaves the native system navigation bar opaque black at the bottom of the screen. Supplying `navigationBarTranslucent={true}` alongside `statusBarTranslucent={true}` extends the modal window edge-to-edge to the physical display bezel, eliminating black navigation bar gaps beneath bottom sheets.

**Status: ADOPTED in base-template.** Shipped in `apps/base-template/src/components/AppActionSheet.tsx` and `AppDialog.tsx`.

## Single accessibility node for compound controls (discovered in playground hardening)

**Pattern:** When a switch or checkbox is embedded in a row with a label and subtitle (`AppSwitch`), rendering both the outer row and the inner toggle as nested interactive `<Pressable accessibilityRole="switch">` elements creates duplicate TalkBack and VoiceOver navigation targets. Screen readers announce the switch twice, confusing users who navigate sequentially with screen reader swipe gestures.

**Where it appeared:** `apps/playground/src/components/AppSwitch.tsx`.

**Solution / Architectural Pattern:**
1. In compound row mode (`label || subtitle`), mark the outer row container as the sole accessible switch node (`accessibilityRole="switch"`, `accessibilityLabel={label}`, `accessibilityState={{ checked, disabled }}`).
2. Render the inner switch toggle track as an inert, non-interactive visual representation wrapped in `<View pointerEvents="none">`.
3. In standalone mode (no label/subtitle), render the switch track directly as the accessible `<Pressable accessibilityRole="switch">`.

**Status: ADOPTED in base-template.** Shipped in `apps/base-template/src/components/AppSwitch.tsx`.

## Imperative focus chaining for styled text inputs (discovered in playground hardening)

**Pattern:** In mobile login, registration, and survey forms, users expect tapping "Next" on the soft keyboard (`onSubmitEditing`) to smoothly advance focus to the next field (`passwordRef.current?.focus()`). Wrapping `TextInput` in an animated shell container without forwarding the native ref prevents callers from accessing the native focus methods.

**Where it appeared:** `apps/playground/src/components/AppTextInput.tsx`.

**Solution / Architectural Pattern:**
Wrap the component in `React.forwardRef<TextInput, AppTextInputProps>` and attach `useImperativeHandle(ref, () => innerRef.current as TextInput)`. The outer container forwards all standard `TextInput` imperative methods (`focus()`, `blur()`, `isFocused()`, `clear()`) to callers seamlessly while maintaining internal focus listeners for animated label and border effects.

**Status: ADOPTED in base-template.** Shipped in `apps/base-template/src/components/AppTextInput.tsx`.

## iOS drop-shadow preservation via conditional overflow (discovered in playground hardening)

**Pattern:** On iOS, setting `overflow: 'hidden'` on any `UIView` that also defines shadow properties (`shadowColor`, `shadowOffset`, `shadowRadius`, `shadowOpacity`) causes iOS UIKit to clip all drop shadows outside the view bounds to transparent, completely nullifying the elevated appearance.

**Where it appeared:** `apps/playground/src/components/AppCard.tsx`.

**Solution / Architectural Pattern:**
Conditionally set `overflow: variant === 'elevated' ? 'visible' : 'hidden'` on the card container. Outlined and soft cards retain clipping to enforce border-radius boundary containment, while elevated cards allow their native drop shadows to project freely beyond the card boundaries without clipping.

**Status: ADOPTED in base-template.** Shipped in `apps/base-template/src/components/AppCard.tsx`.

## Tabular numeral alignment and staggered digit column rolls for animated counters (discovered in playground text-animations)

**Pattern:** Building animated numerical counters (slot machine tickers, health meters, score displays, currency counters) with standard proportional font metrics causes horizontal jitter and layout vibration during digit transitions because digits like `1` are substantially narrower than digits like `8`. Furthermore, spinning all columns in unison feels artificial.

**Where it appeared:** `apps/playground/src/components/text-animations/TickerText.tsx`.

**Solution / Architectural Pattern:**
1. **Tabular Numerals:** Apply `fontVariant: ['tabular-nums']` to digit text styles. This forces all numeral glyphs to render with fixed, equal column widths regardless of font weight or numeral value, completely eliminating horizontal vibration during animations.
2. **Stacked Column Strip:** Render numbers 0 through 9 in a vertical column clipped by a fixed line height (`height: itemHeight, overflow: 'hidden'`).
3. **Staggered Spin Wave:** Introduce a calculated delay per digit column (`withDelay(index * staggerMs, withSpring(...))`), allowing callers to select between right-to-left (place value order, starting from units) and left-to-right cascades. Non-digit symbols (currency signs, commas, decimal points) remain static inline without jumping.

**Status: ADOPTED in playground.** Ready for evaluation in game development and financial metrics.