import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AlambreIcons } from 'alambre';
import { useLightDark } from '../providers/theme';
import AppButton, { type ButtonTone } from './AppButton';

export type DialogTone = 'primary' | 'danger' | 'warning' | 'success' | 'neutral';

export type AppDialogProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone?: DialogTone;
  icon?: ReactNode;
  showIcon?: boolean;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: ButtonTone;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLoading?: boolean;
  dismissOnBackdropPress?: boolean;
  customActions?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function AppDialog({
  visible,
  onClose,
  title,
  description,
  tone = 'primary',
  icon,
  showIcon = true,
  children,
  confirmLabel,
  cancelLabel,
  confirmTone,
  onConfirm,
  onCancel,
  confirmLoading = false,
  dismissOnBackdropPress = true,
  customActions,
  style,
}: AppDialogProps) {
  const { theme } = useLightDark();
  const [mounted, setMounted] = useState(visible);
  const isFirstRender = useRef(true);

  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!visible) return;
    }

    if (visible) {
      setMounted(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      cardScale.value = withSpring(1, { damping: 18, stiffness: 300 });
      cardOpacity.value = withTiming(1, { duration: 180 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 160 });
      cardScale.value = withTiming(0.92, { duration: 160 });
      cardOpacity.value = withTiming(0, { duration: 160 }, (finished) => {
        if (finished) {
          runOnJS(setMounted)(false);
        }
      });
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleBackdropPress = () => {
    if (dismissOnBackdropPress) {
      onClose();
    }
  };

  const getToneDetails = () => {
    switch (tone) {
      case 'danger':
        return {
          accent: '#ef4444',
          softBg: '#ef444418',
          defaultIcon: <AlambreIcons.TriangleAlert color="#ef4444" lineWidth={2.2} style={styles.dialogIcon} />,
          defaultConfirmTone: 'danger' as ButtonTone,
        };
      case 'warning':
        return {
          accent: '#f59e0b',
          softBg: '#f59e0b18',
          defaultIcon: <AlambreIcons.TriangleAlert color="#f59e0b" lineWidth={2.2} style={styles.dialogIcon} />,
          defaultConfirmTone: 'warning' as ButtonTone,
        };
      case 'success':
        return {
          accent: '#10b981',
          softBg: '#10b98118',
          defaultIcon: <AlambreIcons.CircleCheck color="#10b981" lineWidth={2.2} style={styles.dialogIcon} />,
          defaultConfirmTone: 'success' as ButtonTone,
        };
      case 'neutral':
        return {
          accent: theme.muted,
          softBg: theme.surfaceAlt,
          defaultIcon: <AlambreIcons.CircleX color={theme.muted} lineWidth={2.2} style={styles.dialogIcon} />,
          defaultConfirmTone: 'neutral' as ButtonTone,
        };
      case 'primary':
      default:
        return {
          accent: theme.primary,
          softBg: theme.primarySoft,
          defaultIcon: <AlambreIcons.Zap color={theme.primary} lineWidth={2.2} style={styles.dialogIcon} />,
          defaultConfirmTone: 'primary' as ButtonTone,
        };
    }
  };

  const toneDetails = getToneDetails();

  if (!mounted) return null;

  return (
    <Modal
      transparent
      visible={mounted}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Animated Dim Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleBackdropPress}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
          />
        </Animated.View>

        {/* Animated Centered Dialog Card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
            style,
            animatedCardStyle,
          ]}
        >
          {/* Tone Icon Badge */}
          {showIcon && (
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: toneDetails.softBg },
              ]}
            >
              {icon ?? toneDetails.defaultIcon}
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, { color: theme.color }]}>{title}</Text>

          {/* Description */}
          {description ? (
            <Text style={[styles.description, { color: theme.muted }]}>
              {description}
            </Text>
          ) : null}

          {/* Optional Children Content */}
          {children ? <View style={styles.childrenContainer}>{children}</View> : null}

          {/* Action Buttons */}
          {customActions ? (
            <View style={styles.actionsContainer}>{customActions}</View>
          ) : (
            (confirmLabel || cancelLabel) && (
              <View style={styles.actionsContainer}>
                {cancelLabel ? (
                  <AppButton
                    variant="outline"
                    tone="neutral"
                    size="md"
                    label={cancelLabel}
                    onPress={onCancel || onClose}
                    style={confirmLabel ? styles.actionButtonFlex : styles.actionButtonFull}
                  />
                ) : null}
                {confirmLabel ? (
                  <AppButton
                    variant="solid"
                    tone={confirmTone ?? toneDetails.defaultConfirmTone}
                    size="md"
                    label={confirmLabel}
                    loading={confirmLoading}
                    onPress={onConfirm}
                    style={cancelLabel ? styles.actionButtonFlex : styles.actionButtonFull}
                  />
                ) : null}
              </View>
            )
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dialogIcon: {
    width: 26,
    height: 26,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  childrenContainer: {
    width: '100%',
    marginVertical: 14,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 20,
  },
  actionButtonFlex: {
    flex: 1,
  },
  actionButtonFull: {
    width: '100%',
  },
});
