import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { AlambreIcons, useDialog } from 'alambre';
import { useTheme } from '../theme';
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
  const { theme } = useTheme();

  const {
    isMounted,
    animatedBackdropStyle,
    animatedCardStyle,
    close,
  } = useDialog({ visible, onClose });

  const handleBackdropPress = () => {
    if (dismissOnBackdropPress) {
      close();
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

  if (!isMounted) return null;

  return (
    <Modal
      transparent
      visible={isMounted}
      onRequestClose={close}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
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
          accessibilityRole="alert"
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
                    onPress={onCancel || close}
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
      </KeyboardAvoidingView>
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
