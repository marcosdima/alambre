import AppText from './AppText';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { AlambreIcons, kinetics, useSwipeableRow } from 'alambre';

type SwipeableItemRowProps = {
  children: ReactNode;
  onDelete: () => void;
  onPress?: () => void;
  disabled?: boolean;
  peekIndex?: number;
  deleteLabel?: string;
};

const MAX_SWIPE = -55;

export default function SwipeableItemRow({
  children,
  onDelete,
  onPress,
  disabled = false,
  peekIndex,
  deleteLabel = 'Borrar',
}: SwipeableItemRowProps) {
  const isTriggeredRef = useRef(false);

  const triggerDelete = () => {
    if (isTriggeredRef.current) return;
    isTriggeredRef.current = true;
    snapTo(0);
    onDelete();
    setTimeout(() => {
      isTriggeredRef.current = false;
    }, 600);
  };

  const { translationX, panGesture, snapTo } = useSwipeableRow({
    leftSnapPoints: [],
    rightSnapPoints: [MAX_SWIPE],
    friction: 0.25,
    triggerThreshold: 40,
    onActionTriggered: (direction) => {
      if (direction === 'right') {
        triggerDelete();
      }
    },
    onSnap: (_dir, point) => {
      if (point === MAX_SWIPE) {
        triggerDelete();
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
          { backgroundColor: '#dc2626' },
          animatedBgStyle,
        ]}
      >
        <Pressable
          onPress={triggerDelete}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
          style={styles.actionContent}
        >
          <Animated.View style={[styles.actionContent, animatedActionStyle]}>
            <AlambreIcons.Trash color="#ffffff" lineWidth={2.2} style={styles.deleteIcon} />
            <AppText style={[styles.deleteLabel, { color: '#ffffff' }]}>{deleteLabel}</AppText>
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* 2. Foreground Card */}
      <GestureDetector gesture={panGestureEnabled}>
        <Animated.View
          style={[styles.frontCard, animatedCardStyle]}
          accessibilityActions={[{ name: 'delete', label: deleteLabel }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'delete') {
              triggerDelete();
            }
          }}
        >
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
