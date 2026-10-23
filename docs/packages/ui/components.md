---
title: UI Components Reference
summary: Tactile mobile UI component catalog and contracts for @some-alambre/ui.
---

# UI Components Reference (`@some-alambre/ui`)

`@some-alambre/ui` exports complete, tactile, accessible mobile UI components designed to compose directly over `alambre` headless primitives.

---

## 1. Typography

### `AppTitle`
```tsx
import { AppTitle } from '@some-alambre/ui';

<AppTitle
  title="Dashboard"
  subtitle="Overview of your activity"
  badge="PRO"
  level={1} // 1 | 2 | 3 | 4
  align="left" // 'left' | 'center' | 'right'
/>
```

### `AppText`
```tsx
import { AppText } from '@some-alambre/ui';

<AppText variant="body" muted={false}>
  Standard body copy that automatically inherits theme.color and theme.fontFamily.
</AppText>
```
* **Variants:** `'body' | 'caption' | 'label' | 'code'`

---

## 2. Buttons

### `AppButton` (alias `Button`)
```tsx
import { AppButton } from '@some-alambre/ui';

<AppButton
  label="Save Changes"
  variant="solid" // 'solid' | 'soft' | 'outline' | 'ghost'
  tone="primary"  // 'primary' | 'neutral' | 'danger' | 'success'
  size="md"       // 'sm' | 'md' | 'lg'
  leftIcon={<SaveIcon />}
  rightIcon={<ArrowIcon />}
  loading={false}
  disabled={false}
  fullWidth
  onPress={handleSave}
/>
```

---

## 3. Containers

### `AppCard` (alias `Card`)
```tsx
import { AppCard, AppButton } from '@some-alambre/ui';

<AppCard
  variant="outlined" // 'elevated' | 'outlined' | 'filled' | 'ghost'
  title="Account Settings"
  subtitle="Manage your profile"
  badge="Active"
  badgeTone="success" // 'primary' | 'neutral' | 'success' | 'warning' | 'danger'
  footer={<AppButton label="Update" size="sm" onPress={onUpdate} />}
>
  <AppText>Card body content</AppText>
</AppCard>
```

### `AppAccordion` (alias `Accordion`)
```tsx
import { AppAccordion, AppText } from '@some-alambre/ui';

<AppAccordion
  title="Advanced Options"
  subtitle="Tap to expand"
  defaultExpanded={false}
>
  <AppText>Expandable content driven by useCollapsible.</AppText>
</AppAccordion>
```

---

## 4. Badges & Chips

### `AppBadge` (alias `Badge`) & `AppChip` (alias `Chip`)
```tsx
import { AppBadge, AppChip } from '@some-alambre/ui';

<AppBadge
  label="New"
  variant="soft" // 'solid' | 'soft' | 'outline'
  tone="primary" // 'primary' | 'neutral' | 'success' | 'warning' | 'danger'
  size="md"      // 'sm' | 'md' | 'lg'
  dot
/>

<AppChip
  label="Favorites"
  selected={isSelected}
  onPress={() => setSelected(!isSelected)}
  onRemove={handleRemove}
/>
```

---

## 5. Form Controls

### `AppTextInput` (alias `TextInput`)
```tsx
import { AppTextInput } from '@some-alambre/ui';

<AppTextInput
  label="Username"
  placeholder="Enter username"
  value={name}
  onChangeText={setName}
  helperText="Visible to other players"
  errorText={error}
  clearable
/>
```

### `AppSwitch` (alias `Switch`)
```tsx
import { AppSwitch } from '@some-alambre/ui';

<AppSwitch
  label="Push Notifications"
  subtitle="Receive game turn alerts"
  value={enabled}
  onValueChange={setEnabled}
  tone="primary" // 'primary' | 'success' | 'danger'
  size="md"      // 'sm' | 'md' | 'lg'
/>
```

### `AppSlider` (alias `Slider`)
```tsx
import { AppSlider } from '@some-alambre/ui';

<AppSlider
  label="Volume"
  value={volume}
  onChange={setVolume}
  min={0}
  max={100}
  step={5}
  showValue
  formatValue={(v) => `${v}%`}
/>
```

### `AppStepper` (alias `Stepper`)
```tsx
import { AppStepper } from '@some-alambre/ui';

<AppStepper
  label="Players"
  value={players}
  onChange={setPlayers}
  min={1}
  max={8}
  step={1}
/>
```

### `AppSegmentedControl` (alias `SegmentedControl`)
```tsx
import { AppSegmentedControl } from '@some-alambre/ui';

<AppSegmentedControl
  label="Difficulty"
  options={[
    { label: 'Easy', value: 'easy' },
    { label: 'Hard', value: 'hard' },
  ]}
  value={difficulty}
  onChange={setDifficulty}
/>
```

### `AppSelect` (alias `Select`)
```tsx
import { AppSelect } from '@some-alambre/ui';

<AppSelect
  label="Category"
  placeholder="Choose a category"
  options={[
    { label: 'Sports', value: 'sports', description: 'Outdoor & indoor games' },
    { label: 'Music', value: 'music' },
  ]}
  value={category}
  onChange={setCategory}
/>
```

### `AppNumberPicker` (alias `NumberPicker`)
```tsx
import { AppNumberPicker } from '@some-alambre/ui';

<AppNumberPicker
  label="Target Score"
  value={score}
  onChange={setScore}
  min={10}
  max={100}
  step={10}
/>
```

---

## 6. Dialogs & Overlays

### `AppDialog` (alias `Dialog`) & `ConfirmDialog`
```tsx
import { AppDialog } from '@some-alambre/ui';

<AppDialog
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  title="Reset Progress?"
  description="All current round data will be cleared."
  tone="danger" // 'primary' | 'danger' | 'warning' | 'success'
  confirmLabel="Reset"
  cancelLabel="Cancel"
  onConfirm={handleReset}
  onCancel={() => setIsOpen(false)}
/>
```

### `AppActionSheet` (alias `ActionSheet`)
```tsx
import { AppActionSheet } from '@some-alambre/ui';

<AppActionSheet
  visible={isSheetOpen}
  onClose={() => setIsSheetOpen(false)}
  title="Game Options"
  description="Manage the current room session"
  options={[
    { label: 'Copy Room Code', onPress: copyCode },
    { label: 'Leave Room', subtitle: 'Disconnect from session', destructive: true, onPress: leaveRoom },
  ]}
/>
```

---

## 7. Motion & Cascades

### `AnimatedCascade`
```tsx
import { AnimatedCascade } from '@some-alambre/ui';

<AnimatedCascade pattern="stagger" staggerMs={40}>
  <AppCard title="Item 1" />
  <AppCard title="Item 2" />
  <AppCard title="Item 3" />
</AnimatedCascade>
```
* **Patterns:** `'stagger' | 'wavefront'`
