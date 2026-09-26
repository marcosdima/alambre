import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
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

type FreeformTileProps = {
  activeScale: number;
  tiltDeg: number;
  returnOnReject: boolean;
  onResetRef: (resetFn: () => void) => void;
};

function FreeformTile({
  activeScale,
  tiltDeg,
  returnOnReject,
  onResetRef,
}: FreeformTileProps) {
  const { theme } = useLightDark();
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
    },
  });

  const { activeDrag } = useDnd();
  const isDragging = activeDrag?.id === 'freeform-tile';

  useEffect(() => {
    onResetRef(resetPosition);
  }, [onResetRef, resetPosition]);

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
  const [handGap, setHandGap] = useState<4 | 8 | 14>(8);
  const [handPhysics, setHandPhysics] = useState<'snappy' | 'smooth' | 'bouncy'>('snappy');
  const [handScale, setHandScale] = useState<1.05 | 1.10 | 1.18>(1.10);

  const handDamping = handPhysics === 'snappy' ? 28 : handPhysics === 'smooth' ? 20 : 14;
  const handStiffness = handPhysics === 'snappy' ? 300 : handPhysics === 'smooth' ? 200 : 150;

  // Card 2 Controls (Drop Zones)
  const [glowTone, setGlowTone] = useState<'blue-purple' | 'emerald-amber'>('blue-purple');
  const slotAColor = glowTone === 'blue-purple' ? '#3b82f6' : '#10b981';
  const slotBColor = glowTone === 'blue-purple' ? '#8b5cf6' : '#f59e0b';

  // Card 3 Controls (Freeform & Physics)
  const [tiltMode, setTiltMode] = useState<'off' | 'subtle' | 'dynamic'>('dynamic');
  const [scalePreset, setScalePreset] = useState<'calm' | 'tactile' | 'pop'>('tactile');
  const [returnReject, setReturnReject] = useState(false);
  const tiltDeg = tiltMode === 'off' ? 0 : tiltMode === 'subtle' ? 6 : 14;
  const activeScale = scalePreset === 'calm' ? 1.04 : scalePreset === 'tactile' ? 1.08 : 1.16;

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
        subtitle="Real-time reactive gap opening: drag cards horizontally to reorder slots with smooth physics."
        badge={`${hand.length} Cards`}
        badgeTone="primary"
      >
        <View style={styles.handContainer}>
          <SortableRow
            items={hand}
            onReorder={setHand}
            itemWidth={68}
            gap={handGap}
            springDamping={handDamping}
            springStiffness={handStiffness}
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
              { value: 'seamless', label: 'Seamless' },
              { value: 'bounce', label: 'Elastic' },
              { value: 'impact', label: 'Impact' },
              { value: 'instant', label: 'Instant' },
            ]}
          />

          <AppSwitch
            label="Slow Motion (0.25x Speed)"
            subtitle="4x slower animation to inspect drop physics and slot transitions frame-by-frame"
            checked={handSlowMotion}
            onChange={setHandSlowMotion}
          />

          <AppSegmentedControl
            label="Neighbor Shift Glide"
            value={handPhysics}
            onChange={(val) => setHandPhysics(val as 'snappy' | 'smooth' | 'bouncy')}
            options={[
              { value: 'snappy', label: 'Snappy' },
              { value: 'smooth', label: 'Smooth' },
              { value: 'bouncy', label: 'Bouncy' },
            ]}
          />

          <AppSegmentedControl
            label="Pickup Elevation Scale"
            value={handScale}
            onChange={(val) => setHandScale(val as 1.05 | 1.10 | 1.18)}
            options={[
              { value: 1.05, label: 'Calm (1.05x)' },
              { value: 1.10, label: 'Tactile (1.10x)' },
              { value: 1.18, label: 'Pop (1.18x)' },
            ]}
          />

          <AppSegmentedControl
            label="Card Spacing"
            value={handGap}
            onChange={(val) => setHandGap(val as 4 | 8 | 14)}
            options={[
              { value: 4, label: 'Compact (4px)' },
              { value: 8, label: 'Normal (8px)' },
              { value: 14, label: 'Relaxed (14px)' },
            ]}
          />
        </View>
      </AppCard>

      {/* CARD 2: Battlefield Drop Zones & Inventory */}
      <AppCard
        title="Battlefield Drop Zones & Inventory"
        subtitle="Magnetic drop slots with animated zoom entrances, exits, and layout transitions."
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
              { borderColor: slotAColor, backgroundColor: `${slotAColor}18` },
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
                    entering={ZoomIn.duration(220).springify().damping(16)}
                    exiting={ZoomOut.duration(160)}
                    style={styles.placedToken}
                  >
                    <Text style={styles.tokenSymbol}>{slotA.symbol}</Text>
                    <Text style={[styles.tokenName, { color: theme.color }]} numberOfLines={1}>
                      {slotA.name}
                    </Text>
                    <Pressable onPress={() => recallSlot('a')} hitSlop={8}>
                      <Text style={styles.recallBtn}>Recall</Text>
                    </Pressable>
                  </Animated.View>
                ) : (
                  <Animated.Text
                    entering={FadeIn.duration(180)}
                    exiting={FadeOut.duration(120)}
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
              { borderColor: slotBColor, backgroundColor: `${slotBColor}18` },
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
                    entering={ZoomIn.duration(220).springify().damping(16)}
                    exiting={ZoomOut.duration(160)}
                    style={styles.placedToken}
                  >
                    <Text style={styles.tokenSymbol}>{slotB.symbol}</Text>
                    <Text style={[styles.tokenName, { color: theme.color }]} numberOfLines={1}>
                      {slotB.name}
                    </Text>
                    <Pressable onPress={() => recallSlot('b')} hitSlop={8}>
                      <Text style={styles.recallBtn}>Recall</Text>
                    </Pressable>
                  </Animated.View>
                ) : (
                  <Animated.Text
                    entering={FadeIn.duration(180)}
                    exiting={FadeOut.duration(120)}
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
            activeStyle={[styles.dropZoneActive, { borderColor: '#ef4444', backgroundColor: '#ef444422' }]}
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

        {/* Draggable Pool */}
        <Text style={[styles.sectionSubtitle, { color: theme.muted, marginTop: 16 }]}>
          Draggable Items (Drag into slots above):
        </Text>
        <View style={styles.poolRow}>
          {pool.map((item) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.duration(240).springify().damping(16)}
              exiting={FadeOut.duration(160)}
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
            </View>
          )}
        </View>

        {/* In-Card Controls for Drop Zones */}
        <View style={styles.inCardControls}>
          <AppSegmentedControl
            label="Target Glow Palette"
            value={glowTone}
            onChange={(val) => setGlowTone(val as 'blue-purple' | 'emerald-amber')}
            options={[
              { value: 'blue-purple', label: 'Blue / Violet' },
              { value: 'emerald-amber', label: 'Emerald / Amber' },
            ]}
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
        subtitle="Draggable tile that preserves its drop position and continues dragging seamlessly without snapping back."
      >
        <View style={[styles.sandboxArea, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <FreeformTile
            activeScale={activeScale}
            tiltDeg={tiltDeg}
            returnOnReject={returnReject}
            onResetRef={(fn) => {
              freeformResetRef.current = fn;
            }}
          />
        </View>

        {/* In-Card Controls for Freeform Sandbox */}
        <View style={styles.inCardControls}>
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

          <AppSwitch
            label="Return on Reject"
            subtitle="If disabled, item stays where dropped and continues dragging seamlessly"
            checked={returnReject}
            onChange={setReturnReject}
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
      const draggedItem = pool.find((item) => item.id === draggableId);
      if (!draggedItem) return;

      if (droppableId === 'slot-a') {
        setPool((prev) => {
          const next = prev.filter((p) => p.id !== draggedItem.id);
          if (slotA && slotA.id !== draggedItem.id) {
            next.push(slotA);
          }
          return next;
        });
        setSlotA(draggedItem);
        setLastAction(`Assigned ${draggedItem.name} to Field Slot A`);
      } else if (droppableId === 'slot-b') {
        setPool((prev) => {
          const next = prev.filter((p) => p.id !== draggedItem.id);
          if (slotB && slotB.id !== draggedItem.id) {
            next.push(slotB);
          }
          return next;
        });
        setSlotB(draggedItem);
        setLastAction(`Assigned ${draggedItem.name} to Field Slot B`);
      } else if (droppableId === 'trash-zone') {
        setPool((prev) => (prev.some((p) => p.id === draggedItem.id) ? prev : [...prev, draggedItem]));
        setLastAction(`Recycled ${draggedItem.name} back to inventory`);
      }
    },
    [pool, slotA, slotB],
  );

  const recallSlot = useCallback((slot: 'a' | 'b') => {
    if (slot === 'a' && slotA) {
      setPool((prev) => [...prev, slotA]);
      setSlotA(null);
      setLastAction(`Recalled ${slotA.name} to inventory`);
    } else if (slot === 'b' && slotB) {
      setPool((prev) => [...prev, slotB]);
      setSlotB(null);
      setLastAction(`Recalled ${slotB.name} to inventory`);
    }
  }, [slotA, slotB]);

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
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  dropZoneTrash: {
    width: 76,
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  dropZoneActive: {
    borderStyle: 'solid',
    transform: [{ scale: 1.03 }],
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
  placedToken: {
    alignItems: 'center',
    gap: 2,
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
