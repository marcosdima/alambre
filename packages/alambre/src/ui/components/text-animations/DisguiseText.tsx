import { useEffect, useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useStagger } from '../../..';
import { useTheme, resolveTypography } from '../../theme';
import { kinetics } from '../../..';

export type DisguiseTextProps = {
  text: string;
  masked?: boolean;
  maskChar?: string;
  mode?: 'drop' | 'morph';
  staggerMs?: number;
  direction?: 'left-to-right' | 'right-to-left';
  color?: string;
  maskColor?: string;
  fontFamily?: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

type DisguiseCharProps = {
  char: string;
  maskChar: string;
  isMasked: boolean;
  delay: number;
  mode: 'drop' | 'morph';
  textColor: string;
  maskColor: string;
  textStyle?: StyleProp<TextStyle>;
};

function DisguiseChar({
  char,
  maskChar,
  isMasked,
  delay,
  mode,
  textColor,
  maskColor,
  textStyle,
}: DisguiseCharProps) {
  const isReducedMotion = useReducedMotion();
  const progress = useSharedValue(isMasked ? 1 : 0);

  useEffect(() => {
    if (isReducedMotion) {
      progress.value = isMasked ? 1 : 0;
      return;
    }

    progress.value = withDelay(
      delay,
      withSpring(isMasked ? 1 : 0, kinetics.spring.snappy),
    );
  }, [isMasked, delay, isReducedMotion, progress]);

  const letterStyle = useAnimatedStyle(() => {
    if (mode === 'drop') {
      return {
        opacity: Math.max(0, 1 - progress.value * 1.4),
        transform: [{ translateY: progress.value * 18 }],
      };
    }
    // Morph mode
    return {
      opacity: Math.max(0, 1 - progress.value),
      transform: [
        { scale: Math.max(0, 1 - progress.value) },
        { rotate: `${progress.value * 45}deg` },
      ],
    };
  });

  const maskStyle = useAnimatedStyle(() => {
    if (mode === 'drop') {
      return {
        opacity: Math.min(1, progress.value * 1.4),
        transform: [{ translateY: (1 - progress.value) * -22 }],
      };
    }
    // Morph mode
    return {
      opacity: Math.min(1, progress.value),
      transform: [
        { scale: Math.max(0, progress.value) },
        { rotate: `${(1 - progress.value) * -45}deg` },
      ],
    };
  });

  if (char === ' ') {
    return <Text style={[styles.text, textStyle]}> </Text>;
  }

  return (
    <View style={styles.charCell}>
      {/* Original Character */}
      <Animated.View style={[styles.charSlot, letterStyle]}>
        <Text style={[styles.text, { color: textColor }, textStyle]}>
          {char}
        </Text>
      </Animated.View>

      {/* Disguise / Mask Character */}
      <Animated.View
        style={[styles.charSlot, styles.maskSlot, maskStyle]}
        pointerEvents="none"
      >
        <Text style={[styles.text, { color: maskColor }, textStyle]}>
          {maskChar}
        </Text>
      </Animated.View>
    </View>
  );
}

export default function DisguiseText({
  text,
  masked = true,
  maskChar = '•',
  mode = 'drop',
  staggerMs = 45,
  direction = 'left-to-right',
  color,
  maskColor,
  fontFamily,
  textStyle,
  style,
  containerStyle,
}: DisguiseTextProps) {
  const { theme } = useTheme();
  const textColor = color ?? theme.color;
  const effectiveMaskColor = maskColor ?? theme.primary;
  const typography = resolveTypography(theme, {
    weight: '700',
    fontFamilyOverride: fontFamily,
    style: [textStyle, style],
  });
  const mergedTextStyle = [textStyle, style, typography];

  const characters = useMemo(() => Array.from(text), [text]);

  const { getDelay } = useStagger({
    initialDelay: 0,
    staggerMs,
    maxDelay: Math.max(500, characters.length * staggerMs),
  });

  const getEffectiveDelay = (index: number) => {
    const staggerIndex = direction === 'right-to-left' ? characters.length - 1 - index : index;
    return getDelay(staggerIndex);
  };

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={masked ? 'Masked text' : text}
      style={[styles.container, containerStyle]}
    >
      {characters.map((char, index) => (
        <DisguiseChar
          key={index}
          char={char}
          maskChar={maskChar}
          isMasked={masked}
          delay={getEffectiveDelay(index)}
          mode={mode}
          textColor={textColor}
          maskColor={effectiveMaskColor}
          textStyle={mergedTextStyle}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  charCell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 0.5,
  },
  charSlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskSlot: {
    position: 'absolute',
  },
  text: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
  },
});
