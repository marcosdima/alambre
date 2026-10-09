import AppText from './AppText';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet,  View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AlambreIcons, kinetics, useSwipeableRow } from 'alambre';
import { useLightDark } from '../providers/theme';

type SwipeableItemRowProps = {
  children: ReactNode;
  onDelete: () => void;
  onPress?: () => void;
  disabled?: boolean;
  peekIndex?: number;
};

const MAX_SWIPE = -55;

export default function SwipeableItemRow({
  children,
  onDelete,
  onPress,
  disabled = false,
  peekIndex,
}: SwipeableItemRowProps) {
  const { theme } = useLightDark();

  const { translationX, panGesture, snapTo } = useSwipeableRow({
    leftSnapPoints: [],
    rightSnapPoints: [MAX_SWIPE],
    friction: 0.25,
    triggerThreshold: 40,
    onActionTriggered: (direction) => {
      if (direction === 'right') {
        onDelete();
      }
    },
    onSnap: (dir, point) => {
      if (point === MAX_SWIPE) {
        onDelete();
        snapTo(0);
      }
    },
  });

  useEffect(() => {
    // Only peek the first item once page transition finishes (educational affordance)
    if (peekIndex !== 0 || disabled) return;
    const baseDelay = 420;
    const timer = setTimeout(() => {
      translationX.value = withSequence(
        withTiming(-20, kinetics.timing.fast),
        withDelay(120, withTiming(0, kinetics.timing.fast)),
      );
    }, baseDelay);
    return () => clearTimeout(timer);
  }, [peekIndex, disabled, translationX]);

  const panGestureEnabled = panGesture.enabled(!disabled);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }],
  }));

  const animatedBgStyle = useAnimatedStyle(() => ({
    opacity: translationX.value < -2 ? 1 : 0,
  }));

  const animatedActionStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (Math.abs(translationX.value) - 6) / 20)),
    transform: [
      {
        scale: Math.min(1.05, Math.max(0.75, Math.abs(translationX.value) / 35)),
      },
    ],
  }));

  return (
    <View style={styles.container}>
      {/* 1. Background reveal */}
      <Animated.View
        style={[
          styles.actionBackground,
          { backgroundColor: theme.danger },
          animatedBgStyle,
        ]}
      >
        <Animated.View style={[styles.actionContent, animatedActionStyle]}>
          <AlambreIcons.Trash color="#ffffff" lineWidth={2.2} style={styles.deleteIcon} />
          <AppText style={styles.deleteLabel}>Borrar</AppText>
        </Animated.View>
      </Animated.View>

      {/* 2. Foreground Card */}
      <GestureDetector gesture={panGestureEnabled}>
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

  },
});
