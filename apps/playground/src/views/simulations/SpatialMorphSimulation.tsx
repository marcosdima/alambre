import React, { useState, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  SpatialSpace,
  SpatialFlightLayer,
  useSpatialSpace,
  useWavefront,
  useWavefrontItem,
  useCollapsible,
} from 'alambre';
import {
  AppTitle,
  AppText,
  AppCard,
  AppButton,
  AppBadge,
  AppSlider,
} from 'alambre/ui';
import { useLightDark } from '../../providers/theme';
import { TestStage } from '../../components/test-utils';

interface HeroProject {
  id: string;
  title: string;
  category: string;
  badgeTone: 'primary' | 'success' | 'warning' | 'danger';
  icon: string;
  metrics: { efficiency: string; power: string; latency: string };
  summary: string;
}

const PROJECTS: HeroProject[] = [
  {
    id: 'proj_apex',
    title: 'Project Apex',
    category: 'ORBITAL',
    badgeTone: 'primary',
    icon: '🛰️',
    metrics: { efficiency: '98.4%', power: '1.2 GW', latency: '4.2 ms' },
    summary: 'Autonomous orbital relay station maintaining deep-space kinetic synchronization.',
  },
  {
    id: 'proj_vortex',
    title: 'Vortex Gateway',
    category: 'QUANTUM',
    badgeTone: 'warning',
    icon: '🌀',
    metrics: { efficiency: '99.9%', power: '4.8 GW', latency: '0.1 ms' },
    summary: 'Sub-atomic wormhole lattice facilitating zero-latency coordinate flights.',
  },
  {
    id: 'proj_foundry',
    title: 'Zero-G Foundry',
    category: 'MATERIALS',
    badgeTone: 'success',
    icon: '💎',
    metrics: { efficiency: '94.2%', power: '850 MW', latency: '12 ms' },
    summary: 'Micro-gravity crystallizer forming defect-free superconductive carbon fibers.',
  },
  {
    id: 'proj_helios',
    title: 'Helios Array',
    category: 'SOLAR',
    badgeTone: 'danger',
    icon: '☀️',
    metrics: { efficiency: '96.7%', power: '12.4 GW', latency: '1.8 ms' },
    summary: 'Dyson-swarm solar collector channeling coronal mass discharges.',
  },
];

function WavefrontMatrixItem({
  index,
  label,
  wavefront,
}: {
  index: number;
  label: string;
  wavefront: ReturnType<typeof useWavefront>;
}) {
  const { theme } = useLightDark();
  const { animatedStyle } = useWavefrontItem(index, {
    wavefront,
    preset: 'slide-scale',
    distance: 16,
  });

  return (
    <Animated.View style={[styles.matrixChipWrapper, animatedStyle]}>
      <View
        style={[
          styles.matrixChip,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={[styles.chipIndicator, { backgroundColor: theme.primary }]} />
        <AppText style={{ fontSize: 11, fontWeight: '700', color: theme.color }}>
          {label}
        </AppText>
      </View>
    </Animated.View>
  );
}

function SpatialMorphArena() {
  const { theme } = useLightDark();
  const { launchFlight } = useSpatialSpace();

  const [activeHero, setActiveHero] = useState<HeroProject | null>(null);
  const [arenaWidth, setArenaWidth] = useState(360);
  const ARENA_FIXED_HEIGHT = 330;

  // Measure thumbnail anchor positions
  const thumbCoordsRef = useRef<Record<string, { x: number; y: number }>>({});

  const onArenaLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (Math.abs(width - arenaWidth) > 4) setArenaWidth(width);
  };

  const heroTargetCoord = { x: arenaWidth / 2, y: ARENA_FIXED_HEIGHT / 2 };

  const handleOpenHero = (proj: HeroProject) => {
    const origin = thumbCoordsRef.current[proj.id] ?? { x: arenaWidth / 2, y: ARENA_FIXED_HEIGHT / 2 };

    launchFlight({
      id: `hero_open_${proj.id}`,
      item: proj,
      from: origin,
      to: heroTargetCoord,
      durationMs: 380,
      liftHeight: 30,
      peakScale: 1.08,
      onComplete: () => {
        setActiveHero(proj);
      },
      renderItem: (item) => (
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.primary,
              borderWidth: 2,
            },
          ]}
        >
          <AppText style={{ fontSize: 28 }}>{item.icon}</AppText>
          <AppTitle level={3}>{item.title}</AppTitle>
        </View>
      ),
    });
  };

  const handleCloseHero = () => {
    if (!activeHero) return;
    const proj = activeHero;
    const targetCoord = thumbCoordsRef.current[proj.id] ?? { x: arenaWidth / 2, y: ARENA_FIXED_HEIGHT / 2 };

    setActiveHero(null);

    launchFlight({
      id: `hero_close_${proj.id}`,
      item: proj,
      from: heroTargetCoord,
      to: targetCoord,
      durationMs: 340,
      liftHeight: 25,
      peakScale: 0.95,
      renderItem: (item) => (
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <AppText style={{ fontSize: 24 }}>{item.icon}</AppText>
          <AppText style={{ fontSize: 12, fontWeight: '700' }}>{item.title}</AppText>
        </View>
      ),
    });
  };

  return (
    <View style={styles.arenaContainer}>
      <TestStage
        title="Spatial Morph Arena"
        badge={{
          label: activeHero ? `Hero: ${activeHero.title}` : 'Grid Mode',
          tone: activeHero ? 'primary' : 'neutral',
        }}
        arenaHeight={ARENA_FIXED_HEIGHT}
        onReset={handleCloseHero}
        resetLabel="Close Hero"
      >
        <View style={styles.arenaSurface} onLayout={onArenaLayout}>
          {/* 2x2 Grid of Thumbnails */}
          <View style={styles.gridContainer}>
            {PROJECTS.map((proj) => {
              const isHidden = activeHero?.id === proj.id;
              return (
                <View
                  key={proj.id}
                  style={[styles.thumbSlot, { opacity: isHidden ? 0 : 1 }]}
                  onLayout={(e) => {
                    const { x, y, width, height } = e.nativeEvent.layout;
                    thumbCoordsRef.current[proj.id] = {
                      x: x + width / 2,
                      y: y + height / 2,
                    };
                  }}
                >
                  <AppButton
                    variant="ghost"
                    style={[
                      styles.thumbButton,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => handleOpenHero(proj)}
                  >
                    <View style={styles.thumbContent}>
                      <AppText style={{ fontSize: 24 }}>{proj.icon}</AppText>
                      <AppText style={{ fontSize: 12, fontWeight: '700', color: theme.color }}>
                        {proj.title}
                      </AppText>
                      <AppBadge tone={proj.badgeTone} size="sm">
                        {proj.category}
                      </AppBadge>
                    </View>
                  </AppButton>
                </View>
              );
            })}
          </View>

          {/* Active Expanded Hero Overlay */}
          {activeHero && (
            <View
              style={[
                styles.activeHeroModal,
                {
                  left: arenaWidth / 2 - 130,
                  top: ARENA_FIXED_HEIGHT / 2 - 110,
                  backgroundColor: theme.surface,
                  borderColor: theme.primary,
                },
              ]}
            >
              <View style={styles.heroHeader}>
                <AppText style={{ fontSize: 32 }}>{activeHero.icon}</AppText>
                <AppBadge tone={activeHero.badgeTone} size="sm">
                  {activeHero.category}
                </AppBadge>
              </View>
              <AppTitle level={3}>{activeHero.title}</AppTitle>
              <AppText variant="muted" style={{ fontSize: 11 }}>
                {activeHero.summary}
              </AppText>

              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <AppText variant="muted" style={{ fontSize: 10 }}>Eff.</AppText>
                  <AppText style={{ fontWeight: '700', fontSize: 11 }}>{activeHero.metrics.efficiency}</AppText>
                </View>
                <View style={styles.metricItem}>
                  <AppText variant="muted" style={{ fontSize: 10 }}>Pwr.</AppText>
                  <AppText style={{ fontWeight: '700', fontSize: 11 }}>{activeHero.metrics.power}</AppText>
                </View>
                <View style={styles.metricItem}>
                  <AppText variant="muted" style={{ fontSize: 10 }}>Lat.</AppText>
                  <AppText style={{ fontWeight: '700', fontSize: 11 }}>{activeHero.metrics.latency}</AppText>
                </View>
              </View>

              <AppButton
                variant="solid"
                tone="primary"
                size="sm"
                onPress={handleCloseHero}
                style={styles.closeBtn}
              >
                Close Hero Morph
              </AppButton>
            </View>
          )}

          {/* Root Spatial Flight Layer */}
          <SpatialFlightLayer />
        </View>
      </TestStage>
    </View>
  );
}

export default function SpatialMorphSimulation() {
  const { theme } = useLightDark();

  const [waveStagger, setWaveStagger] = useState(40);
  const [waveDuration, setWaveDuration] = useState(300);

  // Single-clock wavefront coordinator for 6 matrix chips
  const wavefront = useWavefront({
    count: 6,
    staggerMs: waveStagger,
    itemDuration: waveDuration,
    autoStart: true,
  });

  // Collapsible telemetry panel
  const {
    isExpanded,
    toggle: toggleCollapsible,
    animatedStyle: collapsibleAnimatedStyle,
    probeProps,
  } = useCollapsible({
    defaultExpanded: false,
  });

  const matrixItems = [
    'Sensor Alpha',
    'Laser Emitter',
    'Cryo Pump',
    'Gyro Stabilizer',
    'Flux Capacitor',
    'Shield Matrix',
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <AppTitle level={2}>Spatial Hero Morph & Wavefront</AppTitle>
          <AppBadge tone="primary" variant="soft" size="md">
            MORPH & CASCADE
          </AppBadge>
        </View>
        <AppText variant="muted">
          Seamless coordinate-projected spatial flight from thumbnail to full hero modal,
          single-clock 2D wavefront entrance cascades, and spring-driven collapsibles.
        </AppText>
      </View>

      <SpatialSpace>
        <SpatialMorphArena />
      </SpatialSpace>

      {/* 2D Wavefront Entrance Cascade Showcase */}
      <AppCard variant="outlined" style={[styles.wavefrontCard, { borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <AppTitle level={3}>Wavefront Matrix Cascade</AppTitle>
          <AppButton
            variant="solid"
            tone="primary"
            size="sm"
            onPress={() => wavefront.start()}
          >
            Retrigger Wavefront ⚡
          </AppButton>
        </View>
        <AppText variant="muted" style={{ fontSize: 12 }}>
          6 staggered chips animated via closed-form curves on a single master clock (60/120 FPS).
        </AppText>

        <View style={styles.matrixGrid}>
          {matrixItems.map((name, idx) => (
            <WavefrontMatrixItem
              key={name}
              index={idx}
              label={name}
              wavefront={wavefront}
            />
          ))}
        </View>
      </AppCard>

      {/* Collapsible Architecture Specs Section */}
      <AppCard variant="outlined" style={[styles.collapsibleCard, { borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <AppTitle level={3}>Technical Deep Dive</AppTitle>
          <AppButton
            variant="outline"
            tone="neutral"
            size="sm"
            onPress={toggleCollapsible}
          >
            {isExpanded ? 'Hide Details ▲' : 'Show Details ▼'}
          </AppButton>
        </View>

        {/* Off-screen probe for measuring content height */}
        <View {...probeProps}>
          <View style={styles.deepDiveContent}>
            <AppText variant="body" style={{ fontSize: 13, lineHeight: 18 }}>
              • Spatial Flight: Anchored to parent space using useFlightTrajectory with parabolic arc compensation.
            </AppText>
            <AppText variant="body" style={{ fontSize: 13, lineHeight: 18 }}>
              • Android Hardware Clipping: Avoided by hoisting flying elements to the root SpatialFlightLayer.
            </AppText>
            <AppText variant="body" style={{ fontSize: 13, lineHeight: 18 }}>
              • Wavefront Master Clock: Computes analytical progress = f(t) per item, eliminating N-ODE spring concurrency bottlenecks.
            </AppText>
          </View>
        </View>

        {/* Animated Collapsible View */}
        <Animated.View style={collapsibleAnimatedStyle}>
          <View style={styles.deepDiveContent}>
            <AppText variant="body" style={{ fontSize: 13, lineHeight: 18 }}>
              • Spatial Flight: Anchored to parent space using useFlightTrajectory with parabolic arc compensation.
            </AppText>
            <AppText variant="body" style={{ fontSize: 13, lineHeight: 18 }}>
              • Android Hardware Clipping: Avoided by hoisting flying elements to the root SpatialFlightLayer.
            </AppText>
            <AppText variant="body" style={{ fontSize: 13, lineHeight: 18 }}>
              • Wavefront Master Clock: Computes analytical progress = f(t) per item, eliminating N-ODE spring concurrency bottlenecks.
            </AppText>
          </View>
        </Animated.View>
      </AppCard>

      {/* Calibration Sliders */}
      <AppCard variant="outlined" style={[styles.controlCard, { borderColor: theme.border }]}>
        <AppTitle level={3}>Wavefront Calibration</AppTitle>
        <AppSlider
          label="Wave Stagger Interval"
          value={waveStagger}
          min={20}
          max={120}
          step={5}
          unit="ms"
          onChange={setWaveStagger}
        />
        <AppSlider
          label="Item Duration"
          value={waveDuration}
          min={160}
          max={600}
          step={20}
          unit="ms"
          onChange={setWaveDuration}
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
  arenaContainer: {
    gap: 16,
  },
  arenaSurface: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbSlot: {
    width: '46%',
    height: 120,
  },
  thumbButton: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 8,
  },
  thumbContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroCard: {
    width: 260,
    height: 220,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 8,
  },
  activeHeroModal: {
    position: 'absolute',
    width: 260,
    borderRadius: 18,
    borderWidth: 2,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 12,
    zIndex: 50,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  metricItem: {
    alignItems: 'center',
    gap: 2,
  },
  closeBtn: {
    marginTop: 4,
  },
  wavefrontCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  matrixChipWrapper: {
    width: '47%',
  },
  matrixChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  collapsibleCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  deepDiveContent: {
    paddingTop: 8,
    gap: 6,
  },
  controlCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
});
