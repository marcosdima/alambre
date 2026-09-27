import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../providers/theme';

type SwipeableItemRowProps = {
  children: ReactNode;
  onDelete: () => void;
  onPress?: () => void;
  disabled?: boolean;
};

const DELETE_ACTION_WIDTH = 84;
const SWIPE_THRESHOLD = 40;

export default function SwipeableItemRow({
  children,
  onDelete,
  onPress,
  disabled = false,
}: SwipeableItemRowProps) {
  const { theme } = useLightDark();
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const closeRow = useCallback(() => {
    translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
    isOpen.value = false;
  }, [translateX, isOpen]);

  const handleDelete = useCallback(() => {
    closeRow();
    onDelete();
  }, [closeRow, onDelete]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-8, 8])
    .onUpdate((e) => {
      'worklet';
      const offset = isOpen.value ? -DELETE_ACTION_WIDTH : 0;
      const nextX = offset + e.translationX;
      translateX.value = Math.max(-DELETE_ACTION_WIDTH - 15, Math.min(0, nextX));
    })
    .onEnd((e) => {
      'worklet';
      if (translateX.value < -SWIPE_THRESHOLD || e.velocityX < -250) {
        translateX.value = withSpring(-DELETE_ACTION_WIDTH, { damping: 22, stiffness: 280 });
        isOpen.value = true;
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 280 });
        isOpen.value = false;
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const animatedActionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.max(0, translateX.value + DELETE_ACTION_WIDTH) }],
  }));

  return (
    <View style={styles.container}>
      {/* 1. Foreground Card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.frontCard, animatedCardStyle]}>
          <Pressable
            onPress={() => {
              if (isOpen.value) {
                closeRow();
              } else {
                onPress?.();
              }
            }}
            style={({ pressed }) => pressed && styles.pressed}
          >
            {children}
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* 2. Action Button rendered on top, slides in from right edge */}
      <Animated.View style={[styles.actionWrapper, animatedActionStyle]}>
        <Pressable
          onPress={handleDelete}
          accessibilityLabel="Eliminar ítem"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.deleteBtn,
            { backgroundColor: theme.danger },
            pressed && styles.pressed,
          ]}
        >
          <AlambreIcons.Cross color="#ffffff" lineWidth={2.5} style={styles.deleteIcon} />
          <Text style={styles.deleteLabel}>Borrar</Text>
        </Pressable>
      </Animated.View>
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
  actionWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: DELETE_ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  deleteBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 10,
    gap: 3,
  },
  deleteIcon: {
    width: 16,
    height: 16,
  },
  deleteLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
