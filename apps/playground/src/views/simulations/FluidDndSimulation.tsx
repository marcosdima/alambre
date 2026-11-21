import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  LinearTransition,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import {
  DndProvider,
  Draggable,
  Droppable,
  type DropEvent,
} from 'alambre';
import {
  AppTitle,
  AppText,
  AppCard,
  AppButton,
  AppBadge,
} from 'alambre/ui';
import { useLightDark } from '../../providers/theme';
import { TestStage } from '../../components/test-utils';

interface InventoryItem {
  id: string;
  name: string;
  symbol: string;
  category: 'Weapon' | 'Relic' | 'Armor' | 'Catalyst';
  rarityColor: string;
  power: number;
}

const INITIAL_HOTBAR: InventoryItem[] = [
  { id: 'item_blade', name: 'Plasma Blade', symbol: '⚔️', category: 'Weapon', rarityColor: '#ef4444', power: 85 },
  { id: 'item_shield', name: 'Chrono Shield', symbol: '🛡️', category: 'Armor', rarityColor: '#3b82f6', power: 70 },
];

const INITIAL_VAULT: InventoryItem[] = [
  { id: 'item_compass', name: 'Quantum Compass', symbol: '🧭', category: 'Relic', rarityColor: '#10b981', power: 60 },
  { id: 'item_gem', name: 'Aether Gem', symbol: '💎', category: 'Relic', rarityColor: '#8b5cf6', power: 95 },
  { id: 'item_ring', name: 'Vortex Ring', symbol: '💍', category: 'Relic', rarityColor: '#f59e0b', power: 50 },
  { id: 'item_catalyst', name: 'Nova Core', symbol: '🔮', category: 'Catalyst', rarityColor: '#ec4899', power: 90 },
];

const ITEM_SPRING_TRANSITION = LinearTransition.springify().damping(18).stiffness(220);

export default function FluidDndSimulation() {
  const { theme } = useLightDark();

  const [hotbar, setHotbar] = useState<InventoryItem[]>(() => [...INITIAL_HOTBAR]);
  const [vault, setVault] = useState<InventoryItem[]>(() => [...INITIAL_VAULT]);
  const [disenchantedCount, setDisenchantedCount] = useState(0);

  const [telemetry, setTelemetry] = useState({
    activeDragItem: null as string | null,
    lastAction: 'Ready' as string,
  });

  const forgeScale = useSharedValue(1);

  const handleDrop = (event: DropEvent) => {
    const { draggableId, droppableId } = event;
    const foundInHotbar = hotbar.find((i) => i.id === draggableId);
    const foundInVault = vault.find((i) => i.id === draggableId);
    const item = foundInHotbar || foundInVault;

    if (!item) return;

    if (droppableId === 'hotbar-zone') {
      if (foundInHotbar) {
        setTelemetry((prev) => ({ ...prev, lastAction: `${item.name} already in Hotbar` }));
        return;
      }
      setVault((v) => v.filter((i) => i.id !== draggableId));
      setHotbar((h) => [...h, item]);
      setTelemetry((prev) => ({ ...prev, lastAction: `Equipped ${item.name} to Hotbar` }));
    } else if (droppableId === 'vault-zone') {
      if (foundInVault) {
        setTelemetry((prev) => ({ ...prev, lastAction: `${item.name} already in Vault` }));
        return;
      }
      setHotbar((h) => h.filter((i) => i.id !== draggableId));
      setVault((v) => [...v, item]);
      setTelemetry((prev) => ({ ...prev, lastAction: `Stashed ${item.name} in Vault` }));
    } else if (droppableId === 'forge-zone') {
      setHotbar((h) => h.filter((i) => i.id !== draggableId));
      setVault((v) => v.filter((i) => i.id !== draggableId));
      setDisenchantedCount((c) => c + 1);
      forgeScale.value = withSpring(1.25, { damping: 10, stiffness: 300 }, () => {
        forgeScale.value = withSpring(1, { damping: 14 });
      });
      setTelemetry((prev) => ({ ...prev, lastAction: `🔥 Recycled ${item.name} for +${item.power} essence!` }));
    }
  };

  const forgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: forgeScale.value }],
  }));

  const handleReset = () => {
    setHotbar([...INITIAL_HOTBAR]);
    setVault([...INITIAL_VAULT]);
    setDisenchantedCount(0);
    setTelemetry({
      activeDragItem: null,
      lastAction: 'Inventory reset to defaults',
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <AppTitle level={2}>Fluid Drag & Drop Transfers</AppTitle>
          <AppBadge tone="primary" variant="soft" size="md">
            MULTI-ZONE DND
          </AppBadge>
        </View>
        <AppText variant="muted">
          Cross-container item transfers with velocity tilt physics, dynamic elevation lift,
          droppable hover glow, and smooth physical layout transitions.
        </AppText>
      </View>

      <DndProvider onDrop={handleDrop}>
        <TestStage
          title="Interactive Equipment & Storage Deck"
          badge={{
            label: telemetry.activeDragItem ? `Dragging: ${telemetry.activeDragItem}` : 'Idle',
            tone: telemetry.activeDragItem ? 'warning' : 'neutral',
          }}
          arenaHeight={400}
          onReset={handleReset}
          resetLabel="Reset Deck"
        >
          <View style={styles.deckContent}>
            {/* Top Zone: Equipped Hotbar */}
            <Droppable id="hotbar-zone">
              {({ isOver }) => (
                <View
                  style={[
                    styles.zoneBox,
                    {
                      borderColor: isOver ? theme.primary : theme.border,
                      backgroundColor: isOver ? theme.primarySoft : theme.surface,
                    },
                  ]}
                >
                  <View style={styles.zoneHeader}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>
                      ⚡ Equipped Hotbar ({hotbar.length})
                    </AppText>
                    <AppBadge tone="primary" size="sm">
                      SLOTS
                    </AppBadge>
                  </View>

                  <View style={styles.itemsRow}>
                    {hotbar.map((item) => (
                      <Animated.View
                        key={item.id}
                        layout={ITEM_SPRING_TRANSITION}
                        entering={FadeIn.duration(200).springify()}
                        exiting={FadeOut.duration(150)}
                      >
                        <Draggable
                          id={item.id}
                          data={item}
                          onDragStart={() => {
                            setTelemetry((prev) => ({
                              ...prev,
                              activeDragItem: item.name,
                              lastAction: `Picked up ${item.name}`,
                            }));
                          }}
                          kinetics={{
                            activeScale: 1.08,
                            maxVelocityTiltDeg: 14,
                            springStiffness: 260,
                            springDamping: 22,
                          }}
                        >
                          {({ isDragging }) => (
                            <View
                              style={[
                                styles.itemTile,
                                {
                                  backgroundColor: theme.surfaceAlt,
                                  borderColor: isDragging ? theme.primary : item.rarityColor,
                                  opacity: isDragging ? 0.8 : 1,
                                },
                              ]}
                            >
                              <AppText style={{ fontSize: 20 }}>{item.symbol}</AppText>
                              <AppText style={{ fontSize: 11, fontWeight: '700', color: theme.color }}>
                                {item.name}
                              </AppText>
                            </View>
                          )}
                        </Draggable>
                      </Animated.View>
                    ))}
                    {hotbar.length === 0 && (
                      <AppText variant="muted" style={styles.emptyPrompt}>
                        Drag an item here to equip
                      </AppText>
                    )}
                  </View>
                </View>
              )}
            </Droppable>

            {/* Middle Zone: Storage Vault */}
            <Droppable id="vault-zone">
              {({ isOver }) => (
                <View
                  style={[
                    styles.zoneBox,
                    {
                      borderColor: isOver ? theme.secondary : theme.border,
                      backgroundColor: isOver ? theme.secondarySoft : theme.surface,
                    },
                  ]}
                >
                  <View style={styles.zoneHeader}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>
                      📦 Storage Vault ({vault.length})
                    </AppText>
                    <AppBadge tone="neutral" size="sm">
                      BACKPACK
                    </AppBadge>
                  </View>

                  <View style={styles.itemsGrid}>
                    {vault.map((item) => (
                      <Animated.View
                        key={item.id}
                        layout={ITEM_SPRING_TRANSITION}
                        entering={FadeIn.duration(200).springify()}
                        exiting={FadeOut.duration(150)}
                      >
                        <Draggable
                          id={item.id}
                          data={item}
                          onDragStart={() => {
                            setTelemetry((prev) => ({
                              ...prev,
                              activeDragItem: item.name,
                              lastAction: `Picked up ${item.name}`,
                            }));
                          }}
                          kinetics={{
                            activeScale: 1.08,
                            maxVelocityTiltDeg: 14,
                            springStiffness: 260,
                            springDamping: 22,
                          }}
                        >
                          {({ isDragging }) => (
                            <View
                              style={[
                                styles.itemTile,
                                {
                                  backgroundColor: theme.surfaceAlt,
                                  borderColor: isDragging ? theme.secondary : item.rarityColor,
                                  opacity: isDragging ? 0.8 : 1,
                                },
                              ]}
                            >
                              <AppText style={{ fontSize: 20 }}>{item.symbol}</AppText>
                              <AppText style={{ fontSize: 11, fontWeight: '700', color: theme.color }}>
                                {item.name}
                              </AppText>
                            </View>
                          )}
                        </Draggable>
                      </Animated.View>
                    ))}
                    {vault.length === 0 && (
                      <AppText variant="muted" style={styles.emptyPrompt}>
                        Vault is empty
                      </AppText>
                    )}
                  </View>
                </View>
              )}
            </Droppable>

            {/* Bottom Special Zone: Forge Recycler */}
            <Droppable id="forge-zone">
              {({ isOver }) => (
                <Animated.View
                  style={[
                    styles.forgeZone,
                    forgeAnimatedStyle,
                    {
                      borderColor: isOver ? theme.danger : theme.border,
                      backgroundColor: isOver ? theme.dangerSoft : theme.surfaceAlt,
                    },
                  ]}
                >
                  <AppText style={{ fontSize: 20 }}>🔥</AppText>
                  <AppText variant="body" style={{ fontWeight: '700', color: isOver ? theme.danger : theme.muted }}>
                    Recycler Forge (Drop here to dismantle)
                  </AppText>
                  {disenchantedCount > 0 && (
                    <AppBadge tone="danger" size="sm">
                      {disenchantedCount} Recycled
                    </AppBadge>
                  )}
                </Animated.View>
              )}
            </Droppable>
          </View>
        </TestStage>
      </DndProvider>

      {/* Action Telemetry Log */}
      <AppCard variant="outlined" style={[styles.logCard, { borderColor: theme.border }]}>
        <AppTitle level={3}>Kinetics Event Telemetry</AppTitle>
        <View style={styles.logRow}>
          <AppText variant="muted">Last Kinetic Event:</AppText>
          <AppText style={{ fontWeight: '600', color: theme.primary }}>{telemetry.lastAction}</AppText>
        </View>
      </AppCard>

      {/* Control Buttons */}
      <View style={styles.actionRow}>
        <AppButton variant="outline" tone="neutral" onPress={handleReset}>
          Reset Inventory Deck
        </AppButton>
      </View>
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
  deckContent: {
    flex: 1,
    padding: 10,
    gap: 10,
  },
  zoneBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    gap: 8,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 52,
    alignItems: 'center',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 52,
    alignItems: 'center',
  },
  itemTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    minWidth: 100,
  },
  forgeZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyPrompt: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  logCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
