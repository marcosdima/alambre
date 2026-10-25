import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
} from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ToastComponentProps } from '../../behaviors/toast';
import { parseToastPayload, useToastGesture } from '../../behaviors/toast';
import * as AlambreIcons from '../../components/icons';
import { resolveTypography } from '../theme/typography';
import { useTheme } from '../theme/ThemeProvider';

export type AppToastProps = ToastComponentProps & {
  topOffsetExtra?: number;
  bottomOffsetExtra?: number;
};

export function AppToast({
  toast,
  dismiss,
  queueLength,
  topOffsetExtra = 16,
  bottomOffsetExtra = 16,
}: AppToastProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { data } = toast;

  const parsed = parseToastPayload(data.payload);
  const baseTop = Math.max(insets.top, 16) + topOffsetExtra;
  const baseBottom = Math.max(insets.bottom, 16) + bottomOffsetExtra;

  const {
    isTop,
    isGestureDismissed,
    showProgressBar,
    panGesture,
    animatedPositionStyle,
    animatedGestureStyle,
    progressBarStyle,
  } = useToastGesture({
    toast,
    dismiss,
    position: parsed.position,
    topOffset: baseTop,
    bottomOffset: baseBottom,
  });

  const titleTypo = resolveTypography(theme, { weight: '700' });
  const contentTypo = resolveTypography(theme, { weight: 'normal' });
  const actionTypo = resolveTypography(theme, { weight: '700' });
  const queueTypo = resolveTypography(theme, { weight: '700' });

  // Semantic tone configuration
  const tone = parsed.tone ?? 'info';
  const getToneDetails = () => {
    switch (tone) {
      case 'success':
        return {
          accent: theme.success,
          bgBadge: theme.successSoft || `${theme.success}20`,
          Icon: AlambreIcons.CircleCheck,
        };
      case 'warning':
        return {
          accent: theme.warning,
          bgBadge: theme.warningSoft || `${theme.warning}20`,
          Icon: AlambreIcons.TriangleAlert,
        };
      case 'danger':
        return {
          accent: theme.danger,
          bgBadge: theme.dangerSoft || `${theme.danger}20`,
          Icon: AlambreIcons.CircleX,
        };
      case 'info':
      default:
        return {
          accent: theme.primary,
          bgBadge: theme.primarySoft,
          Icon: null,
        };
    }
  };

  const toneConfig = getToneDetails();
  const IconComponent = toneConfig.Icon;

  const enterAnimation = isTop
    ? FadeInDown.duration(260).easing(Easing.out(Easing.cubic))
    : FadeInUp.duration(260).easing(Easing.out(Easing.cubic));

  const exitAnimation = isTop
    ? FadeOutUp.duration(220).easing(Easing.in(Easing.cubic))
    : FadeOutDown.duration(220).easing(Easing.in(Easing.cubic));

  return (
    <Animated.View
      style={[styles.root, animatedPositionStyle]}
      pointerEvents="box-none"
    >
      <Animated.View
        key={data.id}
        entering={enterAnimation}
        exiting={isGestureDismissed ? undefined : exitAnimation}
        style={styles.cardWrapper}
        pointerEvents="box-none"
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.card,
              animatedGestureStyle,
              {
                backgroundColor: theme.surface,
                borderColor: toneConfig.accent,
              },
            ]}
          >
            {/* Tone Accent Bar on Left */}
            <View style={[styles.accentStrip, { backgroundColor: toneConfig.accent }]} />

            <View style={styles.contentRow}>
              {/* Tone Icon Badge */}
              <View style={[styles.iconWrapper, { backgroundColor: toneConfig.bgBadge }]}>
                {IconComponent ? (
                  <IconComponent
                    color={toneConfig.accent}
                    lineWidth={2.2}
                    style={styles.toneIcon}
                  />
                ) : (
                  <Text style={[styles.infoMark, { color: toneConfig.accent }]}>ℹ</Text>
                )}
              </View>

              {/* Message Body */}
              <View style={styles.textContainer}>
                {parsed.title ? (
                  <Text
                    style={[styles.title, titleTypo, { color: theme.color }]}
                    numberOfLines={1}
                  >
                    {parsed.title}
                  </Text>
                ) : null}
                {parsed.content ? (
                  <Text style={[styles.content, contentTypo, { color: theme.color }]}>
                    {parsed.content}
                  </Text>
                ) : null}

                {/* Action Buttons if any */}
                {data.actions && data.actions.length > 0 ? (
                  <View style={styles.actionsRow}>
                    {data.actions.map((action, idx) => {
                      const isDanger = action.tone === 'danger';
                      const btnColor = isDanger ? theme.danger : toneConfig.accent;
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            action.onPress();
                            dismiss(data.id);
                          }}
                          style={[styles.actionBtn, { borderColor: btnColor }]}
                          hitSlop={8}
                          accessibilityRole="button"
                        >
                          <Text style={[styles.actionBtnText, actionTypo, { color: btnColor }]}>
                            {action.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              {/* Queue Counter Badge */}
              {queueLength > 0 ? (
                <View
                  style={[
                    styles.queueBadge,
                    { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.queueBadgeText, queueTypo, { color: theme.muted }]}>
                    +{queueLength}
                  </Text>
                </View>
              ) : null}

              {/* Dismiss Button */}
              <Pressable
                onPress={() => dismiss(data.id)}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Dismiss toast"
              >
                <Text style={[styles.closeText, { color: theme.muted }]}>✕</Text>
              </Pressable>
            </View>

            {/* Progress Countdown Bar */}
            {showProgressBar ? (
              <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    progressBarStyle,
                    { backgroundColor: toneConfig.accent },
                  ]}
                />
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </Animated.View>
    </Animated.View>
  );
}

export default AppToast;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 999,
  },
  cardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '92%',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingLeft: 14,
    gap: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneIcon: {
    width: 20,
    height: 20,
  },
  infoMark: {
    fontSize: 16,
    fontWeight: '800',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
  },
  content: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
  },
  queueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  queueBadgeText: {
    fontSize: 10,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
});
