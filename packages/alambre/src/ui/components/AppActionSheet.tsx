import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomSheet, type BottomSheetSpringConfig } from '../..';
import { useTheme, resolveTypography } from '../theme';
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

export type AppActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  options?: ActionSheetOption[];
  cancelLabel?: string;
  dismissOnBackdropPress?: boolean;
  springConfig?: BottomSheetSpringConfig;
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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const titleTypography = resolveTypography(theme, { weight: '700' });
  const descTypography = resolveTypography(theme, { weight: 'normal' });
  const optionLabelTypography = resolveTypography(theme, { weight: '600' });
  const optionSubtitleTypography = resolveTypography(theme, { weight: 'normal' });

  const {
    isMounted,
    panGesture,
    animatedBackdropStyle,
    animatedSheetStyle,
    close,
  } = useBottomSheet({ visible, onClose, springConfig });

  const handleBackdropPress = () => {
    if (dismissOnBackdropPress) {
      close();
    }
  };

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
      <GestureHandlerRootView style={styles.modalRoot}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
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
                borderBottomWidth: 0,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
              style,
              animatedSheetStyle,
            ]}
          >
            {/* Bottom Overshoot Skirt */}
            <View
              style={[
                styles.bottomSkirt,
                { backgroundColor: theme.surface },
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
                      <Text style={[styles.title, { color: theme.color }, titleTypography]}>{title}</Text>
                    ) : null}
                    {description ? (
                      <Text style={[styles.description, { color: theme.muted }, descTypography]}>
                        {description}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </GestureDetector>

            {/* Options List */}
            {options && options.length > 0 && (
              <ScrollView
                style={styles.optionsList}
                contentContainerStyle={styles.optionsListContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
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
                        close();
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
                        <Text style={[styles.optionLabel, { color: textColor }, optionLabelTypography]}>
                          {option.label}
                        </Text>
                        {option.subtitle ? (
                          <Text style={[styles.optionSubtitle, { color: theme.muted }, optionSubtitleTypography]}>
                            {option.subtitle}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
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
                  onPress={close}
                />
              </View>
            ) : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  sheetContainer: {
    width: '100%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
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
    maxHeight: 380,
    marginVertical: 4,
  },
  optionsListContent: {
    paddingVertical: 2,
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
    left: 0,
    right: 0,
    bottom: -350,
    height: 370,
  },
});
