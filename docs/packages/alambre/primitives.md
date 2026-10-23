---
title: Components & Icons Reference
summary: Base UI primitives and icon contracts: Button, Slider, SegmentedControl, Stepper, Input, and the AlambreIcons family.
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

### Component Signature & Usage
```typescript
import { Slider, type SliderProps } from 'alambre';

<Slider
  value={volume}
  min={0}
  max={100}
  step={5}
  onChange={setVolume}
>
  {({ ratio, percentage, value, disabled }) => (
    <View style={styles.track}>
      <View style={[styles.filledTrack, { width: `${percentage}%` }]} />
      <View style={[styles.thumb, { left: `${percentage}%` }]} />
    </View>
  )}
</Slider>
```

### Headless Hook: `useSlider`
For custom non-linear sliders, circular dials, or completely custom gesture pipelines:
```typescript
import { useSlider, type SliderOptions } from 'alambre';

const {
  value,
  ratio,
  percentage,
  disabled,
  setValueFromRatio,
  setValue,
  increment,
  decrement,
} = useSlider({
  value: volume,
  min: 0,
  max: 100,
  step: 5,
  onChange: setVolume,
});
```

### Options & Return Properties (`SliderState`)
* `value: number`: Current numeric value clamped within `[min, max]`.
* `ratio: number`: Normalized floating point ratio between `0` (at `min`) and `1` (at `max`).
* `percentage: number`: Integer percentage between `0` and `100` (`Math.round(ratio * 100)`).
* `setValueFromRatio(r: number): void`: Computes and snaps value based on physical touch position along the track.
* `increment(): void` / `decrement(): void`: Adjusts value by `step`.

### Accessibility
* `role="adjustable"`.
* Emits `accessibilityValue={{ min, max, now }}` and responds to native TalkBack / VoiceOver `increment` and `decrement` accessibility actions.

---

## 3. `SegmentedControl` & `useSelect`

Option selection primitive for discrete single-choice items (segmented tabs, pills, inline filters).

### Component Signature & Usage
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

### Headless Hook: `useSelect`
```typescript
import { useSelect, type SelectOptions } from 'alambre';

const {
  selectedIndex,
  isSelected,
  select,
  selectIndex,
  options,
  disabled,
} = useSelect({
  value: filter,
  options: myOptions,
  onChange: setFilter,
});
```

### Accessibility
* Container sets `role="radiogroup"`.
* Each item receives `role="radio"` and `accessibilityState={{ selected: isSelected(opt.value) }}`.

---

## 4. `Stepper` & `useStepper`

Step-based numeric increment and decrement input with boundary clamping.

### Component Signature & Usage
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

### Headless Hook: `useStepper`
```typescript
import { useStepper, type StepperOptions } from 'alambre';

const {
  value,
  canIncrement,
  canDecrement,
  increment,
  decrement,
  setValue,
  disabled,
} = useStepper({
  value: count,
  min: 0,
  max: 20,
  step: 1,
  onChange: setCount,
});
```

### Accessibility
* Renders `role="spinbutton"` with `accessibilityValue={{ min, max, now: value }}`.

---

## 5. `Input`

Behavior-first text input wrapping React Native's `TextInput`, tracking `focused`, `disabled`, and `error` states.

### Signature & Usage
```typescript
import { Input, type InputProps, type InputState } from 'alambre';

<Input
  value={email}
  onChangeText={setEmail}
  error={!isValidEmail}
  disabled={isSubmitting}
  placeholder="Enter email"
  style={({ focused, error, disabled }) => [
    styles.input,
    focused && styles.focused,
    error && styles.error,
    disabled && styles.disabled,
  ]}
/>
```

### State Callback (`InputState`)
* `focused: boolean`: True while the native input has active keyboard focus.
* `disabled: boolean`: True when interaction is blocked.
* `hasValue: boolean`: True when `value.length > 0`.
* `error: boolean`: Passed through to customize border/label styles.

---

## 6. `AlambreIcons`

Vector icons and geometric drawing primitives built on `react-native-svg` and `react-native-reanimated`.

### Common Props (`IconProps`)
* `color: ColorValue` (required: icons never hard-code application theme colors).
* `lineWidth?: number` (default: `4`).
* `drawIt?: boolean`: Triggers stroke drawing animation. Set to `true` to animate the shape into view.
* `rotation?: number`: Degrees of rotation around the center.
* `fill?: ColorValue`: Fill color (where the shape supports fills, defaults to `'none'`).
* `iconAnimation?: IconAnimationConfig`: Custom animation curves (`drawAnimation`, `resetAnimation`, `fillOpacity`).

### Example: Animated Icon Trigger
```typescript
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AlambreIcons } from 'alambre';

export function CompletionButton() {
  const [done, setDone] = useState(false);

  return (
    <Pressable onPress={() => setDone((prev) => !prev)} style={styles.button}>
      <AlambreIcons.Tick
        color="#10b981"
        lineWidth={3}
        drawIt={done}
      />
    </Pressable>
  );
}
```

### Catalog Shapes
Imported via `AlambreIcons.*`:
* **Utility Shapes**: `AlambreIcons.Cross`, `AlambreIcons.Tick`, `AlambreIcons.Arrow`.
* **Theme Shapes**: `AlambreIcons.Sun`, `AlambreIcons.Moon`.
* **Status Shapes**: `AlambreIcons.CircleCheck`, `AlambreIcons.CircleX`, `AlambreIcons.TriangleAlert`.
* **Action / UI Shapes**: `Heart`, `Undo`, `Redo`, `Refresh`, `Trophy`, `Play`, `Gear`, `Zap`, `Leaf`, `Eye`, `EyeOff`, `Search`.
* **Catalog Shapes**: `Keys`, `Wallet`, `Phone`, `Documents`, `Umbrella`, `Water`, `Meds`, `Plug`, `Charger`, `Backpack`, `Laptop`, `Headphones`, `Glasses`, `Book`, `ShoppingBag`, `Coffee`, `Watch`, `Gift`, `CreditCard`.

### Drawing Primitives for Custom Icons
Underlying primitives for composing new animated vector shapes:
* `AlambreIcons.Circle`: Normalized circle with animated stroke.
* `AlambreIcons.Line`: Straight line primitive.
* `AlambreIcons.Path`: Curved path with `pathLength: 1` normalized stroke-dash animation.

#### Example: Composing a Custom Icon
```typescript
import Svg from 'react-native-svg';
import { AlambreIcons } from 'alambre';

export function CustomTargetIcon({ color = '#3b82f6', drawIt = true }: { color?: string; drawIt?: boolean }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 100 100">
      {/* Outer animated ring */}
      <AlambreIcons.Circle
        circle={{ cx: 50, cy: 50, r: 42 }}
        lineWidth={4}
        color={color}
        drawIt={drawIt}
      />
      {/* Inner bullseye */}
      <AlambreIcons.Circle
        circle={{ cx: 50, cy: 50, r: 18 }}
        lineWidth={4}
        color={color}
        drawIt={drawIt}
      />
      {/* Crosshairs */}
      <AlambreIcons.Line
        line={{ x1: 50, y1: 0, x2: 50, y2: 24 }}
        lineWidth={3}
        color={color}
        drawIt={drawIt}
      />
      <AlambreIcons.Line
        line={{ x1: 50, y1: 76, x2: 50, y2: 100 }}
        lineWidth={3}
        color={color}
        drawIt={drawIt}
      />
    </Svg>
  );
}
```

