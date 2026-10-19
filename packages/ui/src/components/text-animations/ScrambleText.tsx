import { useEffect, useRef, useState, useMemo } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../theme';

export type ScrambleTextProps = {
  text: string;
  speed?: number;
  cyclesPerChar?: number;
  charset?: string;
  preserveWhitespace?: boolean;
  onComplete?: () => void;
  triggerKey?: string | number;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

const DEFAULT_CHARSET = '!<>-_\\/[]{}—=+*^?#________ABCDEF0123456789';

export default function ScrambleText({
  text,
  speed = 35,
  cyclesPerChar = 2,
  charset = DEFAULT_CHARSET,
  preserveWhitespace = true,
  onComplete,
  triggerKey,
  color,
  textStyle,
  containerStyle,
}: ScrambleTextProps) {
  const { theme } = useTheme();
  const isReducedMotion = useReducedMotion();
  const [displayText, setDisplayText] = useState(text);
  const [_isDone, setIsDone] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const textColor = color ?? theme.color;

  const targetChars = useMemo(() => text.split(''), [text]);

  useEffect(() => {
    if (isReducedMotion) {
      setDisplayText(text);
      setIsDone(true);
      onCompleteRef.current?.();
      return;
    }

    setIsDone(false);
    let frame = 0;
    const totalChars = targetChars.length;
    const poolLength = charset.length;

    const interval = setInterval(() => {
      frame += 1;
      const settledCount = Math.min(totalChars, Math.floor(frame / cyclesPerChar));

      if (settledCount >= totalChars) {
        setDisplayText(text);
        setIsDone(true);
        clearInterval(interval);
        onCompleteRef.current?.();
        return;
      }

      const nextChars = targetChars.map((char, index) => {
        if (preserveWhitespace && char === ' ') {
          return ' ';
        }
        if (index < settledCount) {
          return char;
        }
        const randomIndex = Math.floor(Math.random() * poolLength);
        return charset[randomIndex] ?? char;
      });

      setDisplayText(nextChars.join(''));
    }, speed);

    return () => clearInterval(interval);
  }, [
    text,
    targetChars,
    speed,
    cyclesPerChar,
    charset,
    preserveWhitespace,
    isReducedMotion,
    triggerKey,
  ]);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[styles.container, containerStyle]}
    >
      <Text
        textBreakStrategy="simple"
        style={[
          styles.text,
          { color: textColor, fontFamily: theme.fontFamily },
          textStyle,
        ]}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.2,
  },
});
