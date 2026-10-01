import type { ReactNode } from 'react';
import { memo, useEffect, useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';

export type TickerSpringConfig = {
  damping?: number;
  stiffness?: number;
  mass?: number;
};

const DEFAULT_SPRING: Required<TickerSpringConfig> = {
  damping: 20,
  stiffness: 180,
  mass: 0.9,
};

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

type DigitColumnProps = {
  digit: number;
  itemHeight: number;
  textStyle?: StyleProp<TextStyle>;
  springConfig?: TickerSpringConfig;
  delayMs?: number;
};

const DigitColumn = memo(function DigitColumn({
  digit,
  itemHeight,
  textStyle,
  springConfig,
  delayMs = 0,
}: DigitColumnProps) {
  const isReducedMotion = useReducedMotion();
  const translateY = useSharedValue(-digit * itemHeight);

  const damping = springConfig?.damping ?? DEFAULT_SPRING.damping;
  const stiffness = springConfig?.stiffness ?? DEFAULT_SPRING.stiffness;
  const mass = springConfig?.mass ?? DEFAULT_SPRING.mass;

  const spring = useMemo(
    () => ({ damping, stiffness, mass }),
    [damping, stiffness, mass],
  );

  useEffect(() => {
    const targetY = -digit * itemHeight;
    if (isReducedMotion) {
      translateY.value = targetY;
      return;
    }
    if (delayMs > 0) {
      translateY.value = withDelay(delayMs, withSpring(targetY, spring));
    } else {
      translateY.value = withSpring(targetY, spring);
    }
  }, [digit, itemHeight, delayMs, spring, translateY, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={[styles.columnWrapper, { height: itemHeight }]}>
      <Animated.View style={animatedStyle}>
        {DIGITS.map((n) => (
          <Text
            key={n}
            style={[
              styles.digitText,
              { height: itemHeight, lineHeight: itemHeight },
              textStyle,
            ]}
          >
            {n}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
});

export type TickerTextProps = {
  value: number | string;
  minDigits?: number;
  padZero?: boolean;
  fontSize?: number;
  lineHeight?: number;
  color?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  springConfig?: TickerSpringConfig;
  staggerMs?: number;
  staggerDirection?: 'left-to-right' | 'right-to-left';
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function TickerText({
  value,
  minDigits,
  padZero = false,
  fontSize = 28,
  lineHeight,
  color,
  prefix,
  suffix,
  springConfig,
  staggerMs = 30,
  staggerDirection = 'right-to-left',
  textStyle,
  containerStyle,
}: TickerTextProps) {
  const { theme } = useLightDark();
  const itemHeight = lineHeight ?? Math.round(fontSize * 1.25);
  const textColor = color ?? theme.color;

  const chars = useMemo(() => {
    let str = String(value);
    if (minDigits !== undefined && minDigits > 0) {
      str = padZero ? str.padStart(minDigits, '0') : str.padStart(minDigits, ' ');
    }
    return str.split('');
  }, [value, minDigits, padZero]);

  const mergedTextStyle = useMemo<StyleProp<TextStyle>>(
    () => [
      styles.baseText,
      {
        fontSize,
        color: textColor,
      },
      textStyle,
    ],
    [fontSize, textColor, textStyle],
  );

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={String(value)}
      style={[styles.container, containerStyle]}
    >
      {prefix ? (
        <View style={styles.prefixSlot}>
          {typeof prefix === 'string' ? (
            <Text style={mergedTextStyle}>{prefix}</Text>
          ) : (
            prefix
          )}
        </View>
      ) : null}

      <View style={styles.digitsRow}>
        {chars.map((char, index) => {
          if (char === ' ') {
            return (
              <Text
                key={`space-${index}`}
                style={[
                  styles.symbolText,
                  { height: itemHeight, lineHeight: itemHeight, opacity: 0 },
                  mergedTextStyle,
                ]}
              >
                0
              </Text>
            );
          }

          const isDigit = char >= '0' && char <= '9';
          if (!isDigit) {
            return (
              <Text
                key={`symbol-${index}`}
                style={[
                  styles.symbolText,
                  { height: itemHeight, lineHeight: itemHeight },
                  mergedTextStyle,
                ]}
              >
                {char}
              </Text>
            );
          }

          const digitValue = parseInt(char, 10);
          const delay =
            staggerDirection === 'right-to-left'
              ? (chars.length - 1 - index) * staggerMs
              : index * staggerMs;

          return (
            <DigitColumn
              key={`col-${index}`}
              digit={digitValue}
              itemHeight={itemHeight}
              textStyle={mergedTextStyle}
              springConfig={springConfig}
              delayMs={delay}
            />
          );
        })}
      </View>

      {suffix ? (
        <View style={styles.suffixSlot}>
          {typeof suffix === 'string' ? (
            <Text style={mergedTextStyle}>{suffix}</Text>
          ) : (
            suffix
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  columnWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  baseText: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  digitText: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  symbolText: {
    textAlign: 'center',
    includeFontPadding: false,
  },
  prefixSlot: {
    marginRight: 4,
    justifyContent: 'center',
  },
  suffixSlot: {
    marginLeft: 4,
    justifyContent: 'center',
  },
});
