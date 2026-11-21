import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useCardTable, CardTable, type CardPoint, type RenderCardProps } from 'alambre';
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

export interface CardItem {
  id: string;
  rank: string;
  suit: '♠' | '♥' | '♦' | '♣';
  color: string;
  value: number;
}

const ALL_CARDS: CardItem[] = [
  { id: 'card_1', rank: 'A', suit: '♠', color: '#1e293b', value: 14 },
  { id: 'card_2', rank: 'K', suit: '♥', color: '#ef4444', value: 13 },
  { id: 'card_3', rank: 'Q', suit: '♦', color: '#f59e0b', value: 12 },
  { id: 'card_4', rank: 'J', suit: '♣', color: '#0f766e', value: 11 },
  { id: 'card_5', rank: '10', suit: '♠', color: '#1e293b', value: 10 },
  { id: 'card_6', rank: '7', suit: '♥', color: '#ef4444', value: 7 },
  { id: 'card_7', rank: '4', suit: '♦', color: '#f59e0b', value: 4 },
  { id: 'card_8', rank: '9', suit: '♣', color: '#0f766e', value: 9 },
  { id: 'card_9', rank: '3', suit: '♠', color: '#1e293b', value: 3 },
  { id: 'card_10', rank: '6', suit: '♥', color: '#ef4444', value: 6 },
];

const CARD_WIDTH = 58;
const CARD_HEIGHT = 84;
const TOTAL_HAND_CAPACITY = 7;
const ARENA_FIXED_HEIGHT = 320;

/**
 * Pure physical card face.
 * Invariant 4: Crisp 1px border, no semantic design system buttons wrapping game pieces.
 */
function CardFaceContent({
  item,
  isFlipped = false,
  isSelected = false,
}: {
  item: CardItem;
  isFlipped?: boolean;
  isSelected?: boolean;
}) {
  const { theme } = useLightDark();

  if (isFlipped) {
    return (
      <View
        style={[
          styles.cardFace,
          styles.cardBack,
          {
            backgroundColor: theme.primary,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={[styles.cardPattern, { borderColor: theme.onPrimary }]} />
        <AppText style={{ color: theme.onPrimary, fontSize: 10, fontWeight: '800' }}>
          ALAMBRE
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.cardFace,
        {
          backgroundColor: theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <AppText style={{ color: item.color, fontWeight: '800', fontSize: 12 }}>
          {item.rank}
        </AppText>
        <AppText style={{ color: item.color, fontSize: 10 }}>{item.suit}</AppText>
      </View>
      <View style={styles.cardCenter}>
        <AppText style={{ color: item.color, fontSize: 20 }}>{item.suit}</AppText>
      </View>
      <View style={styles.cardFooter}>
        <AppText style={{ color: item.color, fontWeight: '800', fontSize: 10 }}>
          {item.rank}
        </AppText>
      </View>
    </View>
  );
}

export default function CardMotionSimulation() {
  const { theme } = useLightDark();

  // Declarative Card Table Manager from alambre
  const table = useCardTable<CardItem>({
    initialCards: ALL_CARDS,
    totalCapacity: TOTAL_HAND_CAPACITY,
    cardWidth: CARD_WIDTH,
    cardHeight: CARD_HEIGHT,
    arenaHeight: ARENA_FIXED_HEIGHT,
    defaultStaggerMs: 90,
    defaultFlightDuration: 340,
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.headerRow}>
          <AppTitle level={2}>Magnetic Card Kinetics</AppTitle>
          <AppBadge tone="primary" variant="soft" size="md">
            ALAMBRE CARD TABLE
          </AppBadge>
        </View>
        <AppText variant="muted">
          Turnkey card container backed by alambre/useCardTable. Persistent single-identity card
          entities, continuous magnetic anchors, 3D parabolic flights, and dynamic hand re-fanning.
        </AppText>
      </View>

      <View style={styles.arenaContainer}>
        <TestStage
          title="Interactive Table Stage"
          badge={{
            label: table.flyingCardIds.size > 0 ? `In Flight (${table.flyingCardIds.size})` : 'Stable',
            tone: table.flyingCardIds.size > 0 ? 'warning' : 'success',
          }}
          arenaHeight={ARENA_FIXED_HEIGHT}
          onReset={table.reset}
          resetLabel="Reset Table"
        >
          <CardTable<CardItem>
            table={table}
            cardWidth={CARD_WIDTH}
            cardHeight={CARD_HEIGHT}
            renderDeckOverlay={({ count, position }: { count: number; position: CardPoint }) => (
              <View
                style={[
                  styles.dockTarget,
                  {
                    left: position.x - CARD_WIDTH / 2,
                    top: position.y - CARD_HEIGHT / 2,
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceAlt,
                  },
                ]}
              >
                <AppText variant="muted" style={styles.emptyLabel}>
                  {count === 0 ? 'Empty' : ''}
                </AppText>
                <View style={styles.badgeContainer}>
                  <AppBadge tone="primary" size="sm">
                    {count}
                  </AppBadge>
                </View>
                <AppText variant="muted" style={styles.zoneTitle}>
                  Deck
                </AppText>
              </View>
            )}
            renderDiscardOverlay={({ count, position }: { count: number; position: CardPoint }) => (
              <View
                style={[
                  styles.dockTarget,
                  {
                    left: position.x - CARD_WIDTH / 2,
                    top: position.y - CARD_HEIGHT / 2,
                    borderColor: theme.border,
                    backgroundColor: theme.surfaceAlt,
                  },
                ]}
              >
                <AppText variant="muted" style={styles.emptyLabel}>
                  {count === 0 ? 'Empty' : ''}
                </AppText>
                <View style={styles.badgeContainer}>
                  <AppBadge tone="neutral" size="sm">
                    {count}
                  </AppBadge>
                </View>
                <AppText variant="muted" style={styles.zoneTitle}>
                  Discard
                </AppText>
              </View>
            )}
            renderCard={({ card, isFlipped, isSelected }: RenderCardProps<CardItem>) => (
              <CardFaceContent item={card} isFlipped={isFlipped} isSelected={isSelected} />
            )}
          />
        </TestStage>

        {/* Action Controls */}
        <View style={styles.actionGrid}>
          <AppButton
            variant="solid"
            tone="primary"
            onPress={() => table.deal(TOTAL_HAND_CAPACITY)}
            disabled={table.deckCards.length < TOTAL_HAND_CAPACITY || table.flyingCardIds.size > 0}
          >
            Deal Hand (7 Cards)
          </AppButton>

          <AppButton
            variant="outline"
            tone="neutral"
            onPress={table.draw}
            disabled={
              table.deckCards.length === 0 ||
              table.handCards.length >= TOTAL_HAND_CAPACITY ||
              table.flyingCardIds.size > 0
            }
          >
            Draw Card
          </AppButton>

          <AppButton
            variant="outline"
            tone="neutral"
            onPress={() => table.sortHand((a: CardItem, b: CardItem) => a.value - b.value)}
            disabled={table.handCards.length <= 1 || table.flyingCardIds.size > 0}
          >
            Auto-Sort Hand
          </AppButton>

          <AppButton
            variant="soft"
            tone="danger"
            onPress={() => table.discard()}
            disabled={!table.selectedId || table.flyingCardIds.size > 0}
          >
            Discard Selected
          </AppButton>
        </View>

        {/* Kinetics Calibration Controls */}
        <AppCard variant="outlined" style={[styles.controlCard, { borderColor: theme.border }]}>
          <AppTitle level={3}>Magnetic Arc Tuning</AppTitle>
          <AppSlider
            label="Cascade Stagger Delay"
            value={table.staggerMs}
            min={40}
            max={180}
            step={10}
            unit="ms"
            onChange={table.setStaggerMs}
          />
          <AppSlider
            label="Flight Duration"
            value={table.flightDurationMs}
            min={200}
            max={600}
            step={20}
            unit="ms"
            onChange={table.setFlightDurationMs}
          />
        </AppCard>
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
  arenaContainer: {
    gap: 16,
  },
  dockTarget: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -6,
    zIndex: 10,
  },
  emptyLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  zoneTitle: {
    position: 'absolute',
    bottom: -18,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    width: 80,
  },
  cardFace: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  cardBack: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardPattern: {
    position: 'absolute',
    width: CARD_WIDTH - 8,
    height: CARD_HEIGHT - 8,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCenter: {
    alignSelf: 'center',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  controlCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
});
