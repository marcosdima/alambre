import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withDelay,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { useWavefront, WavefrontProvider, useWavefrontItem, useStagger } from 'alambre';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { GummyTabs } from '../../components/test-utils/GummyTabs';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppBadge from '../../components/AppBadge';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppSegmentedControl from '../../components/AppSegmentedControl';

type DifficultyLevel = '1' | '2' | '3' | '4';

const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; count: number; duration: number; staggerMs: number; desc: string }
> = {
  '1': { label: 'Zen (12)', count: 12, duration: 300, staggerMs: 35, desc: 'Light 1D cascade' },
  '2': { label: 'Std (28)', count: 28, duration: 250, staggerMs: 25, desc: 'Everyday list load' },
  '3': { label: 'Stress (64)', count: 64, duration: 200, staggerMs: 16, desc: 'Heavy 3D tumbling' },
  '4': { label: 'Chaos (100)', count: 100, duration: 180, staggerMs: 10, desc: 'Extreme 100-spring stress' },
};

export default function KineticOrchestratorTestbed() {
  const { theme } = useLightDark();

  // Rule 2: Expose rich, strictly non-redundant physics configurations
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('1');
  const [itemCount, setItemCount] = useState(12);
  const [duration, setDuration] = useState(280);
  const [staggerMs, setStaggerMs] = useState(35);
  const [useWavefrontEngine, setUseWavefrontEngine] = useState(true);
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0);

  const handleDifficultyChange = (newLevel: DifficultyLevel) => {
    setDifficulty(newLevel);
    const cfg = DIFFICULTY_CONFIG[newLevel];
    setItemCount(cfg.count);
    setDuration(cfg.duration);
    setStaggerMs(cfg.staggerMs);
  };

  const handleReplay = () => {
    setTriggerKey((k) => k + 1);
  };

  // Rule 3 & 6: Concrete product scenarios via GummyTabs
  const tabs = useMemo(
    () => [
      {
        id: 'cascade-waterfall',
        label: 'Feed Waterfall',
        content: (
          <CascadeScenario
            itemCount={itemCount}
            duration={duration}
            staggerMs={staggerMs}
            useWavefrontEngine={useWavefrontEngine}
            forceReducedMotion={forceReducedMotion}
            triggerKey={triggerKey}
          />
        ),
      },
      {
        id: 'filter-chips',
        label: 'Filter Chips',
        content: (
          <FilterChipsScenario
            itemCount={itemCount}
            duration={duration}
            staggerMs={staggerMs}
            useWavefrontEngine={useWavefrontEngine}
            forceReducedMotion={forceReducedMotion}
            triggerKey={triggerKey}
          />
        ),
      },
      {
        id: 'metric-telemetry',
        label: 'Metric Wave',
        content: (
          <MetricWaveScenario
            itemCount={itemCount}
            duration={duration}
            staggerMs={staggerMs}
            useWavefrontEngine={useWavefrontEngine}
            forceReducedMotion={forceReducedMotion}
            triggerKey={triggerKey}
          />
        ),
      },
      {
        id: 'radial-matrix',
        label: 'Chaos Matrix',
        content: (
          <RadialMatrixScenario
            itemCount={itemCount}
            duration={duration}
            staggerMs={staggerMs}
            useWavefrontEngine={useWavefrontEngine}
            forceReducedMotion={forceReducedMotion}
            triggerKey={triggerKey}
          />
        ),
      },
    ],
    [
      triggerKey,
      itemCount,
      duration,
      staggerMs,
      useWavefrontEngine,
      forceReducedMotion,
    ],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Rule 4: Mandatory TestCard wrapper */}
      <TestCard
        title="Kinetic Wavefront Orchestrator"
        description="Headless single-clock UI-thread wavefront vs concurrent ODE springs. Eliminates mobile device thread saturation."
      >
        <View style={styles.metricsRow}>
          <AppBadge
            label={
              useWavefrontEngine
                ? 'Engine: 1 Wavefront Clock [O(1) Math]'
                : `Engine: ${itemCount} Concurrent ODE Springs`
            }
            tone={useWavefrontEngine ? 'success' : 'warning'}
            variant="soft"
            size="md"
          />
          <AppBadge
            label={`Tier: ${DIFFICULTY_CONFIG[difficulty].label}`}
            tone="primary"
            variant="soft"
            size="md"
          />
          <AppBadge
            label={`Est. Wave: ${Math.round((itemCount - 1) * staggerMs + duration)}ms`}
            tone="neutral"
            variant="soft"
            size="md"
          />
        </View>

        <View style={styles.segmentedWrapper}>
          <AppSegmentedControl
            label="Animation Difficulty Preset"
            value={difficulty}
            options={[
              { label: 'Zen (12)', value: '1' },
              { label: 'Std (28)', value: '2' },
              { label: 'Stress (64)', value: '3' },
              { label: 'Chaos (100)', value: '4' },
            ]}
            onChange={(val) => handleDifficultyChange(val as DifficultyLevel)}
          />
        </View>

        <ConfigSlider
          label={`Difficulty / Stress Tier (${difficulty}/4: ${DIFFICULTY_CONFIG[difficulty].desc})`}
          value={parseInt(difficulty, 10)}
          min={1}
          max={4}
          step={1}
          onChange={(val) => handleDifficultyChange(String(val) as DifficultyLevel)}
        />
        <ConfigSlider
          label={`Items Count (${itemCount})`}
          value={itemCount}
          min={4}
          max={120}
          step={2}
          onChange={setItemCount}
        />
        <ConfigSlider
          label={`Item Duration (${duration}ms)`}
          value={duration}
          min={100}
          max={600}
          step={20}
          onChange={setDuration}
        />
        <ConfigSlider
          label={`Stagger Interval (${staggerMs}ms)`}
          value={staggerMs}
          min={5}
          max={80}
          step={5}
          onChange={setStaggerMs}
        />

        <ConfigSwitch
          label="Single Wavefront (vs N Springs)"
          value={useWavefrontEngine}
          onChange={setUseWavefrontEngine}
        />
        <ConfigSwitch
          label="Simulate Reduced Motion"
          value={forceReducedMotion}
          onChange={setForceReducedMotion}
        />

        <View style={styles.actionRow}>
          <AppButton
            label="Trigger Replay Wave"
            onPress={handleReplay}
            tone="primary"
            variant="solid"
            size="md"
          />
        </View>
      </TestCard>

      <GummyTabs tabs={tabs} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Scenario A: Feed Waterfall (Simulating product activity / transaction list)
// ---------------------------------------------------------------------------
function CascadeScenario({
  itemCount,
  duration,
  staggerMs,
  useWavefrontEngine,
  forceReducedMotion,
  triggerKey = 0,
}: {
  itemCount: number;
  duration: number;
  staggerMs: number;
  useWavefrontEngine: boolean;
  forceReducedMotion: boolean;
  triggerKey?: number;
}) {
  const wavefront = useWavefront({
    count: itemCount,
    staggerMs,
    itemDuration: duration,
    curve: 'criticallyDamped',
    autoStart: true,
  });

  React.useEffect(() => {
    if (triggerKey > 0) {
      wavefront.start();
    }
  }, [triggerKey, wavefront]);

  const { getDelay } = useStagger({
    initialDelay: 0,
    staggerMs,
  });

  const items = useMemo(
    () =>
      Array.from({ length: itemCount }, (_, idx) => ({
        id: `feed-item-${idx}`,
        title: `Telemetry Event #${idx + 1}`,
        subtitle: `Block latency: ${12 + (idx % 7) * 4}ms • Node verified`,
        tone: (idx % 3 === 0 ? 'success' : idx % 3 === 1 ? 'primary' : 'neutral') as
          | 'success'
          | 'primary'
          | 'neutral',
      })),
    [itemCount],
  );

  return (
    <WavefrontProvider value={wavefront}>
      <View style={styles.scenarioContent}>
        {items.map((item, idx) => {
          if (useWavefrontEngine) {
            return (
              <WavefrontCardItem
                key={item.id}
                item={item}
                index={idx}
                forceReducedMotion={forceReducedMotion}
              />
            );
          }

          return (
            <OdeSpringCardItem
              key={item.id}
              item={item}
              index={idx}
              delay={getDelay(idx)}
              duration={duration}
              forceReducedMotion={forceReducedMotion}
              triggerKey={triggerKey}
            />
          );
        })}
      </View>
    </WavefrontProvider>
  );
}

function WavefrontCardItem({
  item,
  index,
  forceReducedMotion,
}: {
  item: { id: string; title: string; subtitle: string; tone: 'success' | 'primary' | 'neutral' };
  index: number;
  forceReducedMotion: boolean;
}) {
  const { animatedStyle } = useWavefrontItem(index, {
    preset: 'slide-scale',
    distance: 20,
    forceReducedMotion,
  });

  return (
    <Animated.View style={animatedStyle}>
      <AppCard
        variant="outlined"
        padding="md"
        title={item.title}
        subtitle={item.subtitle}
        badge={<AppBadge label={`ID-${index + 1}`} tone={item.tone} variant="soft" size="sm" />}
        chevron
      />
    </Animated.View>
  );
}

function OdeSpringCardItem({
  item,
  index,
  delay,
  duration,
  forceReducedMotion,
  triggerKey = 0,
}: {
  item: { id: string; title: string; subtitle: string; tone: 'success' | 'primary' | 'neutral' };
  index: number;
  delay: number;
  duration: number;
  forceReducedMotion: boolean;
  triggerKey?: number;
}) {
  const progress = useSharedValue(forceReducedMotion ? 1 : 0);

  React.useEffect(() => {
    if (forceReducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withSpring(1, { duration, dampingRatio: 0.85 }),
    );
  }, [delay, duration, forceReducedMotion, progress, triggerKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 20 },
      { scale: 0.96 + progress.value * 0.04 },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AppCard
        variant="outlined"
        padding="md"
        title={item.title}
        subtitle={item.subtitle}
        badge={<AppBadge label={`ID-${index + 1}`} tone={item.tone} variant="soft" size="sm" />}
        chevron
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Scenario B: Filter Chips (Simulating dynamic faceted filter tags)
// ---------------------------------------------------------------------------
function FilterChipsScenario({
  itemCount,
  duration,
  staggerMs,
  useWavefrontEngine,
  forceReducedMotion,
  triggerKey = 0,
}: {
  itemCount: number;
  duration: number;
  staggerMs: number;
  useWavefrontEngine: boolean;
  forceReducedMotion: boolean;
  triggerKey?: number;
}) {
  const [selectedChips, setSelectedChips] = useState<Record<number, boolean>>({});

  const wavefront = useWavefront({
    count: itemCount,
    staggerMs,
    itemDuration: duration,
    curve: 'overshoot',
    autoStart: true,
  });

  React.useEffect(() => {
    if (triggerKey > 0) {
      wavefront.start();
    }
  }, [triggerKey, wavefront]);

  const { getDelay } = useStagger({ initialDelay: 0, staggerMs });

  const toggleChip = (idx: number) => {
    setSelectedChips((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const chips = useMemo(
    () =>
      Array.from({ length: itemCount }, (_, idx) => ({
        id: `chip-${idx}`,
        label: `Tag ${String.fromCharCode(65 + (idx % 26))}${idx + 1}`,
      })),
    [itemCount],
  );

  return (
    <WavefrontProvider value={wavefront}>
      <View style={styles.chipsContainer}>
        {chips.map((chip, idx) => {
          const isSelected = Boolean(selectedChips[idx]);

          if (useWavefrontEngine) {
            return (
              <WavefrontChipItem
                key={chip.id}
                label={chip.label}
                index={idx}
                isSelected={isSelected}
                onPress={() => toggleChip(idx)}
                forceReducedMotion={forceReducedMotion}
              />
            );
          }

          return (
            <OdeSpringChipItem
              key={chip.id}
              label={chip.label}
              isSelected={isSelected}
              onPress={() => toggleChip(idx)}
              delay={getDelay(idx)}
              duration={duration}
              forceReducedMotion={forceReducedMotion}
              triggerKey={triggerKey}
            />
          );
        })}
      </View>
    </WavefrontProvider>
  );
}

function WavefrontChipItem({
  label,
  index,
  isSelected,
  onPress,
  forceReducedMotion,
}: {
  label: string;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  forceReducedMotion: boolean;
}) {
  const { animatedStyle } = useWavefrontItem(index, {
    preset: 'pop',
    forceReducedMotion,
  });

  return (
    <Animated.View style={animatedStyle}>
      <AppButton
        label={label}
        onPress={onPress}
        tone={isSelected ? 'primary' : 'neutral'}
        variant={isSelected ? 'solid' : 'outline'}
        size="sm"
      />
    </Animated.View>
  );
}

function OdeSpringChipItem({
  label,
  isSelected,
  onPress,
  delay,
  duration,
  forceReducedMotion,
  triggerKey = 0,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  delay: number;
  duration: number;
  forceReducedMotion: boolean;
  triggerKey?: number;
}) {
  const progress = useSharedValue(forceReducedMotion ? 1 : 0);

  React.useEffect(() => {
    if (forceReducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withSpring(1, { duration, dampingRatio: 0.9 }),
    );
  }, [delay, duration, forceReducedMotion, progress, triggerKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <AppButton
        label={label}
        onPress={onPress}
        tone={isSelected ? 'primary' : 'neutral'}
        variant={isSelected ? 'solid' : 'outline'}
        size="sm"
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Scenario C: Metric Telemetry Wave (Simulating live telemetry meters)
// ---------------------------------------------------------------------------
function MetricWaveScenario({
  itemCount,
  duration,
  staggerMs,
  useWavefrontEngine,
  forceReducedMotion,
  triggerKey = 0,
}: {
  itemCount: number;
  duration: number;
  staggerMs: number;
  useWavefrontEngine: boolean;
  forceReducedMotion: boolean;
  triggerKey?: number;
}) {
  const wavefront = useWavefront({
    count: itemCount,
    staggerMs,
    itemDuration: duration,
    curve: 'bouncy',
    autoStart: true,
  });

  React.useEffect(() => {
    if (triggerKey > 0) {
      wavefront.start();
    }
  }, [triggerKey, wavefront]);

  const { getDelay } = useStagger({ initialDelay: 0, staggerMs });

  const metrics = useMemo(
    () =>
      Array.from({ length: itemCount }, (_, idx) => ({
        id: `metric-${idx}`,
        name: `Node #${idx + 100}`,
        val: `${(idx * 7.3 + 12).toFixed(1)}k`,
        unit: 'req/s',
      })),
    [itemCount],
  );

  return (
    <WavefrontProvider value={wavefront}>
      <View style={styles.metricsGrid}>
        {metrics.map((metric, idx) => {
          if (useWavefrontEngine) {
            return (
              <WavefrontMetricCard
                key={metric.id}
                metric={metric}
                index={idx}
                forceReducedMotion={forceReducedMotion}
              />
            );
          }

          return (
            <OdeSpringMetricCard
              key={metric.id}
              metric={metric}
              delay={getDelay(idx)}
              duration={duration}
              forceReducedMotion={forceReducedMotion}
              triggerKey={triggerKey}
            />
          );
        })}
      </View>
    </WavefrontProvider>
  );
}

function WavefrontMetricCard({
  metric,
  index,
  forceReducedMotion,
}: {
  metric: { id: string; name: string; val: string; unit: string };
  index: number;
  forceReducedMotion: boolean;
}) {
  const { animatedStyle } = useWavefrontItem(index, {
    preset: 'scale',
    forceReducedMotion,
  });

  return (
    <Animated.View style={[styles.metricCardBox, animatedStyle]}>
      <AppCard variant="elevated" padding="sm">
        <AppTitle level={3}>{metric.val}</AppTitle>
        <AppText variant="caption">{metric.name} ({metric.unit})</AppText>
      </AppCard>
    </Animated.View>
  );
}

function OdeSpringMetricCard({
  metric,
  delay,
  duration,
  forceReducedMotion,
  triggerKey = 0,
}: {
  metric: { id: string; name: string; val: string; unit: string };
  delay: number;
  duration: number;
  forceReducedMotion: boolean;
  triggerKey?: number;
}) {
  const progress = useSharedValue(forceReducedMotion ? 1 : 0);

  React.useEffect(() => {
    if (forceReducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withSpring(1, { duration, dampingRatio: 0.95 }),
    );
  }, [delay, duration, forceReducedMotion, progress, triggerKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

  return (
    <Animated.View style={[styles.metricCardBox, animatedStyle]}>
      <AppCard variant="elevated" padding="sm">
        <AppTitle level={3}>{metric.val}</AppTitle>
        <AppText variant="caption">{metric.name} ({metric.unit})</AppText>
      </AppCard>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Scenario D: Chaos Matrix (2D Spatial Stress Grid with Radial Wavefront)
// ---------------------------------------------------------------------------
function RadialMatrixScenario({
  itemCount,
  duration,
  staggerMs,
  useWavefrontEngine,
  forceReducedMotion,
  triggerKey = 0,
}: {
  itemCount: number;
  duration: number;
  staggerMs: number;
  useWavefrontEngine: boolean;
  forceReducedMotion: boolean;
  triggerKey?: number;
}) {
  const cols = Math.max(3, Math.min(10, Math.ceil(Math.sqrt(itemCount))));
  const rows = Math.ceil(itemCount / cols);
  const centerR = (rows - 1) / 2;
  const centerC = (cols - 1) / 2;

  // Compute Euclidean radial distance from center so wave expands outward in ripples
  const nodes = useMemo(() => {
    const raw = Array.from({ length: itemCount }, (_, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const dist = Math.sqrt(Math.pow(r - centerR, 2) + Math.pow(c - centerC, 2));
      return { id: `matrix-cell-${idx}`, idx, r, c, dist };
    });

    const sorted = [...raw].sort((a, b) => a.dist - b.dist);
    const rankMap = new Map<number, number>();
    sorted.forEach((item, rank) => {
      rankMap.set(item.idx, rank);
    });

    return raw.map((item) => ({
      ...item,
      spatialRank: rankMap.get(item.idx) ?? item.idx,
    }));
  }, [itemCount, cols, centerR, centerC]);

  const wavefront = useWavefront({
    count: itemCount,
    staggerMs,
    itemDuration: duration,
    curve: 'bouncy',
    autoStart: true,
  });

  React.useEffect(() => {
    if (triggerKey > 0) {
      wavefront.start();
    }
  }, [triggerKey, wavefront]);

  const { getDelay } = useStagger({ initialDelay: 0, staggerMs });

  return (
    <WavefrontProvider value={wavefront}>
      <View style={styles.matrixContainer}>
        <View style={styles.matrixGrid}>
          {nodes.map((node) => {
            if (useWavefrontEngine) {
              return (
                <WavefrontMatrixCell
                  key={node.id}
                  node={node}
                  cols={cols}
                  forceReducedMotion={forceReducedMotion}
                />
              );
            }

            return (
              <OdeSpringMatrixCell
                key={node.id}
                node={node}
                cols={cols}
                delay={getDelay(node.spatialRank)}
                duration={duration}
                forceReducedMotion={forceReducedMotion}
                triggerKey={triggerKey}
              />
            );
          })}
        </View>
      </View>
    </WavefrontProvider>
  );
}

function WavefrontMatrixCell({
  node,
  cols,
  forceReducedMotion,
}: {
  node: { id: string; idx: number; r: number; c: number; spatialRank: number };
  cols: number;
  forceReducedMotion: boolean;
}) {
  const { theme } = useLightDark();
  const isAlt = (node.r + node.c) % 2 === 0;

  const { animatedStyle } = useWavefrontItem(node.spatialRank, {
    forceReducedMotion,
    style: (p: number) => {
      'worklet';
      const rot = (1 - p) * (isAlt ? 35 : -35);
      const pitch = (1 - p) * 25;

      return {
        opacity: p,
        transform: [
          { perspective: 350 },
          { rotateZ: `${rot}deg` },
          { rotateX: `${pitch}deg` },
          { scale: 0.72 + p * 0.28 },
          { translateY: (1 - p) * -14 },
        ],
      };
    },
  });

  const cellWidth = `${Math.max(8, Math.floor(100 / cols) - 2)}%` as const;

  return (
    <Animated.View
      style={[
        styles.matrixCell,
        {
          width: cellWidth,
          backgroundColor: isAlt ? theme.surfaceAlt : theme.surface,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.matrixCellDot,
          {
            backgroundColor: isAlt ? theme.primary : theme.primarySoft,
          },
        ]}
      />
      <AppText variant="caption">{node.idx + 1}</AppText>
    </Animated.View>
  );
}

function OdeSpringMatrixCell({
  node,
  cols,
  delay,
  duration,
  forceReducedMotion,
  triggerKey = 0,
}: {
  node: { id: string; idx: number; r: number; c: number; spatialRank: number };
  cols: number;
  delay: number;
  duration: number;
  forceReducedMotion: boolean;
  triggerKey?: number;
}) {
  const { theme } = useLightDark();
  const isAlt = (node.r + node.c) % 2 === 0;
  const progress = useSharedValue(forceReducedMotion ? 1 : 0);

  React.useEffect(() => {
    if (forceReducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    progress.value = withDelay(
      delay,
      withSpring(1, { duration, dampingRatio: 0.85 }),
    );
  }, [delay, duration, forceReducedMotion, progress, triggerKey]);

  const animatedStyle = useAnimatedStyle(() => {
    const val = progress.value;
    const rot = (1 - val) * (isAlt ? 35 : -35);
    const pitch = (1 - val) * 25;

    return {
      opacity: val,
      transform: [
        { perspective: 350 },
        { rotateZ: `${rot}deg` },
        { rotateX: `${pitch}deg` },
        { scale: 0.72 + val * 0.28 },
        { translateY: (1 - val) * -14 },
      ],
    };
  });

  const cellWidth = `${Math.max(8, Math.floor(100 / cols) - 2)}%` as const;

  return (
    <Animated.View
      style={[
        styles.matrixCell,
        {
          width: cellWidth,
          backgroundColor: isAlt ? theme.surfaceAlt : theme.surface,
          borderColor: theme.border,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.matrixCellDot,
          {
            backgroundColor: isAlt ? theme.primary : theme.primarySoft,
          },
        ]}
      />
      <AppText variant="caption">{node.idx + 1}</AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  segmentedWrapper: {
    marginBottom: 10,
  },
  actionRow: {
    marginTop: 10,
    marginBottom: 4,
  },
  scenarioContent: {
    paddingVertical: 12,
    gap: 12,
  },
  chipsContainer: {
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricsGrid: {
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  metricCardBox: {
    width: '48%',
  },
  matrixContainer: {
    paddingVertical: 12,
  },
  matrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matrixCell: {
    aspectRatio: 1,
    minWidth: 28,
    maxWidth: 56,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  matrixCellDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
