import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppCard, AppButton, useTheme } from '@some-alambre/ui';
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
  title = 'Controles Físicos y Cinéticos',
  subtitle = 'Ajusta la duración, elasticidad y dinámicas en tiempo real',
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
            label="Duración"
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
            label="Rigidez (Stiffness)"
            value={params.stiffness}
            min={40}
            max={400}
            step={10}
            onChange={(val) => onParamChange('stiffness', val)}
          />
        )}

        {params?.damping !== undefined && onParamChange && (
          <ConfigSlider
            label="Amortiguación (Damping)"
            value={params.damping}
            min={6}
            max={50}
            step={2}
            onChange={(val) => onParamChange('damping', val)}
          />
        )}

        {params?.mass !== undefined && onParamChange && (
          <ConfigSlider
            label="Masa (Mass)"
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
            Restablecer Valores por Defecto
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
