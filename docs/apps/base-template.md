---
title: Base Template UI Baseline and Verification
summary: Visual and interaction baseline, layout contracts, and manual validation checklist for apps/base-template.
---

# Base Template: UI Baseline and Validation

This document establishes the interaction and visual baseline for `apps/base-template` (the generic application skeleton exported as `marcosdima/base-expo`).

---

## 1. Context & Architecture

`apps/base-template` serves as an opinionated, solid starting point for new applications built on top of `alambre`.

It must mirror the proven visual and interaction quality established in the other apps (`apps/colguetti` and `apps/cross-logic`) without adopting application-specific domain code.

Key architectural boundaries:
- **Unified Header Chrome:** When navigating to subpages or secondary routes (`Settings`, `Details`), `AppNavigatorBody` provides a unified navigation header row where the page title aligns horizontally and vertically with the back arrow.
- **Theme Switcher:** Follows the reference implementation in `ToggleLightDark.tsx` (`docs/project.md` §14), using animated shadow discs and dedicated light/dark icon color palettes matching application tokens (`light.border: #c9d6ea`, `dark.border: #32455f`, `light.circle: #0b525b`, `dark.circle: #9eebce`).
- **Transient Feedback:** `TemplateToast` features bounded entering (`FadeInDown`) and accelerating exit (`FadeOutUp`) animations, bounded by safe-area insets (`baseTop = Math.max(insets.top, 16)`), positioned cleanly below the header bar when navigation history exists, and smoothly gliding between header/non-header offsets when navigating while a toast is active.

---

## 2. Manual Validation Checklist

Follow this checklist during manual testing or emulator inspection (e.g. via `adb` per `docs/agents.md` §3):

### A. Main Menu (Home)
- [ ] **Header Entrance:** The top welcome card enters smoothly with `FadeInDown` without popping or flickering.
- [ ] **Navigation Buttons:** Navigation actions (Details, Show Toast, Settings) cascade into view with staggered entrance timing (`useStagger`).
- [ ] **Layout Stability:** Entering animations do not cause layout jumps, overflow clipping, or broken gaps in the container (`padding: 20, gap: 16`).
- [ ] **Press Feedback:** Tapping each button triggers the standard scale press feedback without delayed latency.

### B. Settings Screen
- [ ] **Header Alignment:** When navigating into Settings, the page title ("Ajustes" / "Settings") appears in the header row, strictly aligned vertically with the back arrow button.
- [ ] **Directional Alternation Motion:** The first semantic section (Language card) enters from the left (`FadeInLeft`), and the second section (Theme card) enters from the right (`FadeInRight`), keeping motion subtle (260ms) and independent from the header.
- [ ] **Theme Switcher Alignment:** The theme switcher toggle is horizontally centered (`alignSelf: 'center'`) within the Theme card.
- [ ] **Theme Switcher Colors:**
  - In **Light mode**: Background is `surfaceAlt` (`#e8eef7`), border is `theme.border` (`#c9d6ea`), active circle is `#0b525b`, Sun icon is amber (`#f59e0b`), Moon icon is `theme.muted` (`#5e6a7f`).
  - In **Dark mode**: Background is `surfaceAlt` (`#1d2d45`), border is `theme.border` (`#32455f`), active circle is `#9eebce`, Sun icon is light amber (`#ffc266`), Moon icon is `theme.muted` (`#9eb0c8`).
  - The animated disc/circle behind the icons dynamically interpolates color according to the active theme rather than staying constant.
- [ ] **Language Switching:** Tapping language chips ("ES" / "EN") dynamically updates all visible strings and immediately reflects the active chip style (`primarySoft` background, `primary` border).

### C. Details Screen
- [ ] **Header Alignment:** Subpage title ("Subpágina" / "Subpage") is cleanly displayed in the navigation header beside the back arrow.
- [ ] **Back Navigation:** Tapping the back arrow or triggering hardware back navigates back to Home with a smooth reverse transition (`FadeInLeft`), resetting scroll position.

### D. Toast Feedback & Safe Area
- [ ] **Entrance Animation:** Tapping "Mostrar toast" / "Show toast" summons the toast with an intentional `FadeInDown` (or `FadeInUp` when bottom) entrance.
- [ ] **Exit Animation:** Tapping the dismiss button (✕) or allowing auto-dismiss causes the toast to exit upwards with an accelerating `FadeOutUp` (or downwards with `FadeOutDown` when bottom) animation.
- [ ] **Swipe-to-Dismiss Gestures:**
  - Swiping horizontally to either left or right smoothly flings the card off-screen and dismisses it without teleporting back to center.
  - Swiping vertically in the dismissal direction (upwards for top toasts, downwards for bottom toasts) ejects the toast cleanly.
  - Partial drags return to center via spring physics when below threshold.
- [ ] **Semantic Tones & Iconography:** Correct icon container, badge background, and accent stripe render for `info`, `success` (`CircleCheck`), `warning` (`TriangleAlert`), and `danger` (`CircleX`).
- [ ] **Countdown Progress Bar:** Auto-dismissing toasts display an animated linear countdown track at the bottom of the card.
- [ ] **Queue Badge:** Sequential toasts render a `+{queueLength}` badge indicating pending queue count.
- [ ] **Status Bar Clearance:** On Home, top toasts never sit underneath the physical system status-bar area (battery, signal, notch), respecting `Math.max(insets.top, 16) + 10`.
- [ ] **Header Clearance:** On subpages (Settings, Details), top toasts sit at `baseTop + 66`, cleanly below the 56px navigation header without overlapping.
- [ ] **Navigation Transition Gliding:**
  - Trigger a Toast on Home and tap Settings while visible: the Toast smoothly glides down from its Home position to the subpage position over 250ms without jumping or popping.
  - Trigger a Toast on Settings and tap back while visible: the Toast smoothly glides up from the subpage position to the Home position over 250ms without jumping.
- [ ] **Touch Target:** Dismiss and action buttons respect accessibility guidelines with appropriate `hitSlop`.

### E. Theme Consistency (Light & Dark)
- [ ] Test the entire checklist in **Light Theme**.
- [ ] Switch to **Dark Theme** and repeat to verify contrast, card borders (`theme.border`), and background colors (`theme.background`).

---

## 3. Promoted Tactile UI Component Library

`apps/base-template` ships with a complete, hardened catalog of interactive tactile UI components located under `apps/base-template/src/components/`. These components were designed, experimentally tuned, and accessibility-hardened in `apps/playground` before promotion into the base template.

### Component Catalog

| Component | File | Key Props & Features | Tactile & Visual Feedback |
| --- | --- | --- | --- |
| `AppButton` | `AppButton.tsx` | `variant` (`solid`, `outline`, `soft`, `ghost`), `tone` (`primary`, `neutral`, `success`, `danger`, `warning`), `size` (`sm`, `md`, `lg`), `leftIcon`, `rightIcon`, `loading`, `iconOnly`, `fullWidth` | Rapid compression on press-in (`scale: 0.96`), spring return on release (`damping: 14`, `stiffness: 320`), accessible disabled/loading states. |
| `AppTitle` | `AppTitle.tsx` | `level` (`1`, `2`, `3`), `subtitle`, `badge`, `badgeTone`, `align` (`left`, `center`, `right`) | Crisp typographic hierarchy, optional inline tone badge, and secondary caption pairing. |
| `AppText` | `AppTitle.tsx` | `variant` (`body`, `caption`, `subtitle`, `muted`, `code`), `color` | Standardized typography tokens matching active theme colors. |
| `AppTextInput` | `AppTextInput.tsx` | `ref` (`forwardRef<TextInput>`), `label`, `required`, `helperText`, `tone` (`default`, `error`, `success`), `leftIcon`, `rightIcon`, `clearable`, `passwordToggle`, `isPassword` | Smooth focus border & background interpolation on UI thread, clear button, eye toggle for password visibility, accessible focus chaining via forwarded ref. |
| `AppSwitch` | `AppSwitch.tsx` | `size` (`sm`, `md`, `lg`), `checked`, `onChange`, `label`, `subtitle`, `disabled` | Dynamic thumb elongation on press (`scaleX: 1.15`), spring transition across track, compound row mode with single TalkBack/VoiceOver focus node (inert inner track). |
| `AppCard` | `AppCard.tsx` | `variant` (`outlined`, `elevated`, `soft`), `padding` (`none`, `sm`, `md`, `lg`), `title`, `subtitle`, `badge`, `badgeTone`, `headerAction`, `footer`, `chevron`, `selected`, `onPress` | Interactive spring compression on press (`scale: 0.98`), conditional `overflow: 'visible'` for elevated cards to prevent iOS drop-shadow clipping. |
| `AppBadge` | `AppBadge.tsx` | `tone` (`primary`, `neutral`, `success`, `warning`, `danger`), `variant` (`soft`, `solid`, `outline`), `size` (`sm`, `md`), `icon`, `label` | Uppercase pill styling with matching accent, border, and background tokens. |
| `AppChip` | `AppBadge.tsx` | `label`, `selected`, `onPress`, `onRemove`, `icon`, `tone`, `size`, `disabled`, `style`, `contentStyle` | Spring feedback on press, dismissible remove cross icon, style forwarded to outer `Pressable` for correct flexbox layout positioning. |
| `AppDialog` | `AppDialog.tsx` | `visible`, `onClose`, `title`, `description`, `tone`, `confirmLabel`, `cancelLabel`, `confirmTone`, `onConfirm`, `onCancel`, `confirmLoading`, `dismissOnBackdropPress`, `customActions` | Animated backdrop dimming, spring entrance card scale, tone badge, `accessibilityRole="alert"`, edge-to-edge modal windows, wrapped in `KeyboardAvoidingView` on iOS. |
| `AppActionSheet` | `AppActionSheet.tsx` | `visible`, `onClose`, `title`, `description`, `options`, `cancelLabel`, `dismissOnBackdropPress`, `springConfig` | Interactive pan drag-to-dismiss gesture with rubber-band upward resistance, clamped backdrop fade, scrollable options list (`maxHeight: 380`), bottom overshoot skirt eliminating viewport see-through, edge-to-edge Android modal (`navigationBarTranslucent`). |

---

## 4. Confirm Behavior & Dialog Integration

The application root (`apps/base-template/App.tsx`) wires `alambre`'s `ConfirmProvider` with `ConfirmDialog.tsx`:

```tsx
<NavigatorProvider pages={navigator}>
  <ConfirmProvider ConfirmComponent={ConfirmDialog}>
    <ToastProvider ToastComponent={TemplateToast}>
      <Root />
    </ToastProvider>
  </ConfirmProvider>
</NavigatorProvider>
```

### Usage Pattern
Any screen or component within `apps/base-template` can trigger confirmation flows asynchronously without needing local modal state:

```tsx
import { useConfirm } from 'alambre';

export function DeleteButton({ onDeleted }: { onDeleted: () => void }) {
  const { confirm } = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to permanently delete this item?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
    });

    if (ok) {
      onDeleted();
    }
  };

  return <AppButton tone="danger" label="Delete" onPress={handleDelete} />;
}
```

---

## 5. Extracted Experiments & Playground

The interactive animation playground, timing experiments, and advanced toast queue tests were extracted into a dedicated application: `apps/playground` (`@alambre/playground`).

See [docs/apps/playground.md](playground.md) for the experimental test suite, parameter sliders, curve selectors, and gliding verification tools. `apps/base-template` remains lean and clean as the starter template for new apps.
