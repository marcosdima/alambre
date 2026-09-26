import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutUp,
  LinearTransition,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useLightDark } from '../../providers/theme';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppButton from '../../components/AppButton';
import AppCard from '../../components/AppCard';
import AppBadge, { AppChip } from '../../components/AppBadge';
import AppSwitch from '../../components/AppSwitch';
import AppSegmentedControl from '../../components/AppSegmentedControl';
import {
  DndProvider,
  useDnd,
  Draggable,
  Droppable,
  SortableRow,
  useDraggable,
  type DropAnimationMode,
  type NeighborShiftMode,
  type DropEvent,
  type SortableItem,
} from '../../components/dnd';

export type CardItem = SortableItem & {
  title: string;
  symbol: string;
  accent: string;
  energy: number;
};

const INITIAL_HAND: CardItem[] = [
  { id: 'card-shield', title: 'Shield', symbol: '🛡️', accent: '#3b82f6', energy: 2 },
  { id: 'card-flame', title: 'Inferno', symbol: '🔥', accent: '#ef4444', energy: 4 },
  { id: 'card-bolt', title: 'Lightning', symbol: '⚡', accent: '#eab308', energy: 3 },
  { id: 'card-elixir', title: 'Elixir', symbol: '🧪', accent: '#10b981', energy: 1 },
];

export type PoolItem = {
  id: string;
  name: string;
  symbol: string;
  category: string;
  accent: string;
};

const INITIAL_POOL: PoolItem[] = [
  { id: 'token-crystal', name: 'Crystal', symbol: '💎', category: 'Resource', accent: '#06b6d4' },
  { id: 'token-relic', name: 'Relic', symbol: '🏺', category: 'Artifact', accent: '#8b5cf6' },
  { id: 'token-blade', name: 'Dagger', symbol: '🗡️', category: 'Weapon', accent: '#ec4899' },
];

export type SlotEntranceMode = 'zoom' | 'slide' | 'fade' | 'instant';
export type SlotExitMode = 'zoom' | 'slide' | 'fade' | 'instant';

function getEntranceAnimation(mode: SlotEntranceMode, slowMotion: boolean) {
  const f = slowMotion ? 4 : 1;
  switch (mode) {
    case 'zoom':
      return ZoomIn.duration(220 * f).springify().damping(16);
    case 'slide':
      return FadeInDown.duration(240 * f).springify().damping(16);
    case 'fade':
      return FadeIn.duration(200 * f);
    case 'instant':
      return undefined;
  }
}

function getExitAnimation(mode: SlotExitMode, slowMotion: boolean) {
  const f = slowMotion ? 4 : 1;
  switch (mode) {
    case 'zoom':
      return ZoomOut.duration(180 * f);
    case 'slide':
      return FadeOutUp.duration(180 * f);
    case 'fade':
      return FadeOut.duration(160 * f);
    case 'instant':
      return undefined;
  }
}

type FreeformTileProps = {
  activeScale: number;
  tiltDeg: number;
  returnOnReject: boolean;
  clampToBounds: boolean;
  sandboxBounds: { minX: number; maxX: number; minY: number; maxY: number };
  onCoordsChange: (coords: { x: number; y: number }) => void;
  onResetRef: (resetFn: () => void) => void;
};

function FreeformTile({
  activeScale,
  tiltDeg,
  returnOnReject,
  clampToBounds,
  sandboxBounds,
  onCoordsChange,
  onResetRef,
}: FreeformTileProps) {
  const { theme } = useLightDark();
  const bounds = clampToBounds ? sandboxBounds : undefined;

  const {
    panGesture,
    animatedStyle,
    targetViewRef,
    handleLayout,
    resetPosition,
  } = useDraggable({
    id: 'freeform-tile',
    kinetics: {
      activeScale,
      maxVelocityTiltDeg: tiltDeg,
      returnOnReject,
      boundsConstraint: bounds,
    },
    onDragMove: (x, y) => {
      onCoordsChange({ x: Math.round(x), y: Math.round(y) });
    },
    onDragEnd: () => {
      if (returnOnReject) {
        onCoordsChange({ x: 0, y: 0 });
      }
    },
  });

  const { activeDrag } = useDnd();
  const isDragging = activeDrag?.id === 'freeform-tile';

  useEffect(() => {
    onResetRef(() => {
      resetPosition();
      onCoordsChange({ x: 0, y: 0 });
    });
  }, [onResetRef, resetPosition, onCoordsChange]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        ref={targetViewRef}
        onLayout={handleLayout}
        collapsable={false}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Freeform test tile"
        style={animatedStyle}
      >
        <View
          style={[
            styles.freeformTile,
            {
              backgroundColor: theme.surface,
              borderColor: isDragging ? '#8b5cf6' : theme.border,
              borderWidth: isDragging ? 2 : 1,
            },
          ]}
        >
          <Text style={styles.freeformSymbol}>🔮</Text>
          <Text style={[styles.freeformTitle, { color: theme.color }]}>Mystic Orb</Text>
          <AppChip
            tone="primary"
            size="sm"
            label={returnOnReject ? 'Elastic Snap' : 'Freeform'}
          />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

type DndTestContentProps = {
  hand: CardItem[];
  setHand: (hand: CardItem[]) => void;
  pool: PoolItem[];
  setPool: (pool: PoolItem[]) => void;
  slotA: PoolItem | null;
  slotB: PoolItem | null;
  recallSlot: (slot: 'a' | 'b') => void;
  resetAll: () => void;
  lastAction: string;
};

function DndTestContent({
  hand,
  setHand,
  pool,
  slotA,
  slotB,
  recallSlot,
  resetAll,
  lastAction,
}: DndTestContentProps) {
  const { theme } = useLightDark();
  const { activeDrag, hoveredZoneId, measureAllDroppables } = useDnd();

  // Card 1 Controls (Hand)
  const [dropMode, setDropMode] = useState<DropAnimationMode>('seamless');
  const [handSlowMotion, setHandSlowMotion] = useState(false);
  const [neighborMotion, setNeighborMotion] = useState<NeighborShiftMode>('glide');
  const [handTilt, setHandTilt] = useState<0 | 4 | 8>(4);
  const [handSensitivity, setHandSensitivity] = useState<0.35 | 0.50 | 0.65>(0.50);
  const [handScale, setHandScale] = useState<1.00 | 1.08 | 1.16>(1.08);

  // Card 2 Controls (Drop Zones & Inventory)
  const [slotEntrance, setSlotEntrance] = useState<SlotEntranceMode>('zoom');
  const [slotExit, setSlotExit] = useState<SlotExitMode>('zoom');
  const [slotMagnetism, setSlotMagnetism] = useState<1.00 | 1.02 | 1.05>(1.02);
  const [glowTone, setGlowTone] = useState<'blue-purple' | 'emerald-amber'>('blue-purple');
  const [slotSlowMotion, setSlotSlowMotion] = useState(false);

  const slotAColor = glowTone === 'blue-purple' ? '#3b82f6' : '#10b981';
  const slotBColor = glowTone === 'blue-purple' ? '#8b5cf6' : '#f59e0b';

  // Card 3 Controls (Freeform & Physics Sandbox)
  const [releasePhysics, setReleasePhysics] = useState<'float' | 'snap'>('float');
  const [clampToBounds, setClampToBounds] = useState(true);
  const [tiltMode, setTiltMode] = useState<'off' | 'subtle' | 'dynamic'>('dynamic');
  const [scalePreset, setScalePreset] = useState<'calm' | 'tactile' | 'pop'>('tactile');
  const [liveCoords, setLiveCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [sandboxBounds, setSandboxBounds] = useState<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }>({ minX: -80, maxX: 80, minY: -30, maxY: 30 });

  const tiltDeg = tiltMode === 'off' ? 0 : tiltMode === 'subtle' ? 6 : 14;
  const activeScale = scalePreset === 'calm' ? 1.04 : scalePreset === 'tactile' ? 1.08 : 1.16;
  const returnReject = releasePhysics === 'snap';

  const freeformResetRef = useRef<(() => void) | null>(null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      scrollEnabled={!activeDrag}
      onScrollEndDrag={measureAllDroppables}
      onMomentumScrollEnd={measureAllDroppables}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Header */}
      <View style={styles.header}>
        <AppTitle level={1}>Drag & Drop Playground</AppTitle>
        <AppText variant="muted">Tactile sorting, magnetic drop targets, and elastic micro-physics</AppText>
      </View>

      {/* Live Status Bar */}
      <AppCard variant="soft" padding="sm">
        <View style={styles.statusBar}>
          <View style={styles.statusRow}>
            <AppBadge
              tone={activeDrag ? 'warning' : 'neutral'}
              variant="solid"
              size="sm"
              label={activeDrag ? `DRAGGING: ${activeDrag.id}` : 'IDLE'}
            />
            {hoveredZoneId && (
              <AppBadge
                tone="success"
                variant="solid"
                size="sm"
                label={`HOVER: ${hoveredZoneId}`}
              />
            )}
          </View>
          <Text style={[styles.actionText, { color: theme.color }]} numberOfLines={1}>
            {lastAction}
          </Text>
        </View>
      </AppCard>

      {/* CARD 1: Card Hand / Sortable Reordering */}
      <AppCard
        title="Card Hand (Sortable Reorder)"
        subtitle="Real-time reactive gap opening: test pure glides (no bounce), linear slides, elastic springs, kinetic tilt, and drop settles."
        badge={`${hand.length} Cards`}
        badgeTone="primary"
      >
        <View style={styles.handContainer}>
          <SortableRow
            items={hand}
            onReorder={setHand}
            itemWidth={68}
            gap={8}
            neighborShiftMode={neighborMotion}
            dragTiltDeg={handTilt}
            reorderThreshold={handSensitivity}
            dropAnimationMode={dropMode}
            slowMotion={handSlowMotion}
            activeScale={handScale}
            containerStyle={styles.sortableContainer}
            renderItem={(item, index, isDragging) => (
              <View
                style={[
                  styles.cardItem,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isDragging ? item.accent : theme.border,
                    borderWidth: isDragging ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.energyBadge, { backgroundColor: item.accent }]}>
                  <Text style={styles.energyText}>{item.energy}</Text>
                </View>
                <Text style={styles.cardSymbol}>{item.symbol}</Text>
                <Text style={[styles.cardTitle, { color: theme.color }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.cardPos, { color: theme.muted }]}>#{index + 1}</Text>
              </View>
            )}
          />
        </View>

        {/* In-Card Controls for Sortable Hand */}
        <View style={styles.inCardControls}>
          <View style={styles.handFooter}>
            <Text style={[styles.orderSummary, { color: theme.muted }]}>
              Order: {hand.map((c) => c.symbol).join(' ')}
            </Text>
            <AppButton variant="soft" size="sm" onPress={() => setHand(INITIAL_HAND)}>
              <Text style={{ color: theme.color, fontSize: 12 }}>Reset Hand</Text>
            </AppButton>
          </View>

          <AppSegmentedControl
            label="Drop Settle Animation"
            value={dropMode}
            onChange={(val) => setDropMode(val as DropAnimationMode)}
            options={[
              { value: 'seamless', label: 'Glide' },
              { value: 'bounce', label: 'Bounce' },
              { value: 'impact', label: 'Impact' },
              { value: 'instant', label: 'Instant' },
            ]}
          />

          <AppSegmentedControl
            label="Neighbor Shift Motion"
            value={neighborMotion}
            onChange={(val) => setNeighborMotion(val as NeighborShiftMode)}
            options={[
              { value: 'glide', label: 'Glide' },
              { value: 'linear', label: 'Linear' },
              { value: 'damped', label: 'Damped' },
              { value: 'bounce', label: 'Bounce' },
              { value: 'instant', label: 'Instant' },
            ]}
          />

          <AppSegmentedControl
            label="Reorder Sensitivity"
            value={handSensitivity}
            onChange={(val) => setHandSensitivity(val as 0.35 | 0.50 | 0.65)}
            options={[
              { value: 0.35, label: 'Quick (35%)' },
              { value: 0.50, label: 'Balanced (50%)' },
              { value: 0.65, label: 'Firm (65%)' },
            ]}
          />

          <AppSegmentedControl
            label="Kinetic Drag Tilt"
            value={handTilt}
            onChange={(val) => setHandTilt(val as 0 | 4 | 8)}
            options={[
              { value: 0, label: 'Flat (0°)' },
              { value: 4, label: 'Subtle (4°)' },
              { value: 8, label: 'Expressive (8°)' },
            ]}
          />

          <AppSegmentedControl
            label="Pickup Elevation Scale"
            value={handScale}
            onChange={(val) => setHandScale(val as 1.00 | 1.08 | 1.16)}
            options={[
              { value: 1.00, label: 'Flat (1.0x)' },
              { value: 1.08, label: 'Calm (1.08x)' },
              { value: 1.16, label: 'Pop (1.16x)' },
            ]}
          />

          <AppSwitch
            label="Slow Motion (0.25x Speed)"
            subtitle="4x slower animation to inspect drop physics and slot transitions frame-by-frame"
            checked={handSlowMotion}
            onChange={setHandSlowMotion}
          />
        </View>
      </AppCard>

      {/* CARD 2: Battlefield Drop Zones & Inventory */}
      <AppCard
        title="Battlefield Drop Zones & Inventory"
        subtitle="Magnetic drop slots with animated zoom/slide entrances, exits, and bidirectional token dragging."
        badge={`${pool.length} In Pool`}
        badgeTone="success"
      >
        <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>Drop Targets:</Text>
        <View style={styles.zonesRow}>
          {/* Slot A */}
          <Droppable
            id="slot-a"
            style={[
              styles.dropZone,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
            activeStyle={[
              styles.dropZoneActive,
              {
                borderColor: slotAColor,
                backgroundColor: `${slotAColor}18`,
                transform: [{ scale: slotMagnetism }],
              },
            ]}
            accessibilityLabel="Field Slot A target zone"
          >
            {({ isOver }) => (
              <View style={styles.zoneContent}>
                <Text style={[styles.zoneLabel, { color: isOver ? slotAColor : theme.muted }]}>
                  Slot A {isOver ? '★' : ''}
                </Text>
                {slotA ? (
                  <Animated.View
                    key={slotA.id}
                    entering={getEntranceAnimation(slotEntrance, slotSlowMotion)}
                    exiting={getExitAnimation(slotExit, slotSlowMotion)}
                    style={styles.placedTokenContainer}
                  >
                    <Draggable
                      id={slotA.id}
                      data={slotA}
                      kinetics={{
                        activeScale: 1.08,
                        maxVelocityTiltDeg: 10,
                        returnOnReject: true,
                      }}
                      accessibilityLabel={`Draggable ${slotA.name} in Slot A`}
                    >
                      {({ isDragging }) => (
                        <View
                          style={[
                            styles.placedToken,
                            {
                              backgroundColor: theme.surface,
                              borderColor: isDragging ? slotAColor : theme.border,
                              borderWidth: isDragging ? 2 : 1,
                            },
                          ]}
                        >
                          <Text style={styles.tokenSymbol}>{slotA.symbol}</Text>
                          <Text style={[styles.tokenName, { color: theme.color }]} numberOfLines={1}>
                            {slotA.name}
                          </Text>
                          <Pressable onPress={() => recallSlot('a')} hitSlop={8}>
                            <Text style={styles.recallBtn}>Recall</Text>
                          </Pressable>
                        </View>
                      )}
                    </Draggable>
                  </Animated.View>
                ) : (
                  <Animated.Text
                    key="empty-a"
                    entering={FadeIn.duration(180 * (slotSlowMotion ? 4 : 1))}
                    exiting={FadeOut.duration(120 * (slotSlowMotion ? 4 : 1))}
                    style={[styles.emptyHint, { color: theme.muted }]}
                  >
                    Empty
                  </Animated.Text>
                )}
              </View>
            )}
          </Droppable>

          {/* Slot B */}
          <Droppable
            id="slot-b"
            style={[
              styles.dropZone,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
            activeStyle={[
              styles.dropZoneActive,
              {
                borderColor: slotBColor,
                backgroundColor: `${slotBColor}18`,
                transform: [{ scale: slotMagnetism }],
              },
            ]}
            accessibilityLabel="Field Slot B target zone"
          >
            {({ isOver }) => (
              <View style={styles.zoneContent}>
                <Text style={[styles.zoneLabel, { color: isOver ? slotBColor : theme.muted }]}>
                  Slot B {isOver ? '★' : ''}
                </Text>
                {slotB ? (
                  <Animated.View
                    key={slotB.id}
                    entering={getEntranceAnimation(slotEntrance, slotSlowMotion)}
                    exiting={getExitAnimation(slotExit, slotSlowMotion)}
                    style={styles.placedTokenContainer}
                  >
                    <Draggable
                      id={slotB.id}
                      data={slotB}
                      kinetics={{
                        activeScale: 1.08,
                        maxVelocityTiltDeg: 10,
                        returnOnReject: true,
                      }}
                      accessibilityLabel={`Draggable ${slotB.name} in Slot B`}
                    >
                      {({ isDragging }) => (
                        <View
                          style={[
                            styles.placedToken,
                            {
                              backgroundColor: theme.surface,
                              borderColor: isDragging ? slotBColor : theme.border,
                              borderWidth: isDragging ? 2 : 1,
                            },
                          ]}
                        >
                          <Text style={styles.tokenSymbol}>{slotB.symbol}</Text>
                          <Text style={[styles.tokenName, { color: theme.color }]} numberOfLines={1}>
                            {slotB.name}
                          </Text>
                          <Pressable onPress={() => recallSlot('b')} hitSlop={8}>
                            <Text style={styles.recallBtn}>Recall</Text>
                          </Pressable>
                        </View>
                      )}
                    </Draggable>
                  </Animated.View>
                ) : (
                  <Animated.Text
                    key="empty-b"
                    entering={FadeIn.duration(180 * (slotSlowMotion ? 4 : 1))}
                    exiting={FadeOut.duration(120 * (slotSlowMotion ? 4 : 1))}
                    style={[styles.emptyHint, { color: theme.muted }]}
                  >
                    Empty
                  </Animated.Text>
                )}
              </View>
            )}
          </Droppable>

          {/* Trash Zone */}
          <Droppable
            id="trash-zone"
            style={[
              styles.dropZoneTrash,
              { backgroundColor: theme.surfaceAlt, borderColor: '#ef444455' },
            ]}
            activeStyle={[
              styles.dropZoneActive,
              {
                borderColor: '#ef4444',
                backgroundColor: '#ef444422',
                transform: [{ scale: slotMagnetism }],
              },
            ]}
            accessibilityLabel="Trash recycle zone"
          >
            {({ isOver }) => (
              <View style={styles.zoneContent}>
                <Text style={styles.trashSymbol}>🗑️</Text>
                <Text style={[styles.trashLabel, { color: isOver ? '#ef4444' : theme.muted }]}>
                  {isOver ? 'Recycle!' : 'Trash'}
                </Text>
              </View>
            )}
          </Droppable>
        </View>

        {/* Draggable Pool wrapped in Droppable to allow dragging slotted tokens back */}
        <Droppable
          id="inventory-pool"
          style={[
            styles.poolDroppable,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
          ]}
          activeStyle={[
            styles.poolDroppableActive,
            {
              borderColor: '#06b6d4',
              backgroundColor: '#06b6d418',
              transform: [{ scale: slotMagnetism }],
            },
          ]}
          accessibilityLabel="Inventory pool drop area"
        >
          {({ isOver }) => (
            <View style={styles.poolContent}>
              <View style={styles.poolHeaderRow}>
                <Text style={[styles.sectionSubtitle, { color: theme.muted, marginBottom: 0 }]}>
                  {isOver ? '★ Drop to Return to Inventory' : 'Draggable Inventory (Drag to slots above):'}
                </Text>
                <AppChip
                  tone={pool.length > 0 ? 'primary' : 'neutral'}
                  size="sm"
                  label={`${pool.length} items`}
                />
              </View>

              <View style={styles.poolRow}>
                {pool.map((item) => (
                  <Animated.View
                    key={item.id}
                    entering={FadeInDown.duration(240 * (slotSlowMotion ? 4 : 1)).springify().damping(16)}
                    exiting={FadeOut.duration(160 * (slotSlowMotion ? 4 : 1))}
                    layout={LinearTransition.springify().damping(18)}
                  >
                    <Draggable
                      id={item.id}
                      data={item}
                      kinetics={{
                        activeScale: 1.08,
                        maxVelocityTiltDeg: 12,
                        returnOnReject: true,
                      }}
                      accessibilityLabel={`Draggable ${item.name}`}
                    >
                      {({ isDragging }) => (
                        <View
                          style={[
                            styles.poolItem,
                            {
                              backgroundColor: theme.surface,
                              borderColor: isDragging ? item.accent : theme.border,
                              borderWidth: isDragging ? 2 : 1,
                            },
                          ]}
                        >
                          <Text style={styles.poolSymbol}>{item.symbol}</Text>
                          <Text style={[styles.poolName, { color: theme.color }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <AppChip
                            tone={item.category === 'Weapon' ? 'danger' : 'primary'}
                            size="sm"
                            label={item.category}
                          />
                        </View>
                      )}
                    </Draggable>
                  </Animated.View>
                ))}
                {pool.length === 0 && (
                  <View style={styles.allPlacedBox}>
                    <Text style={{ color: theme.muted }}>All items placed on field slots!</Text>
                    <Text style={{ color: theme.muted, fontSize: 11, marginTop: 2 }}>
                      Drag an item back here or to Trash to return it.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </Droppable>

        {/* In-Card Controls for Drop Zones */}
        <View style={styles.inCardControls}>
          <AppSegmentedControl
            label="Slot Entrance Animation"
            value={slotEntrance}
            onChange={(val) => setSlotEntrance(val as SlotEntranceMode)}
            options={[
              { value: 'zoom', label: 'Zoom In' },
              { value: 'slide', label: 'Slide Down' },
              { value: 'fade', label: 'Fade In' },
              { value: 'instant', label: 'Instant' },
            ]}
          />

          <AppSegmentedControl
            label="Slot Exit Animation"
            value={slotExit}
            onChange={(val) => setSlotExit(val as SlotExitMode)}
            options={[
              { value: 'zoom', label: 'Zoom Out' },
              { value: 'slide', label: 'Slide Up' },
              { value: 'fade', label: 'Fade Out' },
              { value: 'instant', label: 'Instant' },
            ]}
          />

          <AppSegmentedControl
            label="Magnetism Scale"
            value={slotMagnetism}
            onChange={(val) => setSlotMagnetism(val as 1.00 | 1.02 | 1.05)}
            options={[
              { value: 1.00, label: 'Flat (1.0x)' },
              { value: 1.02, label: 'Gentle (1.02x)' },
              { value: 1.05, label: 'Snappy (1.05x)' },
            ]}
          />

          <AppSegmentedControl
            label="Target Glow Palette"
            value={glowTone}
            onChange={(val) => setGlowTone(val as 'blue-purple' | 'emerald-amber')}
            options={[
              { value: 'blue-purple', label: 'Blue / Violet' },
              { value: 'emerald-amber', label: 'Emerald / Amber' },
            ]}
          />

          <AppSwitch
            label="Slow Motion (0.25x Speed)"
            subtitle="4x slower animation to inspect slot entrance, exit, and eviction transitions frame-by-frame"
            checked={slotSlowMotion}
            onChange={setSlotSlowMotion}
          />

          <View style={styles.poolFooter}>
            <AppButton variant="soft" size="sm" onPress={resetAll}>
              <Text style={{ color: theme.color, fontSize: 12 }}>Recall All & Reset</Text>
            </AppButton>
          </View>
        </View>
      </AppCard>

      {/* CARD 3: Freeform Drag & Kinetic Physics Sandbox */}
      <AppCard
        title="Freeform Drag & Micro-Physics"
        subtitle="Draggable tile with live coordinate tracking, optional boundary clamping, and configurable release physics."
      >
        <View
          style={[styles.sandboxArea, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            const halfW = Math.max(20, Math.floor((width - 120) / 2 - 12));
            const halfH = Math.max(16, Math.floor((height - 105) / 2 - 12));
            setSandboxBounds({
              minX: -halfW,
              maxX: halfW,
              minY: -halfH,
              maxY: halfH,
            });
          }}
        >
          <FreeformTile
            activeScale={activeScale}
            tiltDeg={tiltDeg}
            returnOnReject={returnReject}
            clampToBounds={clampToBounds}
            sandboxBounds={sandboxBounds}
            onCoordsChange={setLiveCoords}
            onResetRef={(fn) => {
              freeformResetRef.current = fn;
            }}
          />
        </View>

        {/* Live Coordinate Status Banner */}
        <View style={styles.sandboxStatsRow}>
          <AppChip
            tone={liveCoords.x !== 0 || liveCoords.y !== 0 ? 'primary' : 'neutral'}
            size="sm"
            label={`ΔX: ${liveCoords.x >= 0 ? `+${liveCoords.x}` : liveCoords.x}px  ΔY: ${liveCoords.y >= 0 ? `+${liveCoords.y}` : liveCoords.y}px`}
          />
          <AppChip
            tone={clampToBounds ? 'success' : 'neutral'}
            size="sm"
            label={clampToBounds ? 'Boundary: Clamped' : 'Boundary: Unclamped'}
          />
        </View>

        {/* In-Card Controls for Freeform Sandbox */}
        <View style={styles.inCardControls}>
          <AppSegmentedControl
            label="Release Physics"
            value={releasePhysics}
            onChange={(val) => setReleasePhysics(val as 'float' | 'snap')}
            options={[
              { value: 'float', label: 'Float in Place' },
              { value: 'snap', label: 'Spring Home' },
            ]}
          />

          <AppSwitch
            label="Clamp to Sandbox Bounds"
            subtitle="Restricts movement so the Mystic Orb stays strictly within the dashed area"
            checked={clampToBounds}
            onChange={setClampToBounds}
          />

          <AppSegmentedControl
            label="Velocity Tilt Angle"
            value={tiltMode}
            onChange={(val) => setTiltMode(val as 'off' | 'subtle' | 'dynamic')}
            options={[
              { value: 'off', label: 'Off (0°)' },
              { value: 'subtle', label: 'Subtle (6°)' },
              { value: 'dynamic', label: 'Dynamic (14°)' },
            ]}
          />

          <AppSegmentedControl
            label="Pickup Elevation Scale"
            value={scalePreset}
            onChange={(val) => setScalePreset(val as 'calm' | 'tactile' | 'pop')}
            options={[
              { value: 'calm', label: 'Calm (1.04x)' },
              { value: 'tactile', label: 'Tactile (1.08x)' },
              { value: 'pop', label: 'Pop (1.16x)' },
            ]}
          />

          <View style={styles.sandboxFooter}>
            <AppButton
              variant="soft"
              size="sm"
              onPress={() => freeformResetRef.current?.()}
            >
              <Text style={{ color: theme.color, fontSize: 12 }}>Reset Tile Position</Text>
            </AppButton>
          </View>
        </View>
      </AppCard>
    </ScrollView>
  );
}

export default function DndTest() {
  const [hand, setHand] = useState<CardItem[]>(INITIAL_HAND);
  const [slotA, setSlotA] = useState<PoolItem | null>(null);
  const [slotB, setSlotB] = useState<PoolItem | null>(null);
  const [pool, setPool] = useState<PoolItem[]>(INITIAL_POOL);
  const [lastAction, setLastAction] = useState<string>('Ready. Drag items or cards.');

  const handleGlobalDrop = useCallback(
    (event: DropEvent) => {
      const { draggableId, droppableId } = event;
      const allItems = [...pool, ...(slotA ? [slotA] : []), ...(slotB ? [slotB] : [])];
      const draggedItem = allItems.find((item) => item.id === draggableId);
      if (!draggedItem) return;

      const sourceSlot = slotA?.id === draggableId ? 'slot-a' : slotB?.id === draggableId ? 'slot-b' : 'pool';

      // Dropped back onto origin container
      if (sourceSlot === droppableId) return;

      if (droppableId === 'slot-a') {
        if (sourceSlot === 'pool') {
          setPool((prev) => {
            const next = prev.filter((p) => p.id !== draggedItem.id);
            if (slotA && slotA.id !== draggedItem.id) {
              next.push(slotA);
            }
            return next;
          });
          setSlotA(draggedItem);
          setLastAction(`Assigned ${draggedItem.name} to Field Slot A`);
        } else if (sourceSlot === 'slot-b') {
          // Swap or move from Slot B to Slot A
          setSlotB(slotA);
          setSlotA(draggedItem);
          setLastAction(
            slotA
              ? `Swapped ${draggedItem.name} (Slot B) with ${slotA.name} (Slot A)`
              : `Moved ${draggedItem.name} from Slot B to Slot A`,
          );
        }
      } else if (droppableId === 'slot-b') {
        if (sourceSlot === 'pool') {
          setPool((prev) => {
            const next = prev.filter((p) => p.id !== draggedItem.id);
            if (slotB && slotB.id !== draggedItem.id) {
              next.push(slotB);
            }
            return next;
          });
          setSlotB(draggedItem);
          setLastAction(`Assigned ${draggedItem.name} to Field Slot B`);
        } else if (sourceSlot === 'slot-a') {
          // Swap or move from Slot A to Slot B
          setSlotA(slotB);
          setSlotB(draggedItem);
          setLastAction(
            slotB
              ? `Swapped ${draggedItem.name} (Slot A) with ${slotB.name} (Slot B)`
              : `Moved ${draggedItem.name} from Slot A to Slot B`,
          );
        }
      } else if (droppableId === 'trash-zone') {
        if (sourceSlot === 'slot-a') {
          setSlotA(null);
          setPool((prev) => (prev.some((p) => p.id === draggedItem.id) ? prev : [...prev, draggedItem]));
          setLastAction(`Recycled ${draggedItem.name} from Slot A back to inventory`);
        } else if (sourceSlot === 'slot-b') {
          setSlotB(null);
          setPool((prev) => (prev.some((p) => p.id === draggedItem.id) ? prev : [...prev, draggedItem]));
          setLastAction(`Recycled ${draggedItem.name} from Slot B back to inventory`);
        } else {
          setLastAction(`Recycled ${draggedItem.name} (already in inventory)`);
        }
      } else if (droppableId === 'inventory-pool') {
        if (sourceSlot === 'slot-a') {
          setSlotA(null);
          setPool((prev) => (prev.some((p) => p.id === draggedItem.id) ? prev : [...prev, draggedItem]));
          setLastAction(`Returned ${draggedItem.name} from Slot A to inventory pool`);
        } else if (sourceSlot === 'slot-b') {
          setSlotB(null);
          setPool((prev) => (prev.some((p) => p.id === draggedItem.id) ? prev : [...prev, draggedItem]));
          setLastAction(`Returned ${draggedItem.name} from Slot B to inventory pool`);
        }
      }
    },
    [pool, slotA, slotB],
  );

  const recallSlot = useCallback(
    (slot: 'a' | 'b') => {
      if (slot === 'a' && slotA) {
        setPool((prev) => [...prev, slotA]);
        setSlotA(null);
        setLastAction(`Recalled ${slotA.name} to inventory`);
      } else if (slot === 'b' && slotB) {
        setPool((prev) => [...prev, slotB]);
        setSlotB(null);
        setLastAction(`Recalled ${slotB.name} to inventory`);
      }
    },
    [slotA, slotB],
  );

  const resetAll = useCallback(() => {
    setHand(INITIAL_HAND);
    setSlotA(null);
    setSlotB(null);
    setPool(INITIAL_POOL);
    setLastAction('Reset test harness to initial state.');
  }, []);

  return (
    <DndProvider onDrop={handleGlobalDrop}>
      <DndTestContent
        hand={hand}
        setHand={setHand}
        pool={pool}
        setPool={setPool}
        slotA={slotA}
        slotB={slotB}
        recallSlot={recallSlot}
        resetAll={resetAll}
        lastAction={lastAction}
      />
    </DndProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 6,
    paddingTop: 4,
  },
  statusBar: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  handContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    overflow: 'visible',
  },
  sortableContainer: {
    justifyContent: 'center',
  },
  cardItem: {
    borderRadius: 12,
    padding: 8,
    height: 104,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  energyBadge: {
    alignSelf: 'flex-start',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  cardSymbol: {
    fontSize: 26,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardPos: {
    fontSize: 10,
  },
  inCardControls: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#8883',
    gap: 12,
  },
  handFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderSummary: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  zonesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropZone: {
    flex: 1,
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    overflow: 'visible',
  },
  dropZoneTrash: {
    width: 76,
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    overflow: 'visible',
  },
  dropZoneActive: {
    borderStyle: 'solid',
  },
  zoneContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  zoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  placedTokenContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placedToken: {
    width: 86,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  tokenSymbol: {
    fontSize: 22,
  },
  tokenName: {
    fontSize: 11,
    fontWeight: '600',
  },
  recallBtn: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 2,
  },
  trashSymbol: {
    fontSize: 26,
  },
  trashLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  poolDroppable: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 12,
    marginTop: 14,
    overflow: 'visible',
  },
  poolDroppableActive: {
    borderStyle: 'solid',
  },
  poolContent: {
    width: '100%',
    gap: 8,
  },
  poolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  poolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 100,
  },
  poolItem: {
    width: 98,
    minHeight: 96,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  poolSymbol: {
    fontSize: 24,
  },
  poolName: {
    fontSize: 11,
    fontWeight: '600',
  },
  allPlacedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  poolFooter: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  sandboxArea: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 20,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sandboxStatsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  freeformTile: {
    width: 120,
    height: 105,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  freeformSymbol: {
    fontSize: 28,
  },
  freeformTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  sandboxFooter: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
});
