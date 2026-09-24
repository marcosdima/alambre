import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLightDark } from '../providers/theme';
import AppButton from './AppButton';

export type ActionSheetOption = {
  id: string;
  label: string;
  subtitle?: string;
  icon?: ReactNode;
  tone?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
  onPress: () => void;
};

export type ActionSheetSpringConfig = {
  damping?: number;
  stiffness?: number;
  mass?: number;
};

const DEFAULT_SPRING: Required<ActionSheetSpringConfig> = {
  damping: 32,
  stiffness: 220,
  mass: 0.9,
};

export type AppActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  options?: ActionSheetOption[];
  cancelLabel?: string;
  dismissOnBackdropPress?: boolean;
  springConfig?: ActionSheetSpringConfig;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function AppActionSheet({
  visible,
  onClose,
  title,
  description,
  options,
  cancelLabel = 'Cancel',
  dismissOnBackdropPress = true,
  springConfig,
  children,
  style,
}: AppActionSheetProps) {
  const { theme } = useLightDark();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const isFirstRender = useRef(true);

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(420);

  const damping = springConfig?.damping ?? DEFAULT_SPRING.damping;
  const stiffness = springConfig?.stiffness ?? DEFAULT_SPRING.stiffness;
  const mass = springConfig?.mass ?? DEFAULT_SPRING.mass;

  const resolvedSpring = useMemo(
    () => ({ damping, stiffness, mass }),
    [damping, stiffness, mass],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!visible) return;
    }

    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, resolvedSpring);
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(450, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
    }
  }, [visible, backdropOpacity, translateY, resolvedSpring]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      } else {
        // Soft resistance when dragging upward with a safe clamp (-45px)
        translateY.value = Math.max(-45, event.translationY * 0.12);
      }
    })
    .onEnd((event) => {
      if (event.translationY > 70 || event.velocityY > 500) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, resolvedSpring);
      }
    });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    const dragFade = interpolate(
      translateY.value,
      [0, 300],
      [1, 0.2],
      Extrapolation.CLAMP,
    );
    return {
      opacity: backdropOpacity.value * dragFade,
    };
  });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleBackdropPress = () => {
    if (dismissOnBackdropPress) {
      onClose();
    }
  };

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.modalRoot}>
        {/* Animated Dim Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
            accessibilityRole="button"
            accessibilityLabel="Dismiss action sheet"
          />
        </Animated.View>

        {/* Animated Bottom Sheet Drawer */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 16) + 8,
            },
            style,
            animatedSheetStyle,
          ]}
        >
          {/* Bottom Overshoot Skirt to completely cover any gap when sprung or dragged upward */}
          <View
            style={[
              styles.bottomSkirt,
              {
                backgroundColor: theme.surface,
                borderLeftColor: theme.border,
                borderRightColor: theme.border,
              },
            ]}
            pointerEvents="none"
          />

          {/* Pan Gesture Area for Grab Handle & Dragging */}
          <GestureDetector gesture={panGesture}>
            <View style={styles.grabHandleArea}>
              <View style={[styles.grabHandle, { backgroundColor: theme.border }]} />
              {(title || description) && (
                <View style={styles.header}>
                  {title ? (
                    <Text style={[styles.title, { color: theme.color }]}>{title}</Text>
                  ) : null}
                  {description ? (
                    <Text style={[styles.description, { color: theme.muted }]}>
                      {description}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          </GestureDetector>

          {/* Options List */}
          {options && options.length > 0 && (
            <View style={styles.optionsList}>
              {options.map((option) => {
                const isDanger = option.tone === 'danger';
                const isPrimary = option.tone === 'primary';
                const textColor = isDanger
                  ? '#ef4444'
                  : isPrimary
                    ? theme.primary
                    : theme.color;
                const iconBg = isDanger
                  ? '#ef444415'
                  : isPrimary
                    ? theme.primarySoft
                    : theme.surfaceAlt;

                return (
                  <Pressable
                    key={option.id}
                    disabled={option.disabled}
                    onPress={() => {
                      if (option.disabled) return;
                      onClose();
                      option.onPress();
                    }}
                    style={({ pressed }) => [
                      styles.optionRow,
                      {
                        backgroundColor: pressed ? theme.surfaceAlt : 'transparent',
                        borderColor: theme.border,
                        opacity: option.disabled ? 0.45 : 1,
                      },
                    ]}
                  >
                    {option.icon ? (
                      <View style={[styles.optionIcon, { backgroundColor: iconBg }]}>
                        {option.icon}
                      </View>
                    ) : null}

                    <View style={styles.optionContent}>
                      <Text style={[styles.optionLabel, { color: textColor }]}>
                        {option.label}
                      </Text>
                      {option.subtitle ? (
                        <Text style={[styles.optionSubtitle, { color: theme.muted }]}>
                          {option.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Custom Children */}
          {children ? <View style={styles.childrenContainer}>{children}</View> : null}

          {/* Cancel Button */}
          {cancelLabel ? (
            <View style={styles.cancelContainer}>
              <AppButton
                fullWidth
                variant="soft"
                tone="neutral"
                size="md"
                label={cancelLabel}
                onPress={onClose}
              />
            </View>
          ) : null}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 16,
  },
  grabHandleArea: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  grabHandle: {
    width: 38,
    height: 4.5,
    borderRadius: 3,
    marginBottom: 12,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  optionsList: {
    width: '100%',
    marginVertical: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 2,
    gap: 14,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  childrenContainer: {
    width: '100%',
    marginVertical: 8,
  },
  cancelContainer: {
    width: '100%',
    marginTop: 10,
  },
  bottomSkirt: {
    position: 'absolute',
    left: -1,
    right: -1,
    bottom: -350,
    height: 350,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
});
