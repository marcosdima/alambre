import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigator } from 'alambre';
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
  const { navigate } = useNavigator();
  const { activeDrag, hoveredZoneId, measureAllDroppables } = useDnd();

  // Kinetics config state
  const [tiltMode, setTiltMode] = useState<'off' | 'subtle' | 'dynamic'>('dynamic');
  const [returnReject, setReturnReject] = useState(true);
  const [scalePreset, setScalePreset] = useState<'calm' | 'tactile' | 'exaggerated'>('tactile');

  const tiltDeg = tiltMode === 'off' ? 0 : tiltMode === 'subtle' ? 6 : 14;
  const activeScale = scalePreset === 'calm' ? 1.04 : scalePreset === 'tactile' ? 1.08 : 1.15;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      scrollEnabled={!activeDrag}
      onScrollEndDrag={measureAllDroppables}
      onMomentumScrollEnd={measureAllDroppables}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <AppButton variant="soft" size="sm" onPress={() => navigate('home')}>
          <Text style={{ color: theme.color }}>‹ Back to Home</Text>
        </AppButton>
        <AppTitle level={1}>Drag & Drop Engine</AppTitle>
        <AppText variant="muted">Tactile micro-physics, card-ready sorting, and magnetic drop zones</AppText>
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

      {/* 1. Sortable Hand */}
      <AppCard
        title="Card Hand / Sortable Reorder"
        subtitle="Drag cards horizontally to reorder slots. Supports TalkBack actions."
        badge={`${hand.length} Cards`}
        badgeTone="primary"
      >
        <View style={styles.handContainer}>
          <SortableRow
            items={hand}
            onReorder={setHand}
            itemWidth={68}
            gap={6}
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
        <View style={styles.handFooter}>
          <Text style={[styles.orderSummary, { color: theme.muted }]}>
            Order: {hand.map((c) => c.symbol).join(' ')}
          </Text>
          <AppButton variant="soft" size="sm" onPress={() => setHand(INITIAL_HAND)}>
            <Text style={{ color: theme.color, fontSize: 12 }}>Reset Hand</Text>
          </AppButton>
        </View>
      </AppCard>

      {/* 2. Target Drop Zones & Inventory */}
      <AppCard
        title="Battlefield Drop Zones & Inventory"
        subtitle="Drag tokens from the pool into active field zones or recycle to discard."
        badge={`${pool.length} In Pool`}
        badgeTone="success"
      >
        {/* Field Drop Zones */}
        <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>Drop Targets:</Text>
        <View style={styles.zonesRow}>
          {/* Slot A */}
          <Droppable
            id="slot-a"
            style={[
              styles.dropZone,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
            activeStyle={[styles.dropZoneActive, { borderColor: '#3b82f6', backgroundColor: '#3b82f618' }]}
            accessibilityLabel="Field Slot A target zone"
          >
            {({ isOver }) => (
              <View style={styles.zoneContent}>
                <Text style={[styles.zoneLabel, { color: isOver ? '#3b82f6' : theme.muted }]}>
                  Slot A {isOver ? '★' : ''}
                </Text>
                {slotA ? (
                  <View style={styles.placedToken}>
                    <Text style={styles.tokenSymbol}>{slotA.symbol}</Text>
                    <Text style={[styles.tokenName, { color: theme.color }]} numberOfLines={1}>
                      {slotA.name}
                    </Text>
                    <Pressable onPress={() => recallSlot('a')} hitSlop={8}>
                      <Text style={styles.recallBtn}>Recall</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={[styles.emptyHint, { color: theme.muted }]}>Empty</Text>
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
            activeStyle={[styles.dropZoneActive, { borderColor: '#8b5cf6', backgroundColor: '#8b5cf618' }]}
            accessibilityLabel="Field Slot B target zone"
          >
            {({ isOver }) => (
              <View style={styles.zoneContent}>
                <Text style={[styles.zoneLabel, { color: isOver ? '#8b5cf6' : theme.muted }]}>
                  Slot B {isOver ? '★' : ''}
                </Text>
                {slotB ? (
                  <View style={styles.placedToken}>
                    <Text style={styles.tokenSymbol}>{slotB.symbol}</Text>
                    <Text style={[styles.tokenName, { color: theme.color }]} numberOfLines={1}>
                      {slotB.name}
                    </Text>
                    <Pressable onPress={() => recallSlot('b')} hitSlop={8}>
                      <Text style={styles.recallBtn}>Recall</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={[styles.emptyHint, { color: theme.muted }]}>Empty</Text>
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
                  {isOver ? 'Release!' : 'Trash'}
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
            <Draggable
              key={item.id}
              id={item.id}
              data={item}
              kinetics={{
                activeScale,
                maxVelocityTiltDeg: tiltDeg,
                returnOnReject: returnReject,
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
          ))}
          {pool.length === 0 && (
            <View style={styles.allPlacedBox}>
              <Text style={{ color: theme.muted }}>All items placed in field slots!</Text>
              <AppButton variant="soft" size="sm" onPress={resetAll}>
                <Text style={{ color: theme.color, fontSize: 12 }}>Reset All</Text>
              </AppButton>
            </View>
          )}
        </View>
      </AppCard>

      {/* 3. Physics & Kinetics Controls */}
      <AppCard
        title="Kinetic Micro-Physics"
        subtitle="Fine-tune velocity tilt degrees, pickup scale, and return snap behavior."
      >
        <View style={styles.kineticsControls}>
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
            onChange={(val) => setScalePreset(val as 'calm' | 'tactile' | 'exaggerated')}
            options={[
              { value: 'calm', label: 'Calm (1.04x)' },
              { value: 'tactile', label: 'Tactile (1.08x)' },
              { value: 'exaggerated', label: 'Pop (1.15x)' },
            ]}
          />

          <AppSwitch
            label="Return on Reject"
            subtitle="Elastic spring return to origin if released outside drop target"
            checked={returnReject}
            onChange={setReturnReject}
          />
        </View>
      </AppCard>

      {/* 4. Architecture / Specs Info */}
      <AppCard variant="soft" padding="md">
        <AppTitle level={3}>Framework Architecture</AppTitle>
        <AppText variant="muted" style={{ marginTop: 4 }}>
          • Absolute touch coordinate collision math (zero drift on scroll or nesting).{'\n'}
          • 60fps Reanimated worklets for velocity-driven rotational tilt.{'\n'}
          • TalkBack / VoiceOver single-node accessibility actions (moveLeft, moveRight).{'\n'}
          • Pure React Native Gesture Handler Pan gestures with zero native bridge overhead.
        </AppText>
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
  handFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#8883',
  },
  orderSummary: {
    fontSize: 13,
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
    gap: 8,
    paddingVertical: 12,
  },
  kineticsControls: {
    gap: 14,
  },
});
