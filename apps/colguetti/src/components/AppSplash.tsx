import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { useLightDark } from '../providers/theme';
import { Typewriter } from 'alambre';

export default function AppSplash({ onFinished }: { onFinished?: () => void }) {
  const { theme } = useLightDark();
  const opacity = useSharedValue(1);
  const [visible, setVisible] = useState(true);

  const handleComplete = () => {
    // Wait a brief moment after typing completes before fading out
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 600 }, (finished) => {
        if (finished) {
          runOnJS(setVisible)(false);
          if (onFinished) runOnJS(onFinished)();
        }
      });
    }, 600);
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: theme.background }, { opacity }]}>
      <Typewriter
        text="Colguetti"
        speed={120}
        initialDelay={200}
        cursor={true}
        cursorChar="|"
        hideCursorOnComplete={true}
        cursorColor={theme.primary}
        onComplete={handleComplete}
        textStyle={[styles.title, { color: theme.color }]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  title: {

    fontSize: 54,
    lineHeight: 80,
    paddingVertical: 20,
    includeFontPadding: true,
    letterSpacing: 2,
  },
});
