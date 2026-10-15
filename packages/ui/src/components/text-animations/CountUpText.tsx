import { useEffect, useRef, useState, useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../theme';

export type CountUpTextProps = {
  value: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  decimalSeparator?: string;
  formatter?: (val: number) => string;
  onComplete?: () => void;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function CountUpText({
  value,
  from,
  duration = 800,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = ',',
  decimalSeparator = '.',
  formatter,
  onComplete,
  color,
  textStyle,
  containerStyle,
}: CountUpTextProps) {
  const { theme } = useTheme();
  const isReducedMotion = useReducedMotion();
  const [displayNumber, setDisplayNumber] = useState(() => from ?? value);

  const prevValueRef = useRef(from ?? value);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const textColor = color ?? theme.color;

  const defaultFormat = useMemo(() => {
    return (num: number) => {
      const fixed = num.toFixed(decimals);
      const [intPart, decPart] = fixed.split('.');
      const formattedInt = (intPart ?? '').replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      if (decimals > 0 && decPart !== undefined) {
        return `${prefix}${formattedInt}${decimalSeparator}${decPart}${suffix}`;
      }
      return `${prefix}${formattedInt}${suffix}`;
    };
  }, [decimals, prefix, suffix, separator, decimalSeparator]);

  const formatFn = formatter ?? defaultFormat;

  useEffect(() => {
    const startVal = prevValueRef.current;
    prevValueRef.current = value;

    if (isReducedMotion || duration <= 0 || startVal === value) {
      setDisplayNumber(value);
      onCompleteRef.current?.();
      return;
    }

    const startTime = Date.now();
    const diff = value - startVal;

    let animId: number;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease-out: 1 - (1 - progress)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = startVal + diff * eased;

      setDisplayNumber(currentVal);

      if (progress < 1) {
        animId = globalThis.requestAnimationFrame(tick);
      } else {
        setDisplayNumber(value);
        onCompleteRef.current?.();
      }
    };

    animId = globalThis.requestAnimationFrame(tick);
    return () => {
      if (animId) {
        globalThis.cancelAnimationFrame(animId);
      }
    };
  }, [value, duration, isReducedMotion]);

  const formattedText = formatFn(displayNumber);
  const accessibleLabel = formatFn(value);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibleLabel}
      style={[styles.container, containerStyle]}
    >
      <Text
        textBreakStrategy="simple"
        style={[
          styles.text,
          { color: textColor },
          textStyle,
        ]}
      >
        {formattedText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
});
