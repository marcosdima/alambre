import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme, AppText, AppBadge, AppButton } from 'alambre/ui';

export type StageBadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export interface TestStageProps {
  /** Optional scenario title or description label */
  title?: string;
  /** Status badge shown above or inside the arena */
  badge?: {
    label: string;
    tone?: StageBadgeTone;
  };
  /** Measured elapsed time in milliseconds */
  elapsedMs?: number;
  /** Height of the interactive visual arena in points (default: 200) */
  arenaHeight?: number;
  /** Style overrides for the arena wrapper */
  arenaStyle?: ViewStyle;
  /** Primary action button configuration (e.g., Launch / Play / Settle) */
  primaryAction?: {
    label: string;
    onPress: () => void;
    tone?: StageBadgeTone;
    disabled?: boolean;
  };
  /** Callback to reset the test scenario */
  onReset?: () => void;
  /** Reset button label (default: "Reset") */
  resetLabel?: string;
  /** Additional controls or toggles rendered alongside the action bar */
  extraControls?: React.ReactNode;
  /** Interactive arena content (pads, animated items, drop zones, etc.) */
  children: React.ReactNode;
}

/**
 * Standardized testbed stage container with telemetry overlay,
 * interactive arena, and responsive action controls.
 */
export function TestStage({
  title,
  badge,
  elapsedMs,
  arenaHeight = 200,
  arenaStyle,
  primaryAction,
  onReset,
  resetLabel = 'Reset',
  extraControls,
  children,
}: TestStageProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Optional Stage Header with Title and Telemetry */}
      {(title || badge || elapsedMs !== undefined) && (
        <View style={styles.headerRow}>
          {title ? (
            <AppText variant="subtitle" style={[styles.title, { color: theme.color }]}>
              {title}
            </AppText>
          ) : (
            <View style={styles.flexOne} />
          )}

          <View style={styles.telemetryGroup}>
            {elapsedMs !== undefined && elapsedMs > 0 && (
              <AppBadge tone="neutral" variant="outline" size="sm">
                {`${elapsedMs} ms`}
              </AppBadge>
            )}
            {badge && (
              <AppBadge tone={badge.tone ?? 'neutral'} variant="solid" size="sm">
                {badge.label}
              </AppBadge>
            )}
          </View>
        </View>
      )}

      {/* Visual Canvas / Arena */}
      <View
        style={[
          styles.arena,
          {
            height: arenaHeight,
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
          },
          arenaStyle,
        ]}
      >
        {children}
      </View>

      {/* Action Controls Footer */}
      {(primaryAction || onReset || extraControls) && (
        <View style={styles.controlsRow}>
          {primaryAction && (
            <AppButton
              variant="solid"
              tone={primaryAction.tone ?? 'primary'}
              onPress={primaryAction.onPress}
              disabled={primaryAction.disabled}
              style={styles.primaryBtn}
            >
              {primaryAction.label}
            </AppButton>
          )}

          {onReset && (
            <AppButton
              variant="outline"
              tone="neutral"
              onPress={onReset}
              style={styles.resetBtn}
            >
              {resetLabel}
            </AppButton>
          )}

          {extraControls}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    gap: 8,
  },
  title: {
    fontWeight: '600',
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  telemetryGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arena: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flex: 1,
  },
  resetBtn: {
    minWidth: 84,
  },
});
