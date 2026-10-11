import { useEffect, useRef, useState } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export type TypewriterProps = {
  text: string;
  speed?: number;
  initialDelay?: number;
  cursor?: boolean;
  hideCursorOnComplete?: boolean;
  cursorChar?: string;
  cursorColor?: string;
  loop?: boolean;
  pauseOnLoopMs?: number;
  eraseOnLoop?: boolean;
  eraseSpeed?: number;
  numberOfLines?: number;
  onComplete?: () => void;
  textStyle?: StyleProp<TextStyle>;
  cursorStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  reserveSpace?: boolean;
};

export function Typewriter({
  text,
  speed = 40,
  initialDelay = 150,
  cursor = true,
  hideCursorOnComplete = false,
  cursorChar = '▍',
  cursorColor,
  loop = false,
  pauseOnLoopMs = 2000,
  eraseOnLoop = true,
  eraseSpeed,
  numberOfLines,
  onComplete,
  textStyle,
  cursorStyle,
  containerStyle,
  reserveSpace = true,
}: TypewriterProps) {
  const isReducedMotion = useReducedMotion();
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [blink, setBlink] = useState(true);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const actualEraseSpeed = eraseSpeed ?? Math.max(15, Math.round(speed / 2));

  // Blinking cursor only when typing has finished (idle) and cursor is enabled
  useEffect(() => {
    if (!cursor || !isDone) {
      setBlink(true);
      return;
    }
    let count = 0;
    const interval = setInterval(() => {
      count += 1;
      setBlink((b) => !b);
      if (count >= 6) {
        clearInterval(interval);
      }
    }, 530);
    return () => clearInterval(interval);
  }, [cursor, isDone]);

  useEffect(() => {
    // Immediate full display if user requested reduced motion
    if (isReducedMotion) {
      setDisplayedLength(text.length);
      setIsDone(true);
      onCompleteRef.current?.();
      return;
    }

    // Reset typing state on text or loop settings change
    setDisplayedLength(0);
    setIsDone(false);

    let currentIndex = 0;
    const totalLength = text.length;

    const eraseNext = () => {
      if (currentIndex > 0) {
        currentIndex -= 1;
        setDisplayedLength(currentIndex);
        timeoutRef.current = setTimeout(eraseNext, actualEraseSpeed);
      } else {
        setIsDone(false);
        timeoutRef.current = setTimeout(typeNext, initialDelay);
      }
    };

    const typeNext = () => {
      if (currentIndex < totalLength) {
        currentIndex += 1;
        setDisplayedLength(currentIndex);
        timeoutRef.current = setTimeout(typeNext, speed);
      } else {
        setIsDone(true);
        onCompleteRef.current?.();

        if (loop) {
          timeoutRef.current = setTimeout(() => {
            if (eraseOnLoop) {
              setIsDone(false);
              eraseNext();
            } else {
              currentIndex = 0;
              setDisplayedLength(0);
              setIsDone(false);
              timeoutRef.current = setTimeout(typeNext, initialDelay);
            }
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
  }, [
    text,
    speed,
    initialDelay,
    loop,
    pauseOnLoopMs,
    eraseOnLoop,
    actualEraseSpeed,
    isReducedMotion,
  ]);

  const visibleText = text.slice(0, displayedLength);
  const remainingText = reserveSpace ? text.slice(displayedLength) : '';
  const showCursor = cursor && (!hideCursorOnComplete || !isDone);
  const isCursorVisible = showCursor && (!isDone || blink);

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
      style={[styles.container, containerStyle]}
    >
      <Text
        textBreakStrategy="simple"
        numberOfLines={numberOfLines}
        style={[styles.text, textStyle]}
      >
        {visibleText}
        {showCursor && (!reserveSpace || !isDone) ? (
          <Text
            style={[
              styles.cursor,
              cursorColor ? { color: cursorColor } : null,
              { opacity: isCursorVisible ? 1 : 0 },
              cursorStyle,
            ]}
          >
            {cursorChar}
          </Text>
        ) : null}
        {reserveSpace && remainingText ? (
          <Text style={{ opacity: 0 }}>
            {remainingText}
          </Text>
        ) : null}
        {showCursor && reserveSpace && isDone ? (
          <Text
            style={[
              styles.cursor,
              cursorColor ? { color: cursorColor } : null,
              { opacity: isCursorVisible ? 1 : 0 },
              cursorStyle,
            ]}
          >
            {cursorChar}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 1,
  },
  text: {},
  cursor: {},
});
