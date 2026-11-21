import React, { useState, useMemo } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet, ScrollView } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import {
  AppTitle,
  AppText,
  AppCard,
  AppButton,
  AppBadge,
  AppSlider,
  AppSwitch,
} from 'alambre/ui';
import { withSettledSpring } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { TestStage } from '../../components/test-utils';

interface AnchorPoint {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

const PUCK_RADIUS = 28;
const ARENA_FIXED_HEIGHT = 320;

export default function ElasticPhysicsSimulation() {
  const { theme } = useLightDark();

  // Invariant 3: Arena height is fixed. Bounds only tracks width for layout boundary clamping.
  const [arenaBounds, setArenaBounds] = useState({ width: 360, height: ARENA_FIXED_HEIGHT });

  // Physics tuning state
  const [stiffness, setStiffness] = useState(180);
  const [damping, setDamping] = useState(16);
  const [mass, setMass] = useState(1.0);
  const [restitution, setRestitution] = useState(0.72);
  const [magneticEnabled, setMagneticEnabled] = useState(true);

  // Telemetry state
  const [telemetry, setTelemetry] = useState({
    speed: 0,
    bounces: 0,
    status: 'Idle' as 'Idle' | 'Dragging' | 'Flinging' | 'Captured' | 'Settled',
    capturedAnchor: null as string | null,
  });

  const posX = useSharedValue(arenaBounds.width / 2);
  const posY = useSharedValue(ARENA_FIXED_HEIGHT / 2);
  const startPosX = useSharedValue(arenaBounds.width / 2);
  const startPosY = useSharedValue(ARENA_FIXED_HEIGHT / 2);
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const bounceCount = useSharedValue(0);

  const anchors: AnchorPoint[] = useMemo(
    () => [
      { id: 'anchor_a', label: 'Well Alpha', x: 70, y: 70, color: '#3b82f6' },
      { id: 'anchor_b', label: 'Well Beta', x: arenaBounds.width - 70, y: 70, color: '#10b981' },
      { id: 'anchor_c', label: 'Well Gamma', x: arenaBounds.width / 2, y: ARENA_FIXED_HEIGHT - 65, color: '#f59e0b' },
    ],
    [arenaBounds.width],
  );

  const updateTelemetry = (
    speed: number,
    bounces: number,
    status: 'Idle' | 'Dragging' | 'Flinging' | 'Captured' | 'Settled',
    capturedAnchor: string | null = null,
  ) => {
    setTelemetry({ speed: Math.round(speed), bounces, status, capturedAnchor });
  };

  // Invariant 3: Layout event never alters TestStage height to prevent infinite shrinking loops
  const onArenaLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (Math.abs(width - arenaBounds.width) > 4) {
      setArenaBounds({ width, height: ARENA_FIXED_HEIGHT });
    }
  };

  // Invariant 5: Pan gesture uses startOffset + e.translationX/Y, never e.x / e.y
  const panGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      bounceCount.value = 0;
      startPosX.value = posX.value;
      startPosY.value = posY.value;
      scaleX.value = withSpring(1.12, { damping: 14 });
      scaleY.value = withSpring(1.12, { damping: 14 });
      runOnJS(updateTelemetry)(0, 0, 'Dragging', null);
    })
    .onUpdate((e) => {
      'worklet';
      posX.value = startPosX.value + e.translationX;
      posY.value = startPosY.value + e.translationY;
      const speed = Math.sqrt(e.velocityX * e.velocityX + e.velocityY * e.velocityY);
      runOnJS(updateTelemetry)(speed, bounceCount.value, 'Dragging', null);
    })
    .onEnd((e) => {
      'worklet';
      isDragging.value = false;

      const vx = e.velocityX;
      const vy = e.velocityY;
      const speed = Math.sqrt(vx * vx + vy * vy);

      // 1. Magnetic Gravity Well Attraction
      let captured: AnchorPoint | null = null;
      if (magneticEnabled) {
        for (let i = 0; i < anchors.length; i++) {
          const anc = anchors[i];
          const dist = Math.sqrt(
            Math.pow(posX.value - anc.x, 2) + Math.pow(posY.value - anc.y, 2),
          );
          if (dist < 75 && speed < 1400) {
            captured = anc;
            break;
          }
        }
      }

      if (captured) {
        const targetAnchor = captured;
        scaleX.value = withSpring(1, { stiffness: 220, damping: 16 });
        scaleY.value = withSpring(1, { stiffness: 220, damping: 16 });
        posX.value = withSettledSpring(targetAnchor.x, {
          stiffness: 260,
          damping: 20,
        });
        posY.value = withSettledSpring(targetAnchor.y, {
          stiffness: 260,
          damping: 20,
        });
        runOnJS(updateTelemetry)(0, bounceCount.value, 'Captured', targetAnchor.label);
        return;
      }

      // 2. High-Velocity Boundary Clamp & Bounce Rebounds
      const minX = PUCK_RADIUS + 4;
      const maxX = arenaBounds.width - PUCK_RADIUS - 4;
      const minY = PUCK_RADIUS + 4;
      const maxY = ARENA_FIXED_HEIGHT - PUCK_RADIUS - 4;

      let projectedTargetX = posX.value + vx * 0.22;
      let projectedTargetY = posY.value + vy * 0.22;
      let localBounces = 0;

      if (projectedTargetX < minX) {
        projectedTargetX = minX + (minX - projectedTargetX) * restitution;
        localBounces += 1;
      } else if (projectedTargetX > maxX) {
        projectedTargetX = maxX - (projectedTargetX - maxX) * restitution;
        localBounces += 1;
      }

      if (projectedTargetY < minY) {
        projectedTargetY = minY + (minY - projectedTargetY) * restitution;
        localBounces += 1;
      } else if (projectedTargetY > maxY) {
        projectedTargetY = maxY - (projectedTargetY - maxY) * restitution;
        localBounces += 1;
      }

      const finalX = Math.max(minX, Math.min(maxX, projectedTargetX));
      const finalY = Math.max(minY, Math.min(maxY, projectedTargetY));

      bounceCount.value = localBounces;

      // Squish deformation upon bounce with guaranteed return to 1.0
      if (localBounces > 0) {
        scaleX.value = withTiming(0.85, { duration: 80 }, () => {
          'worklet';
          scaleX.value = withSpring(1, { stiffness: 220, damping: 16 });
        });
        scaleY.value = withTiming(0.85, { duration: 80 }, () => {
          'worklet';
          scaleY.value = withSpring(1, { stiffness: 220, damping: 16 });
        });
      } else {
        scaleX.value = withSpring(1, { stiffness: 220, damping: 16 });
        scaleY.value = withSpring(1, { stiffness: 220, damping: 16 });
      }

      posX.value = withSettledSpring(finalX, {
        stiffness,
        damping,
        mass,
        velocity: vx * 0.5,
      });

      posY.value = withSettledSpring(finalY, {
        stiffness,
        damping,
        mass,
        velocity: vy * 0.5,
      });

      runOnJS(updateTelemetry)(speed, localBounces, 'Settled', null);
    });

  const animatedPuckStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: -PUCK_RADIUS,
      top: -PUCK_RADIUS,
      transform: [
        { translateX: posX.value },
        { translateY: posY.value },
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
      ],
      zIndex: 100,
    };
  });

  // Action: Launch random directional impulse with guaranteed scale recovery
  const handleFlingImpulse = () => {
    const angle = Math.random() * Math.PI * 2;
    const force = 800 + Math.random() * 600;
    const impulseVx = Math.cos(angle) * force;
    const impulseVy = Math.sin(angle) * force;

    bounceCount.value = 1;
    scaleX.value = withTiming(1.2, { duration: 80 }, () => {
      'worklet';
      scaleX.value = withSpring(1, { stiffness: 220, damping: 16 });
    });
    scaleY.value = withTiming(0.8, { duration: 80 }, () => {
      'worklet';
      scaleY.value = withSpring(1, { stiffness: 220, damping: 16 });
    });

    const minX = PUCK_RADIUS + 4;
    const maxX = arenaBounds.width - PUCK_RADIUS - 4;
    const minY = PUCK_RADIUS + 4;
    const maxY = ARENA_FIXED_HEIGHT - PUCK_RADIUS - 4;

    const targetX = Math.max(minX, Math.min(maxX, posX.value + impulseVx * 0.25));
    const targetY = Math.max(minY, Math.min(maxY, posY.value + impulseVy * 0.25));

    posX.value = withSettledSpring(targetX, { stiffness, damping, mass });
    posY.value = withSettledSpring(targetY, { stiffness, damping, mass });

    updateTelemetry(force, 1, 'Flinging', null);
  };

  // Action: Reset puck to center
  const handleResetCenter = () => {
    bounceCount.value = 0;
    scaleX.value = withSpring(1);
    scaleY.value = withSpring(1);
    posX.value = withSettledSpring(arenaBounds.width / 2, { stiffness: 220, damping: 20 });
    posY.value = withSettledSpring(ARENA_FIXED_HEIGHT / 2, { stiffness: 220, damping: 20 });
    updateTelemetry(0, 0, 'Idle', null);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <AppTitle level={2}>Elastic Physics & Collisions</AppTitle>
          <AppBadge tone="warning" variant="soft" size="md">
            2D KINETICS
          </AppBadge>
        </View>
        <AppText variant="muted">
          High-velocity pan toss, elastomeric boundary rebound with restitution, magnetic
          gravity wells, and squish/stretch deformation.
        </AppText>
      </View>

      <TestStage
        title="Physical Boundary & Attraction Arena"
        badge={{
          label: telemetry.status,
          tone:
            telemetry.status === 'Captured'
              ? 'success'
              : telemetry.status === 'Flinging'
                ? 'warning'
                : 'neutral',
        }}
        arenaHeight={ARENA_FIXED_HEIGHT}
        onReset={handleResetCenter}
        resetLabel="Center Puck"
      >
        <View style={styles.arenaSurface} onLayout={onArenaLayout}>
          {/* Magnetic Gravity Wells */}
          {anchors.map((anc) => (
            <View
              key={anc.id}
              style={[
                styles.anchorWell,
                {
                  left: anc.x - 34,
                  top: anc.y - 34,
                  borderColor: anc.color,
                  opacity: magneticEnabled ? 1 : 0.35,
                },
              ]}
            >
              <View style={[styles.anchorCore, { backgroundColor: anc.color }]} />
              <AppText variant="muted" style={styles.anchorLabel}>
                {anc.label}
              </AppText>
            </View>
          ))}

          {/* Interactive Physics Puck */}
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.puckContainer, animatedPuckStyle]}>
              <View
                style={[
                  styles.puckDisc,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.onPrimary,
                  },
                ]}
              >
                <View style={styles.puckInnerDot} />
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </TestStage>

      {/* Telemetry Gauge Cards */}
      <View style={styles.telemetryGrid}>
        <AppCard variant="outlined" style={[styles.metricCard, { borderColor: theme.border }]}>
          <AppText variant="muted" style={styles.metricLabel}>
            Velocity
          </AppText>
          <AppText style={{ fontSize: 18, fontWeight: '700', color: theme.color }}>
            {telemetry.speed} px/s
          </AppText>
        </AppCard>

        <AppCard variant="outlined" style={[styles.metricCard, { borderColor: theme.border }]}>
          <AppText variant="muted" style={styles.metricLabel}>
            Rebound Bounces
          </AppText>
          <AppText style={{ fontSize: 18, fontWeight: '700', color: theme.color }}>
            {telemetry.bounces}
          </AppText>
        </AppCard>

        <AppCard variant="outlined" style={[styles.metricCard, { borderColor: theme.border }]}>
          <AppText variant="muted" style={styles.metricLabel}>
            Attractor Lock
          </AppText>
          <AppText style={{ fontSize: 14, fontWeight: '700', color: theme.primary }}>
            {telemetry.capturedAnchor ?? 'None'}
          </AppText>
        </AppCard>
      </View>

      {/* Action Controls */}
      <View style={styles.actionRow}>
        <AppButton variant="solid" tone="primary" onPress={handleFlingImpulse}>
          Fling Random Impulse 💥
        </AppButton>
        <AppButton variant="outline" tone="neutral" onPress={handleResetCenter}>
          Center Puck
        </AppButton>
      </View>

      {/* Physics Sliders */}
      <AppCard variant="outlined" style={[styles.controlCard, { borderColor: theme.border }]}>
        <AppTitle level={3}>Dynamics & Spring Calibration</AppTitle>

        <View style={styles.toggleRow}>
          <AppText variant="subtitle">Magnetic Gravity Wells</AppText>
          <AppSwitch checked={magneticEnabled} onChange={setMagneticEnabled} />
        </View>

        <AppSlider
          label="Spring Stiffness"
          value={stiffness}
          min={60}
          max={360}
          step={20}
          onChange={setStiffness}
        />
        <AppSlider
          label="Damping"
          value={damping}
          min={8}
          max={36}
          step={2}
          onChange={setDamping}
        />
        <AppSlider
          label="Mass"
          value={mass}
          min={0.4}
          max={3.0}
          step={0.2}
          onChange={setMass}
        />
        <AppSlider
          label="Boundary Restitution (Bounciness)"
          value={Math.round(restitution * 100)}
          min={30}
          max={95}
          step={5}
          unit="%"
          onChange={(val) => setRestitution(val / 100)}
        />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  headerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  arenaSurface: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  anchorWell: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  anchorCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  anchorLabel: {
    position: 'absolute',
    bottom: -18,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    width: 90,
  },
  puckContainer: {
    width: PUCK_RADIUS * 2,
    height: PUCK_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puckDisc: {
    width: PUCK_RADIUS * 2,
    height: PUCK_RADIUS * 2,
    borderRadius: PUCK_RADIUS,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 8,
  },
  puckInnerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    opacity: 0.85,
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  controlCard: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
});
