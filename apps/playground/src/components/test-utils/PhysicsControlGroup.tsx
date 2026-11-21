import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard, AppButton, useTheme } from 'alambre/ui';
import { ConfigSlider } from './ConfigSlider';

export interface PhysicsParams {
  durationMs?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export interface PhysicsControlGroupProps {
  title?: string;
  subtitle?: string;
  params?: PhysicsParams;
  onParamChange?: <K extends keyof PhysicsParams>(key: K, value: NonNullable<PhysicsParams[K]>) => void;
  onResetDefaults?: () => void;
  children?: React.ReactNode;
}

/**
 * Standardized configuration group for spring and timing physics parameters.
 */
export function PhysicsControlGroup({
  title = 'Physics & Kinetics Controls',
  subtitle = 'Adjust duration, spring stiffness, damping, and dynamics in real time',
  params,
  onParamChange,
  onResetDefaults,
  children,
}: PhysicsControlGroupProps) {
  const { theme } = useTheme();

  return (
    <AppCard
      variant="outlined"
      title={title}
      subtitle={subtitle}
      style={[styles.card, { borderColor: theme.border }]}
    >
      <View style={styles.content}>
        {params?.durationMs !== undefined && onParamChange && (
          <ConfigSlider
            label="Duration"
            value={params.durationMs}
            min={100}
            max={1500}
            step={50}
            unit="ms"
            onChange={(val) => onParamChange('durationMs', val)}
          />
        )}

        {params?.stiffness !== undefined && onParamChange && (
          <ConfigSlider
            label="Stiffness"
            value={params.stiffness}
            min={40}
            max={400}
            step={10}
            onChange={(val) => onParamChange('stiffness', val)}
          />
        )}

        {params?.damping !== undefined && onParamChange && (
          <ConfigSlider
            label="Damping"
            value={params.damping}
            min={6}
            max={50}
            step={2}
            onChange={(val) => onParamChange('damping', val)}
          />
        )}

        {params?.mass !== undefined && onParamChange && (
          <ConfigSlider
            label="Mass"
            value={params.mass}
            min={0.2}
            max={5}
            step={0.1}
            onChange={(val) => onParamChange('mass', val)}
          />
        )}

        {children}

        {onResetDefaults && (
          <AppButton
            variant="outline"
            tone="neutral"
            size="sm"
            onPress={onResetDefaults}
            style={styles.resetBtn}
          >
            Reset to Defaults
          </AppButton>
        )}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
  },
  content: {
    gap: 12,
  },
  resetBtn: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});
