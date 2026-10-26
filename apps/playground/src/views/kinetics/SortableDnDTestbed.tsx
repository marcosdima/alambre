import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLightDark } from '../../providers/theme';
import {
  AppTitle,
  AppText,
  AppCard,
  AppButton,
  AppBadge,
  AppSwitch,
} from 'alambre/ui';
import { SortableList, SortableGrid, type SortableItem } from 'alambre';

interface TaskItem extends SortableItem {
  title: string;
  category: string;
  color: string;
}

export default function SortableDnDTestbed() {
  const { theme } = useLightDark();
  const [mode, setMode] = useState<'list' | 'grid'>('list');
  const [slowMotion, setSlowMotion] = useState(false);

  const [items, setItems] = useState<TaskItem[]>([
    { id: 'item_1', title: 'Tactile Gesture Engine', category: 'Kinetics', color: '#6366f1' },
    { id: 'item_2', title: 'Single-Clock Skeleton', category: 'UI', color: '#10b981' },
    { id: 'item_3', title: 'Fog-of-War Projection', category: 'Relay', color: '#f59e0b' },
    { id: 'item_4', title: 'Optimistic Hand Engine', category: 'Multiplayer', color: '#ec4899' },
    { id: 'item_5', title: 'Deterministic Host Migration', category: 'Relay', color: '#3b82f6' },
    { id: 'item_6', title: 'Sensory Haptic Midpoint', category: 'Kinetics', color: '#8b5cf6' },
  ]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.controlPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={2}>Sortable Drag & Drop</AppTitle>
        <AppText variant="muted">
          1D vertical list & 2D multi-column grid reordering with velocity tilt and fluid slot physics.
        </AppText>

        <View style={styles.controlsRow}>
          <AppButton
            size="sm"
            variant="outline"
            onPress={() => setMode((m) => (m === 'list' ? 'grid' : 'list'))}
          >
            Switch to {mode === 'list' ? '2D Grid' : '1D List'}
          </AppButton>

          <View style={styles.switchGroup}>
            <AppText variant="body">Slow Motion (4x)</AppText>
            <AppSwitch checked={slowMotion} onChange={setSlowMotion} />
          </View>
        </View>
      </View>

      <View style={styles.testbedArea}>
        {mode === 'list' ? (
          <SortableList
            items={items}
            onReorder={setItems}
            itemHeight={68}
            gap={10}
            slowMotion={slowMotion}
            dragTiltDeg={4}
            renderItem={(item, _idx, isDragging) => (
              <AppCard
                variant={isDragging ? 'elevated' : 'outlined'}
                style={[
                  styles.listItemCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isDragging ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={[styles.colorBar, { backgroundColor: item.color }]} />
                <View style={styles.itemMeta}>
                  <AppText variant="subtitle" style={{ fontWeight: '600' }}>
                    {item.title}
                  </AppText>
                  <AppText variant="muted">{item.category}</AppText>
                </View>
                <AppBadge tone="neutral" size="sm">
                  ☰ DRAG
                </AppBadge>
              </AppCard>
            )}
          />
        ) : (
          <View style={styles.gridWrapper}>
            <SortableGrid
              items={items}
              onReorder={setItems}
              numColumns={3}
              itemWidth={104}
              itemHeight={104}
              gap={10}
              slowMotion={slowMotion}
              dragTiltDeg={8}
              renderItem={(item, _idx, isDragging) => (
                <AppCard
                  variant={isDragging ? 'elevated' : 'outlined'}
                  style={[
                    styles.gridItemCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isDragging ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <View style={[styles.gridDot, { backgroundColor: item.color }]} />
                  <AppText
                    variant="body"
                    numberOfLines={2}
                    style={{ fontSize: 12, fontWeight: '600', textAlign: 'center' }}
                  >
                    {item.title}
                  </AppText>
                  <AppBadge tone="neutral" size="sm">
                    {item.category}
                  </AppBadge>
                </AppCard>
              )}
            />
          </View>
        )}
      </View>

      <View style={[styles.orderLogCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={3}>Current Slot Order</AppTitle>
        <AppText variant="muted">
          {items.map((it, i) => `${i + 1}. ${it.title}`).join('\n')}
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 16,
    paddingBottom: 40,
  },
  controlPanel: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testbedArea: {
    minHeight: 460,
  },
  gridWrapper: {
    alignItems: 'center',
  },
  listItemCard: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 12,
  },
  colorBar: {
    width: 6,
    height: 38,
    borderRadius: 3,
  },
  itemMeta: {
    flex: 1,
    gap: 2,
  },
  gridItemCard: {
    width: 104,
    height: 104,
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orderLogCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
});
