import { useEffect, useRef, useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';

export type TypewriterTextProps = {
  text: string;
  speed?: number;
  initialDelay?: number;
  cursor?: boolean;
  hideCursorOnComplete?: boolean;
  cursorChar?: string;
  cursorColor?: string;
  loop?: boolean;
  pauseOnLoopMs?: number;
  onComplete?: () => void;
  textStyle?: StyleProp<TextStyle>;
  cursorStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function TypewriterText({
  text,
  speed = 40,
  initialDelay = 150,
  cursor = true,
  hideCursorOnComplete = false,
  cursorChar = '▍',
  cursorColor,
  loop = false,
  pauseOnLoopMs = 2000,
  onComplete,
  textStyle,
  cursorStyle,
  containerStyle,
}: TypewriterTextProps) {
  const { theme } = useLightDark();
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const cursorOpacity = useSharedValue(1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 450 }),
        withTiming(1, { duration: 450 }),
      ),
      -1,
      true,
    );
  }, [cursorOpacity]);

  useEffect(() => {
    // Reset typing state on text or loop change
    setDisplayedLength(0);
    setIsDone(false);

    let currentIndex = 0;
    const totalLength = text.length;

    const typeNext = () => {
      if (currentIndex < totalLength) {
        currentIndex += 1;
        setDisplayedLength(currentIndex);
        timeoutRef.current = setTimeout(typeNext, speed);
      } else {
        setIsDone(true);
        onComplete?.();

        if (loop) {
          timeoutRef.current = setTimeout(() => {
            currentIndex = 0;
            setDisplayedLength(0);
            setIsDone(false);
            timeoutRef.current = setTimeout(typeNext, initialDelay);
          }, pauseOnLoopMs);
        }
      }
    };

    timeoutRef.current = setTimeout(typeNext, initialDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, initialDelay, loop, pauseOnLoopMs, onComplete]);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const visibleText = text.slice(0, displayedLength);
  const showCursor = cursor && (!hideCursorOnComplete || !isDone);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[styles.container, containerStyle]}
    >
      <Text style={[styles.text, { color: theme.color }, textStyle]}>
        {visibleText}
        {showCursor ? (
          <Animated.Text
            style={[
              styles.cursor,
              { color: cursorColor ?? theme.primary },
              cursorStyle,
              animatedCursorStyle,
            ]}
          >
            {cursorChar}
          </Animated.Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  cursor: {
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 2,
  },
});
