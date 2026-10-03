---
title: Text Animations Reference
summary: Kinetic typography and animated text primitives: CountUp, Typewriter, Scramble, Marquee, WavyText, and SlideInText with Reanimated worklets and kinetics motion profiles.
---

# Text Animations Reference

Alambre provides headless, kinetic typography primitives engineered with React Native Reanimated. In accordance with [docs/architecture.md](../architecture.md) §2 and §6, these components handle mathematical interpolation, UI-thread worklets, layout measurements, and spring physics internally, while leaving styling (colors, typography, fonts, borders, container layouts) fully customizable by the application.

---

## Motion Integration & `kinetics.ts` Profiles

Motion in text animations coordinates with Alambre's centralized physics token system defined in `src/core/kinetics.ts`:

| Motion Profile | Configuration | Usage in Text Animations |
| --- | --- | --- |
| `kinetics.spring.bouncy` | `{ damping: 14, mass: 1, stiffness: 150 }` | Powers `<SlideInText>` character/word entrance cascades with lively physical overshoot. |
| `kinetics.spring.snappy` | `{ damping: 20, mass: 1, stiffness: 250 }` | Recommended for numeric tick settles and interactive hold-press reactions (`useContinuousPress`). |
| `kinetics.spring.gentle` | `{ damping: 25, mass: 1, stiffness: 100 }` | Soft entrance alternative for large typography headers. |
| `kinetics.timing.fast` | `{ duration: 150 }` | Fast character flip and scramble transitions. |
| `kinetics.timing.base` | `{ duration: 250 }` | Standard duration base for text fade and transition interpolation. |
| `kinetics.timing.slow` | `{ duration: 350 }` | Measured pace for staggered entrance sequences. |

All duration-based text animations expose a `speed` multiplier prop. The effective duration is calculated as:
```typescript
effectiveDuration = duration / Math.max(0.1, speed)
```
This enables runtime pacing adjustments without modifying base timing assets.

---

## 1. `<CountUp>`

A high-performance rolling digit odometer / counter. Automatically parses numeric values (including integer and decimal portions), renders masked vertical sliding columns for each digit (`0`-`9`), and scrolls to target values using cubic easing and tabular font spacing (`fontVariant: ['tabular-nums']`).

### Props Contract (`CountUpProps`)

Extends `Omit<TextProps, 'style'>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `number` | **Required** | The target numeric value to display. |
| `initialValue` | `number` | `0` | Starting value prior to transition. |
| `duration` | `number` | `1000` | Base roll duration in milliseconds. |
| `delay` | `number` | `0` | Delay before the roll animation begins in milliseconds. |
| `speed` | `number` | `1` | Speed multiplier scaling the roll duration (`duration / Math.max(0.1, speed)`). |
| `style` | `StyleProp<TextStyle>` | `undefined` | Typography styling applied to individual digit items. |

### Motion & Kinematics
* **Easing Curve:** Decelerating cubic ease-out (`Easing.out(Easing.cubic)`).
* **Digit Column Rolling:** Computes native layout height dynamically via an off-screen measurement probe, then translates columns by `-animatedValue * height`.
* **Tabular Alignment:** Injects `fontVariant: ['tabular-nums']` to ensure consistent column widths across fluctuating digits.

### Example Usage

```tsx
import { View, StyleSheet } from 'react-native';
import { CountUp } from 'alambre';

export function ScoreDisplay({ score }: { score: number }) {
  return (
    <View style={styles.card}>
      <CountUp
        value={score}
        duration={1200}
        speed={1.2}
        style={styles.scoreText}
        testID="score-counter"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, alignItems: 'center' },
  scoreText: { fontSize: 32, fontWeight: '700', color: '#111827' },
});
```

---

## 2. `<Typewriter>`

Progressively reveals text string character-by-character on the UI thread. By leveraging an uneditable `AnimatedTextInput` with Reanimated's `useAnimatedProps`, text advances smoothly without triggering repeated React component re-renders.

### Props Contract (`TypewriterProps`)

Extends `Omit<TextInputProps, 'value' | 'editable'>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | **Required** | The text content to progressively type out. |
| `duration` | `number` | `2000` | Total duration to complete typing the entire string (ms). |
| `delay` | `number` | `0` | Milliseconds to wait before starting typing. |
| `speed` | `number` | `1` | Speed multiplier scaling the typing rate. |
| `style` | `StyleProp<TextStyle>` | `undefined` | Typography style for the rendered text input. |

### Motion & Kinematics
* **Linear UI-Thread Worklet:** Advances progress from `0` to `text.length` via `Easing.linear`.
* **Zero-Re-Render Streaming:** Uses `useAnimatedProps` to mutate the native `text` attribute of `TextInput` directly on the native frame thread.

### Example Usage

```tsx
import { StyleSheet, View } from 'react-native';
import { Typewriter } from 'alambre';

export function TerminalGreeting({ username }: { username: string }) {
  return (
    <View style={styles.terminal}>
      <Typewriter
        text={`Welcome back, ${username}. System diagnostics complete.`}
        duration={2500}
        delay={300}
        style={styles.codeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  terminal: { padding: 16, backgroundColor: '#0f172a', borderRadius: 8 },
  codeText: { fontFamily: 'monospace', fontSize: 14, color: '#38bdf8' },
});
```

---

## 3. `<Scramble>`

A matrix-style glyph decrypt / scramble reveal. Cycles unrevealed characters through randomized alphanumeric and symbol glyphs before progressively locking the correct characters in place from left to right.

### Props Contract (`ScrambleProps`)

Extends `Omit<TextInputProps, 'value' | 'editable'>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | **Required** | The target destination text to decrypt. |
| `duration` | `number` | `2000` | Duration of the total scramble sequence (ms). |
| `delay` | `number` | `0` | Delay in milliseconds before starting scramble. |
| `speed` | `number` | `1` | Speed multiplier scaling scramble resolution. |
| `style` | `StyleProp<TextStyle>` | `undefined` | Text typography styles. |

### Motion & Kinematics
* **Easing Curve:** Quadratic ease-out (`Easing.out(Easing.quad)`), causing rapid initial glyph changes that settle as characters resolve.
* **Character Pool:** Uses a randomized glyph alphabet (`CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'`) while preserving spaces.
* **Native Thread Execution:** Animated via `useAnimatedProps` without JS bridge re-renders.

### Example Usage

```tsx
import { StyleSheet } from 'react-native';
import { Scramble } from 'alambre';

export function ClassifiedBadge({ codename }: { codename: string }) {
  return (
    <Scramble
      text={codename.toUpperCase()}
      duration={1800}
      speed={1.5}
      style={styles.badgeText}
    />
  );
}

const styles = StyleSheet.create({
  badgeText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#10b981',
  },
});
```

---

## 4. `<Marquee>`

An infinite horizontal ticker / marquee scroller. Automatically measures its child content width via `onLayout` and duplicates the content with a configurable gap, seamlessly looping on the UI thread without layout jumps or hiccups.

### Props Contract (`MarqueeProps`)

Extends `ViewProps`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `React.ReactNode` | **Required** | Content elements to scroll (text, icons, badges, chips). |
| `duration` | `number` | `5000` | Duration for one full loop cycle across content width + gap (ms). |
| `gap` | `number` | `50` | Horizontal spacing in pixels between content duplicates. |
| `speed` | `number` | `1` | Speed multiplier scaling translation velocity. |
| `style` | `StyleProp<ViewStyle>` | `undefined` | Container view style (`overflow: 'hidden'` is applied). |

### Motion & Kinematics
* **Seamless Repetition:** Uses `withRepeat(withTiming(-contentWidth - gap, { duration: duration / Math.max(0.1, speed), easing: Easing.linear }), -1, false)`.
* **Zero Jitter:** Layout width is measured on native layout events; translation translates the child container precisely by the measured width + gap before resetting instantly.

### Example Usage

```tsx
import { StyleSheet, Text, View } from 'react-native';
import { Marquee } from 'alambre';

export function BreakingNewsTicker({ headline }: { headline: string }) {
  return (
    <Marquee duration={6000} gap={40} style={styles.tickerContainer}>
      <Text style={styles.tickerItem}>🔥 {headline}</Text>
      <Text style={styles.tickerBadge}>LIVE</Text>
    </Marquee>
  );
}

const styles = StyleSheet.create({
  tickerContainer: {
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#fca5a5',
  },
  tickerItem: { fontSize: 14, fontWeight: '600', color: '#b91c1c' },
  tickerBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
```

---

## 5. `<WavyText>`

Creates a continuous sinusoidal vertical wave across letters. Staggers each character's vertical oscillation along an infinite repeating sequence, producing playful organic motion.

### Props Contract (`WavyTextProps`)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | **Required** | Text string to animate. |
| `amplitude` | `number` | `10` | Peak vertical displacement distance in pixels. |
| `gap` | `number` | `2` | Horizontal gap in pixels between adjacent characters. |
| `staggerDelay` | `number` | `50` | Delay offset in ms between adjacent characters. |
| `speed` | `number` | `1` | Speed multiplier scaling the wave cycle period. |
| `style` | `StyleProp<TextStyle>` | `undefined` | Typography styles for individual character glyphs. |
| `containerStyle` | `StyleProp<ViewStyle>` | `undefined` | Style applied to the wrapping flex-row container. |

### Motion & Kinematics
* **Continuous Wave Loop:** Uses `withRepeat(withSequence(withTiming(-amplitude, { duration }), withTiming(amplitude, { duration })), -1, true)` with cycle duration calculated as `500 / Math.max(0.1, speed)`.
* **Whitespace Preservation:** Replaces space characters with non-breaking spaces (` `) so flex layout does not collapse whitespace between words.

### Example Usage

```tsx
import { StyleSheet } from 'react-native';
import { WavyText } from 'alambre';

export function CelebrationBanner() {
  return (
    <WavyText
      text="Congratulations!"
      amplitude={8}
      staggerDelay={40}
      speed={1.2}
      style={styles.wavyText}
      containerStyle={styles.bannerContainer}
    />
  );
}

const styles = StyleSheet.create({
  bannerContainer: { justifyContent: 'center', paddingVertical: 12 },
  wavyText: { fontSize: 24, fontWeight: '800', color: '#6366f1' },
});
```

---

## 6. `<SlideInText>`

Physics-driven staggered entrance cascade. Slides characters or words up into view from a vertical offset while interpolating opacity, powered directly by Alambre's `kinetics.spring.bouncy` motion profile.

### Props Contract (`SlideInTextProps`)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `text` | `string` | **Required** | The text content to reveal. |
| `offset` | `number` | `20` | Initial vertical starting offset in pixels below the rest position. |
| `staggerDelay` | `number` | `50` | Stagger delay in milliseconds between sequential elements. |
| `mode` | `'words' | 'characters'` | `'characters'` | Splitting mode: cascade letter-by-letter or word-by-word. |
| `gap` | `number` | `4` | Spacing in pixels between items (applied when `mode="words"`). |
| `style` | `StyleProp<TextStyle>` | `undefined` | Typography styles for text items. |
| `containerStyle` | `StyleProp<ViewStyle>` | `undefined` | Style for the wrapping flex container. |

### Motion & Kinematics
* **Kinetics Engine Integration:** Each element animates its entrance progress shared value using:
  ```typescript
  withDelay(index * staggerDelay, withSpring(1, kinetics.spring.bouncy));
  ```
  where `kinetics.spring.bouncy` is `{ damping: 14, mass: 1, stiffness: 150 }`.
* **Simultaneous Interpolation:** Derives both opacity (`progress.value`) and translation (`interpolate(progress.value, [0, 1], [offset, 0])`) on the UI thread.
* **Modes:**
  - `mode="characters"`: Granular letter-by-letter reveal for dramatic headings or hero intros.
  - `mode="words"`: Fluid word-by-word cascade for natural reading cadence in paragraphs or subtitles.

### Example Usage

```tsx
import { StyleSheet, View } from 'react-native';
import { SlideInText } from 'alambre';

export function HeroHeading() {
  return (
    <View style={styles.container}>
      {/* Cascading word-by-word with bouncy spring settle */}
      <SlideInText
        text="Design at the speed of thought"
        mode="words"
        offset={24}
        staggerDelay={70}
        gap={6}
        style={styles.heroText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  heroText: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
});
```
