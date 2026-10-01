import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../providers/theme';

type SwipeableItemRowProps = {
  children: ReactNode;
  onDelete: () => void;
  onPress?: () => void;
  disabled?: boolean;
  peekIndex?: number;
};

const REST_OFFSET = 0;
const SWIPE_TRIGGER_THRESHOLD = 35;
const RESISTANCE = 0.25;
const MAX_SWIPE = -55;

export default function SwipeableItemRow({
  children,
  onDelete,
  onPress,
  disabled = false,
  peekIndex,
}: SwipeableItemRowProps) {
  const { theme } = useLightDark();
  const translateX = useSharedValue(REST_OFFSET);

  useEffect(() => {
    // Only peek the first item once page transition finishes (educational affordance)
    if (peekIndex !== 0 || disabled) return;
    const baseDelay = 420;
    const timer = setTimeout(() => {
      translateX.value = withSequence(
        withTiming(-20, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withDelay(120, withTiming(0, { duration: 180, easing: Easing.inOut(Easing.quad) })),
      );
    }, baseDelay);
    return () => clearTimeout(timer);
  }, [peekIndex, disabled, translateX]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-15, 15])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      'worklet';
      const delta = e.translationX;
      if (delta < 0) {
        translateX.value = Math.max(MAX_SWIPE, delta * RESISTANCE);
      } else {
        translateX.value = Math.min(0, delta * 0.05);
      }
    })
    .onEnd((e) => {
      'worklet';
      if (translateX.value <= -SWIPE_TRIGGER_THRESHOLD || (e.velocityX < -450 && translateX.value < -20)) {
        translateX.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.cubic) });
        runOnJS(onDelete)();
      } else {
        translateX.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -2 ? 1 : 0,
  }));

  const animatedActionStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (Math.abs(translateX.value) - 6) / 20)),
    transform: [
      {
        scale: Math.min(1.05, Math.max(0.75, Math.abs(translateX.value) / SWIPE_TRIGGER_THRESHOLD)),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* 1. Background reveal: Red zone strictly on the right, only visible when swiping or peeking */}
      <Animated.View
        style={[
          styles.actionBackground,
          { backgroundColor: theme.danger },
          animatedBgStyle,
        ]}
      >
        <Animated.View style={[styles.actionContent, animatedActionStyle]}>
          <AlambreIcons.Trash color="#ffffff" lineWidth={2.2} style={styles.deleteIcon} />
          <Text style={styles.deleteLabel}>Borrar</Text>
        </Animated.View>
      </Animated.View>

      {/* 2. Foreground Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.frontCard, animatedCardStyle]}>
          <Pressable onPress={onPress}>
            {children}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 14,
  },
  frontCard: {
    width: '100%',
  },
  actionBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 120,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteIcon: {
    width: 22,
    height: 22,
  },
  deleteLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
