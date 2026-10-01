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
- [ ] **Header Alignment:** When navigating into Settings, the page title ("Ajustes" / "Settings") appears in the header row, strictly aligned vertically with the back arrow button. Titles are centralized via dynamic `PageTitleFn` in `providers/lang.tsx`.
- [ ] **Theme Switcher Alignment:** The theme switcher toggle is horizontally centered (`alignSelf: 'center'`) within the Theme card.
- [ ] **Theme Switcher Colors:**
  - In **Light mode**: Background is `surfaceAlt` (`#e8eef7`), border is `theme.border` (`#c9d6ea`), active circle is `#0b525b`, Sun icon is amber (`#f59e0b`), Moon icon is `theme.muted` (`#5e6a7f`).
  - In **Dark mode**: Background is `surfaceAlt` (`#1d2d45`), border is `theme.border` (`#32455f`), active circle is `#9eebce`, Sun icon is light amber (`#ffc266`), Moon icon is `theme.muted` (`#9eb0c8`).
  - The animated disc/circle behind the icons dynamically interpolates color according to the active theme rather than staying constant.
- [ ] **Language Switching:** Tapping language chips ("Español" / "English") dynamically updates all visible strings and immediately reflects the active chip style (`surface` background, `primary` border).
- [ ] **System Permissions Subpage Navigation:** Tapping the Permissions action navigates to `navigate('settings', { subpage: 'permissions' })`, rendering the unified header with back arrow.
- [ ] **Support Action Direct Link:** Tapping "Invitame un cafecito" in the settings support card opens the external Cafecito link directly. The reusable `SupportModal` component provides the modal experience with dynamic `[app]` quotes and donation links.
- [ ] **About & Diagnostics Card:** Displays version ("1.0.0"), framework version ("alambre v0.1.0"), and author link ("@marcosdima"). Tapping "Copiar diagnóstico" triggers a confirmation toast notification.
- [ ] **Preferences Reset:** Tapping "Restablecer" triggers a blocking confirmation dialog via `useConfirm`. Confirming resets language and theme to default states and triggers a success toast.

### C. System Permissions Subpage (`views/settings/Permissions.tsx`)
- [ ] **Header Alignment:** "Permisos" appears in the navigation bar alongside the return arrow `←`.
- [ ] **Transparency Card:** Outlines privacy guarantees and minimal permissions philosophy.
- [ ] **Notifications & Battery Cards:** Each permission entry shows title, descriptive rationale, status badge, and direct shortcut button to `Linking.openSettings()`.
- [ ] **Lifecycle Awareness:** Listens to `AppState` active changes to refresh permissions state when returning from the system settings panel.

### D. Details Screen
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

### Component Catalog Overview

| Component | File | Key Props & Features | Tactile & Visual Feedback |
| --- | --- | --- | --- |
| `AppButton` | `AppButton.tsx` | `variant`, `tone`, `size`, `label`, `leftIcon`, `rightIcon`, `loading`, `iconOnly`, `fullWidth` | Rapid compression on press-in (`scale: 0.96`), spring return on release (`damping: 14`, `stiffness: 320`), accessible disabled/loading states. |
| `AppTitle` | `AppTitle.tsx` | `level` (`1`, `2`, `3`), `subtitle`, `badge`, `badgeTone`, `align` (`left`, `center`, `right`) | Crisp typographic hierarchy, optional inline tone badge, and secondary caption pairing. |
| `AppText` | `AppTitle.tsx` | `variant` (`body`, `caption`, `subtitle`, `muted`, `code`), `color` | Standardized typography tokens matching active theme colors. |
| `AppTextInput` | `AppTextInput.tsx` | `ref`, `label`, `required`, `helperText`, `tone`, `leftIcon`, `rightIcon`, `clearable`, `passwordToggle`, `isPassword` | Smooth focus border & background interpolation on UI thread, clear button, eye toggle for password visibility, accessible focus chaining via forwarded ref. |
| `AppSwitch` | `AppSwitch.tsx` | `size`, `checked`, `onChange`, `label`, `subtitle`, `disabled` | Dynamic thumb elongation on press (`scaleX: 1.15`), spring transition across track, compound row mode with single TalkBack/VoiceOver focus node (inert inner track). |
| `AppCard` | `AppCard.tsx` | `variant`, `padding`, `title`, `subtitle`, `badge`, `badgeTone`, `headerAction`, `footer`, `chevron`, `selected`, `onPress` | Interactive spring compression on press (`scale: 0.98`), conditional `overflow: 'visible'` for elevated cards to prevent iOS drop-shadow clipping. |
| `AppBadge` | `AppBadge.tsx` | `tone`, `variant`, `size`, `icon`, `label` | Uppercase pill styling with matching accent, border, and background tokens. |
| `AppChip` | `AppBadge.tsx` | `label`, `selected`, `onPress`, `onRemove`, `icon`, `tone`, `size`, `disabled`, `style`, `contentStyle` | Spring feedback on press, dismissible remove cross icon, style forwarded to outer `Pressable` for correct flexbox layout positioning. |
| `AppDialog` | `AppDialog.tsx` | `visible`, `onClose`, `title`, `description`, `tone`, `confirmLabel`, `cancelLabel`, `confirmTone`, `onConfirm`, `onCancel`, `confirmLoading`, `dismissOnBackdropPress`, `customActions` | Animated backdrop dimming, spring entrance card scale, tone badge, `accessibilityRole="alert"`, edge-to-edge modal windows, wrapped in `KeyboardAvoidingView` on iOS. |
| `AppActionSheet` | `AppActionSheet.tsx` | `visible`, `onClose`, `title`, `description`, `options`, `cancelLabel`, `dismissOnBackdropPress`, `springConfig` | Interactive pan drag-to-dismiss gesture with rubber-band upward resistance, clamped backdrop fade, scrollable options list (`maxHeight: 380`), bottom overshoot skirt eliminating viewport see-through, edge-to-edge Android modal (`navigationBarTranslucent`). |

---

### 3.1 `AppButton`

The primary interactive button component. Built on `alambre`'s headless `Button`, adding spring compression feedback, theme token integration, and loading indicator states.

#### Props Reference

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Text label displayed in the button. |
| `variant` | `'solid' \| 'outline' \| 'soft' \| 'ghost'` | `'outline'` | Visual surface style. |
| `tone` | `'primary' \| 'neutral' \| 'success' \| 'danger' \| 'warning'` | `'primary'` | Semantic color tone. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height and padding preset (`sm`: 36px, `md`: 44px, `lg`: 52px). |
| `leftIcon` | `ReactNode` | — | Icon rendered before the label. |
| `rightIcon` | `ReactNode` | — | Icon rendered after the label. |
| `iconOnly` | `boolean` | `false` | Sets equal width and height with centered content for icon-only buttons. |
| `fullWidth` | `boolean` | `false` | Stretches button width to 100% of parent container. |
| `loading` | `boolean` | `false` | Displays `ActivityIndicator` and disables user interaction. |
| `disabled` | `boolean` | `false` | Fades opacity to 0.45 and prevents press triggers. |
| `onPress` | `(event: GestureResponderEvent) => void` | — | Tap callback. |
| `style` | `StyleProp<ViewStyle>` | — | Outer container style override. |
| `labelStyle` | `StyleProp<TextStyle>` | — | Text style override. |

#### Usage Example

```tsx
import { AppButton } from '../components/AppButton';
import { AlambreIcons } from 'alambre';

// Primary solid action
<AppButton
  variant="solid"
  tone="primary"
  label="Guardar cambios"
  onPress={handleSave}
/>

// Danger action with icon and loading state
<AppButton
  variant="soft"
  tone="danger"
  label="Eliminar cuenta"
  leftIcon={<AlambreIcons.Cross width={18} height={18} stroke="#ef4444" />}
  loading={isDeleting}
  onPress={handleDelete}
/>
```

---

### 3.2 `AppTextInput`

Accessible text input wrapped in an animated border and background shell. Supports clear button, secure password reveal toggle, and imperative focus forwarding.

#### Props Reference

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `ref` | `Ref<TextInput>` | — | Forwarded React Native `TextInput` ref for programmatic `.focus()`. |
| `label` | `string` | — | Label rendered above the input shell. |
| `required` | `boolean` | `false` | Appends a red asterisk to the label. |
| `helperText` | `string` | — | Explanatory caption displayed below the input. |
| `errorMessage` | `string` | — | Error text; sets tone to `'danger'` and displays red caption below. |
| `variant` | `'outline' \| 'soft' \| 'underlined'` | `'outline'` | Border and background styling variant. |
| `tone` | `'default' \| 'success' \| 'warning' \| 'danger'` | `'default'` | Semantic border/focus color tone. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height and font size preset. |
| `leftIcon` | `ReactNode` | — | Leading icon inside the input shell. |
| `rightIcon` | `ReactNode` | — | Trailing icon inside the input shell. |
| `clearable` | `boolean` | `false` | Shows a cross button to clear text when non-empty. |
| `isPassword` | `boolean` | `false` | Renders a toggle eye button to show or mask password characters. |
| `disabled` | `boolean` | `false` | Readonly state with muted background and no focus ring. |

#### Usage Example

```tsx
import { useRef, useState } from 'react';
import type { TextInput } from 'react-native';
import AppTextInput from '../components/AppTextInput';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  return (
    <>
      <AppTextInput
        label="Correo electrónico"
        required
        value={email}
        onChangeText={setEmail}
        clearable
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <AppTextInput
        ref={passwordRef}
        label="Contraseña"
        required
        isPassword
        value={password}
        onChangeText={setPassword}
        helperText="Mínimo 8 caracteres"
      />
    </>
  );
}
```

---

### 3.3 `AppSwitch`

A spring-animated toggle switch. Supports standalone switch mode or compound row mode (label + subtitle + switch) merged into a single accessible TalkBack/VoiceOver element.

#### Props Reference

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `checked` | `boolean` | — | Controlled boolean state. |
| `onChange` | `(checked: boolean) => void` | — | Callback fired when toggled. |
| `label` | `string` | — | Primary label text. If provided, renders row layout. |
| `subtitle` | `string` | — | Secondary descriptive caption beneath label. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Switch dimensions (`sm`: 40x24, `md`: 48x28, `lg`: 56x32). |
| `activeTone` | `'primary' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | Track background color when active. |
| `disabled` | `boolean` | `false` | Dimmed track and thumb with disabled interactions. |

#### Usage Example

```tsx
import { useState } from 'react';
import AppSwitch from '../components/AppSwitch';

export function NotificationSettings() {
  const [enabled, setEnabled] = useState(true);

  return (
    <AppSwitch
      checked={enabled}
      onChange={setEnabled}
      label="Notificaciones Push"
      subtitle="Recibir avisos de nuevas partidas y actualizaciones"
      activeTone="success"
    />
  );
}
```

---

### 3.4 `AppCard`

Surface container supporting outlined, elevated, and soft variants. Supports headers, tone badges, trailing chevrons, and interactive spring compression.

#### Props Reference

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `ReactNode` | — | Card header title. |
| `subtitle` | `ReactNode` | — | Supporting text below the title. |
| `badge` | `ReactNode` | — | Pill badge text rendered alongside title. |
| `badgeTone` | `BadgeTone` | `'primary'` | Semantic tone of the title badge. |
| `variant` | `'outlined' \| 'elevated' \| 'soft'` | `'outlined'` | Card surface treatment. |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding preset (`sm`: 10px, `md`: 16px, `lg`: 22px). |
| `chevron` | `boolean` | `false` | Displays a trailing navigation arrow on the right. |
| `selected` | `boolean` | `false` | Highlights card with primary border and tinted surface. |
| `headerAction` | `ReactNode` | — | Custom component placed at top-right of header. |
| `footer` | `ReactNode` | — | Bottom action area separated by a subtle border. |
| `onPress` | `() => void` | — | Makes card pressable with scale feedback (`scale: 0.98`). |
| `disabled` | `boolean` | `false` | Disables press events and fades card opacity. |

#### Usage Example

```tsx
import AppCard from '../components/AppCard';
import AppButton from '../components/AppButton';

<AppCard
  title="Modo Competitivo"
  subtitle="Compite en tiempo real contra jugadores de todo el mundo"
  badge="NUEVO"
  badgeTone="success"
  variant="elevated"
  chevron
  onPress={() => navigate('Matchmaking')}
  footer={
    <AppButton
      variant="ghost"
      size="sm"
      label="Ver reglas y puntuación"
      onPress={() => openRules()}
    />
  }
/>
```

---

### 3.5 `AppBadge` & `AppChip`

Compact status indicators and interactive tag chips.

#### `AppBadge` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `ReactNode` | — | Badge text or content. |
| `tone` | `'primary' \| 'neutral' \| 'success' \| 'warning' \| 'danger'` | `'primary'` | Semantic accent color. |
| `variant` | `'soft' \| 'solid' \| 'outline'` | `'soft'` | Visual fill style. |
| `size` | `'sm' \| 'md'` | `'md'` | Dimensions and font size (`sm`: 11px font, `md`: 13px font). |
| `icon` | `ReactNode` | — | Icon prepended before label. |

#### `AppChip` Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | — | Chip text label. |
| `selected` | `boolean` | `false` | Highlighted active selection state. |
| `onPress` | `() => void` | — | Selection toggle callback. |
| `onRemove` | `() => void` | — | Displays trailing cross icon and triggers remove callback. |
| `tone` | `BadgeTone` | `'primary'` | Active accent tone. |
| `icon` | `ReactNode` | — | Optional leading icon. |
| `disabled` | `boolean` | `false` | Disables chip interactions. |

#### Usage Example

```tsx
import AppBadge, { AppChip } from '../components/AppBadge';

// Static status badge
<AppBadge tone="success" variant="soft" label="Activo" />

// Interactive filter chip
<AppChip
  label="Fácil"
  selected={difficulty === 'easy'}
  onPress={() => setDifficulty('easy')}
/>

// Dismissible filter tag
<AppChip
  label="Etiqueta"
  selected
  onRemove={() => removeTag('Etiqueta')}
/>
```

---

### 3.6 `AppDialog`

Modal alert and confirmation window with backdrop dimming, spring scale entrance, and accessible keyboard dismissal.

#### Props Reference

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` | `boolean` | — | Modal display visibility. |
| `onClose` | `() => void` | — | Callback fired when dialog is dismissed. |
| `title` | `string` | — | Dialog header title. |
| `description` | `string` | — | Body description text. |
| `tone` | `'primary' \| 'danger' \| 'warning' \| 'success' \| 'neutral'` | `'primary'` | Tone of the icon container. |
| `confirmLabel` | `string` | — | Primary action button label (e.g. "Aceptar"). |
| `cancelLabel` | `string` | — | Secondary action button label (e.g. "Cancelar"). |
| `confirmTone` | `ButtonTone` | Matches dialog tone | Tone applied to primary confirm button. |
| `onConfirm` | `() => void` | — | Confirm button press callback. |
| `onCancel` | `() => void` | — | Cancel button press callback. |
| `confirmLoading` | `boolean` | `false` | Shows loading spinner inside confirm button. |
| `dismissOnBackdropPress` | `boolean` | `true` | Allows closing by tapping outside the dialog window. |
| `children` | `ReactNode` | — | Custom form or interactive elements injected into body. |

#### Usage Example

```tsx
import { useState } from 'react';
import AppDialog from '../components/AppDialog';

export function ConfirmDeleteDialog({ isOpen, onClose, onConfirm }: any) {
  return (
    <AppDialog
      visible={isOpen}
      onClose={onClose}
      title="Eliminar partida"
      description="Esta acción borrará todo el progreso actual de forma irreversible."
      tone="danger"
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      confirmTone="danger"
      onConfirm={onConfirm}
      onCancel={onClose}
    />
  );
}
```

---

### 3.7 `AppActionSheet`

Bottom slide-up action sheet powered by React Native Gesture Handler. Features pan drag-to-dismiss with rubber-band upward resistance, backdrop fading, and safe-area insets.

#### Props Reference

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `visible` | `boolean` | — | Sheet display visibility. |
| `onClose` | `() => void` | — | Callback fired when sheet is dismissed. |
| `title` | `string` | — | Header title. |
| `description` | `string` | — | Subtitle caption below title. |
| `options` | `ActionSheetOption[]` | `[]` | List of selectable action rows `{ id, label, subtitle?, icon?, tone?, disabled?, onPress }`. |
| `cancelLabel` | `string` | `'Cancelar'` | Bottom cancel button label. |
| `dismissOnBackdropPress` | `boolean` | `true` | Closes sheet when tapping backdrop. |
| `children` | `ReactNode` | — | Custom sheet body (overrides default options list). |

#### Usage Example

```tsx
import { useState } from 'react';
import AppActionSheet from '../components/AppActionSheet';
import { AlambreIcons } from 'alambre';

export function ShareSheet({ isOpen, onClose }: any) {
  return (
    <AppActionSheet
      visible={isOpen}
      onClose={onClose}
      title="Opciones de partida"
      description="Selecciona una acción para continuar"
      options={[
        {
          id: 'share',
          label: 'Compartir tablero',
          icon: <AlambreIcons.Arrow width={18} height={18} stroke="#3b82f6" />,
          onPress: () => {
            onClose();
            handleShare();
          },
        },
        {
          id: 'reset',
          label: 'Reiniciar partida',
          tone: 'danger',
          icon: <AlambreIcons.Cross width={18} height={18} stroke="#ef4444" />,
          onPress: () => {
            onClose();
            handleReset();
          },
        },
      ]}
    />
  );
}
```


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
