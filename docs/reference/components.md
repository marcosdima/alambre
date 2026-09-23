---
title: Components & Icons Reference
summary: Base UI primitives and icon contracts: Button, TimePicker, and the AlambreIcons family.
---

# Components & Icons Reference

Framework UI components focus on accessibility and behavior contracts rather than opinionated visual styles. The application composes brand identity, visual variants, and layout on top.

---

## 1. `Button`

The core behavior-first interaction primitive. Handles pressed, loading, and disabled interaction blocking along with full accessibility state.

### Responsibilities
* Accessible button role (`role="button"`, `accessibilityState.busy`, `accessibilityState.disabled`).
* Prevents `onPress` firing when `loading` or `disabled`.
* Exposes state to consumer via `children` render prop and `style` callback.

### Non-Responsibilities
* No visual styles, margins, padding, colors, or visual variants (`primary`, `danger`, etc.).

### Signature & Usage
```typescript
import { Button, type ButtonProps } from 'alambre';

// Recommended pattern: create an AppButton wrapper in your app
export function AppButton({ children, style, ...props }: ButtonProps) {
  const { theme } = useLightDark();

  return (
    <Button {...props} style={style}>
      {({ pressed, disabled, loading }) => (
        <View
          style={[
            styles.shell,
            { backgroundColor: pressed ? theme.primarySoft : theme.primary },
            disabled && styles.disabled,
          ]}
        >
          {typeof children === 'function' ? children({ pressed, disabled, loading }) : children}
        </View>
      )}
    </Button>
  );
}
```

---

## 2. `Slider` & `useSlider`

Continuous and stepped numeric slider primitive. Manages ratio calculations, boundary clamping, and native responder gestures while leaving track and thumb visual styling to the application.

### Signature & Usage
```typescript
import { Slider, type SliderProps } from 'alambre';

<Slider
  value={volume}
  min={0}
  max={100}
  step={5}
  onChange={setVolume}
>
  {({ ratio, percentage, value }) => (
    <View style={styles.track}>
      <View style={[styles.filledTrack, { width: `${percentage}%` }]} />
      <View style={[styles.thumb, { left: `${percentage}%` }]} />
    </View>
  )}
</Slider>
```

### Accessibility
* `role="adjustable"`.
* Emits `accessibilityValue={{ min, max, now }}` and handles `increment`/`decrement` accessibility actions.

---

## 3. `SegmentedControl` & `useSelect`

Option selection primitive for discrete single-choice items (segmented tabs, pills, inline filters).

### Signature & Usage
```typescript
import { SegmentedControl, type SegmentedControlProps } from 'alambre';

<SegmentedControl
  value={filter}
  options={[
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'done', label: 'Completed' },
  ]}
  onChange={setFilter}
>
  {({ options, isSelected, select }) => (
    <View style={styles.segmentContainer}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => select(opt.value)}
          style={[styles.tab, isSelected(opt.value) && styles.activeTab]}
        >
          <Text>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  )}
</SegmentedControl>
```

### Accessibility
* Container sets `role="radiogroup"`.
* Each child item receives `role="radio"` and `accessibilityState={{ selected }}`.

---

## 4. `Stepper` & `useStepper`

Step-based numeric increment and decrement input with boundary clamping.

### Signature & Usage
```typescript
import { Stepper, type StepperProps } from 'alambre';

<Stepper
  value={quantity}
  min={1}
  max={10}
  step={1}
  onChange={setQuantity}
>
  {({ value, increment, decrement, canIncrement, canDecrement }) => (
    <View style={styles.row}>
      <Pressable onPress={decrement} disabled={!canDecrement}>
        <Text>-</Text>
      </Pressable>
      <Text>{value}</Text>
      <Pressable onPress={increment} disabled={!canIncrement}>
        <Text>+</Text>
      </Pressable>
    </View>
  )}
</Stepper>
```

---

## 5. `Input`

Behavior-first text input wrapping React Native's `TextInput`, tracking `focused`, `disabled`, and `error` states.

### Signature & Usage
```typescript
import { Input, type InputProps } from 'alambre';

<Input
  value={email}
  onChangeText={setEmail}
  error={!isValidEmail}
  placeholder="Enter email"
  style={({ focused, error }) => [
    styles.input,
    focused && styles.focused,
    error && styles.error,
  ]}
/>
```

---

## 6. `TimePicker`

A 24-hour hour and minute time selector built as a fixed tap viewport with increment/decrement buttons. It requires no native dependencies and avoids nested scroll issues.

### Signature
```typescript
import { TimePicker, type TimePickerProps } from 'alambre';

<TimePicker
  value="14:30"
  onChange={(newTime: string) => console.log(newTime)}
  accentColor="#0057d8"
  visibleCount={3} // default: 3 rows visible
/>
```

---

## 3. `AlambreIcons`

Vector icons and geometric drawing primitives built on `react-native-svg` and `react-native-reanimated`.

### Common Props (`IconProps`)
* `color: ColorValue` (required: icons never hard-code application theme colors).
* `lineWidth?: number` (default: 4).
* `drawIt?: boolean`: Triggers stroke drawing animation.
* `rotation?: number`: Degrees of rotation around the center.
* `fill?: ColorValue`: Fill color (where the shape supports fills, defaults to `'none'`).
* `iconAnimation?: IconAnimationConfig`: Custom animation curves (`drawAnimation`, `resetAnimation`).

### Concrete Icons
Imported via `AlambreIcons.*`:
* **Utility Shapes**: `AlambreIcons.Cross`, `AlambreIcons.Tick`, `AlambreIcons.Arrow`.
* **Theme Shapes**: `AlambreIcons.Sun`, `AlambreIcons.Moon`.
* **Action / UI Shapes**: `Heart`, `Undo`, `Redo`, `Refresh`, `Trophy`, `Play`, `Gear`, `Zap`, `Leaf`.
* **Catalog Shapes**: `Keys`, `Wallet`, `Phone`, `Documents`, `Umbrella`, `Water`, `Meds`, `Plug`, `Charger`, `Backpack`, `Laptop`, `Headphones`, `Glasses`, `Book`, `ShoppingBag`, `Coffee`, `Watch`, `Gift`, `CreditCard`.

### Drawing Primitives
Underlying primitives for composing new animated vector shapes:
* `AlambreIcons.Circle`: Normalized circle with animated stroke.
* `AlambreIcons.Line`: Straight line primitive.
* `AlambreIcons.Path`: Curved path with `pathLength: 1` normalized stroke-dash animation.
