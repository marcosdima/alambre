import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  useKineticCarousel,
  useKineticCarouselItem,
  KineticCarouselProvider,
  useKineticSwipe,
  type CarouselPreset,
  type KineticSwipeDirection,
} from 'alambre';
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
import { PlayingCard } from '../card-game/components/PlayingCard';
import type { PlayingCardData, Rank, Suit } from '../card-game/types';

export default function KineticContainerTestbed() {
  const { theme } = useLightDark();

  const [preset, setPreset] = useState<CarouselPreset>('coverflow');
  const [itemWidth, setItemWidth] = useState(200);
  const [itemGap, setItemGap] = useState(16);
  const [autoPlay, setAutoPlay] = useState(false);
  const [tiltAngle, setTiltAngle] = useState(16);
  const [swipeThreshold, setSwipeThreshold] = useState(110);
  const [escapeVelocity, setEscapeVelocity] = useState(750);

  const tabs = useMemo(
    () => [
      {
        id: 'carousel',
        label: '3D Carousel',
        content: (
          <CarouselScenario
            preset={preset}
            itemWidth={itemWidth}
            itemGap={itemGap}
            autoPlay={autoPlay}
          />
        ),
      },
      {
        id: 'deck-swipe',
        label: 'Deck Flick',
        content: (
          <DeckSwipeScenario
            tiltAngle={tiltAngle}
            threshold={swipeThreshold}
            escapeVelocity={escapeVelocity}
          />
        ),
      },
      {
        id: 'action-pad',
        label: '4-Way Pad',
        content: (
          <ActionPadScenario
            threshold={swipeThreshold}
            escapeVelocity={escapeVelocity}
          />
        ),
      },
      {
        id: 'stress',
        label: 'Stress List',
        content: <StressScenario />,
      },
    ],
    [autoPlay, escapeVelocity, itemGap, itemWidth, preset, swipeThreshold, tiltAngle],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard
        title="Kinetic Containers Laboratory"
        description="Unified testbed for container physics: 3D Coverflow carousel, Card-Stack depth paging, 120 FPS gesture-driven swipe flicking, and 4-way multi-axis release mechanics."
      >
        <AppSegmentedControl
          value={preset}
          options={[
            { label: 'Coverflow', value: 'coverflow' },
            { label: 'Card Stack', value: 'card-stack' },
            { label: 'Scale Fade', value: 'scale-fade' },
            { label: 'Flat', value: 'flat' },
          ]}
          onChange={(val) => setPreset(val as CarouselPreset)}
        />
        <ConfigSlider
          label={`Card Width (${itemWidth} pt)`}
          value={itemWidth}
          min={160}
          max={260}
          step={10}
          onChange={setItemWidth}
        />
        <ConfigSlider
          label={`Item Gap (${itemGap} pt)`}
          value={itemGap}
          min={4}
          max={32}
          step={2}
          onChange={setItemGap}
        />
        <ConfigSlider
          label={`Swipe Tilt (${tiltAngle}°)`}
          value={tiltAngle}
          min={0}
          max={30}
          step={2}
          onChange={setTiltAngle}
        />
        <ConfigSlider
          label={`Swipe Threshold (${swipeThreshold} pt)`}
          value={swipeThreshold}
          min={60}
          max={200}
          step={10}
          onChange={setSwipeThreshold}
        />
        <ConfigSlider
          label={`Escape Velocity (${escapeVelocity} pt/s)`}
          value={escapeVelocity}
          min={300}
          max={1500}
          step={50}
          onChange={setEscapeVelocity}
        />
        <ConfigSwitch
          label="Auto-Play Carousel (3s Interval)"
          value={autoPlay}
          onChange={setAutoPlay}
        />
      </TestCard>

      <GummyTabs tabs={tabs} />
    </View>
  );
}

// ============================================================================
// Scenario 1: 3D Kinetic Carousel (Coverflow, Stack, Scale-Fade)
// ============================================================================

const SAMPLE_CARDS: PlayingCardData[] = [
  { id: 'c1', suit: 'spades', rank: 'A' },
  { id: 'c2', suit: 'hearts', rank: 'K' },
  { id: 'c3', suit: 'diamonds', rank: 'Q' },
  { id: 'c4', suit: 'clubs', rank: 'J' },
  { id: 'c5', suit: 'spades', rank: '10' },
  { id: 'c6', suit: 'hearts', rank: '9' },
  { id: 'c7', suit: 'diamonds', rank: '8' },
];

function CarouselScenario({
  preset,
  itemWidth,
  itemGap,
  autoPlay,
}: {
  preset: CarouselPreset;
  itemWidth: number;
  itemGap: number;
  autoPlay: boolean;
}) {
  const carousel = useKineticCarousel({
    itemWidth,
    itemGap,
    totalItems: SAMPLE_CARDS.length,
    preset,
    autoPlay,
    autoPlayInterval: 2800,
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <AppTitle level={3}>Spatial Container: {preset.toUpperCase()}</AppTitle>
          <AppBadge
            label={`Card ${carousel.activeIndex + 1} of ${SAMPLE_CARDS.length}`}
            tone="primary"
            variant="solid"
            size="sm"
          />
        </View>
        <AppText variant="muted">
          Driven by useKineticCarousel on the UI thread. Drag horizontally or use buttons to navigate with physics inertia.
        </AppText>

        <View style={styles.carouselStage}>
          <KineticCarouselProvider value={carousel}>
            <Animated.ScrollView
              {...carousel.scrollProps}
              contentContainerStyle={{
                paddingHorizontal: 60,
                alignItems: 'center',
              }}
            >
              {SAMPLE_CARDS.map((card, index) => (
                <CarouselCardItem
                  key={card.id}
                  card={card}
                  index={index}
                  itemWidth={itemWidth}
                  itemGap={itemGap}
                />
              ))}
            </Animated.ScrollView>
          </KineticCarouselProvider>
        </View>

        <View style={styles.controlsRow}>
          <AppButton
            variant="outline"
            tone="neutral"
            size="sm"
            label="◀ Prev"
            onPress={() => carousel.prev()}
          />
          <AppButton
            variant="solid"
            tone="primary"
            size="sm"
            label="Next ▶"
            onPress={() => carousel.next()}
          />
        </View>
      </AppCard>
    </ScrollView>
  );
}

function CarouselCardItem({
  card,
  index,
  itemWidth,
  itemGap,
}: {
  card: PlayingCardData;
  index: number;
  itemWidth: number;
  itemGap: number;
}) {
  const { animatedStyle } = useKineticCarouselItem(index);

  return (
    <Animated.View
      style={[
        {
          width: itemWidth,
          marginRight: itemGap,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <PlayingCard suit={card.suit} rank={card.rank} size="md" />
    </Animated.View>
  );
}

// ============================================================================
// Scenario 2: Deck Swipe & Discard Flick (120 FPS UI-Thread Gestures)
// ============================================================================

function DeckSwipeScenario({
  tiltAngle,
  threshold,
  escapeVelocity,
}: {
  tiltAngle: number;
  threshold: number;
  escapeVelocity: number;
}) {
  const [deck, setDeck] = useState<PlayingCardData[]>([
    { id: 'd1', suit: 'spades', rank: 'A' },
    { id: 'd2', suit: 'hearts', rank: 'K' },
    { id: 'd3', suit: 'diamonds', rank: 'Q' },
    { id: 'd4', suit: 'clubs', rank: 'J' },
    { id: 'd5', suit: 'spades', rank: '10' },
  ]);

  const [leftTray, setLeftTray] = useState<PlayingCardData[]>([]);
  const [rightTray, setRightTray] = useState<PlayingCardData[]>([]);

  const topCard = deck[0];

  const handleDismiss = (direction: KineticSwipeDirection) => {
    if (!topCard) return;
    if (direction === 'left') {
      setLeftTray((prev) => [topCard, ...prev]);
    } else {
      setRightTray((prev) => [topCard, ...prev]);
    }
    setDeck((prev) => prev.slice(1));
  };

  const handleReset = () => {
    setDeck([
      { id: 'd1', suit: 'spades', rank: 'A' },
      { id: 'd2', suit: 'hearts', rank: 'K' },
      { id: 'd3', suit: 'diamonds', rank: 'Q' },
      { id: 'd4', suit: 'clubs', rank: 'J' },
      { id: 'd5', suit: 'spades', rank: '10' },
    ]);
    setLeftTray([]);
    setRightTray([]);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <AppTitle level={3}>Tactile Deck Swipe & Flick</AppTitle>
          <AppBadge
            label={`${deck.length} remaining`}
            tone={deck.length > 0 ? 'primary' : 'neutral'}
            variant="solid"
            size="sm"
          />
        </View>
        <AppText variant="muted">
          Drag horizontally with dynamic rotational tilt. Flick with speed &gt;{escapeVelocity} px/s to trigger an escape velocity discard even with small displacement!
        </AppText>

        <View style={styles.deckStage}>
          {/* Left Discard Tray */}
          <View style={styles.trayZone}>
            <AppText variant="muted" style={styles.trayLabel}>PASS (LEFT)</AppText>
            <AppBadge label={`${leftTray.length}`} tone="danger" size="sm" />
          </View>

          {/* Active Card Stack */}
          <View style={styles.cardStackWrapper}>
            {deck.length > 1 && (
              <View style={[styles.cardUnderlay, styles.cardUnderlay2]}>
                <PlayingCard suit={deck[1].suit} rank={deck[1].rank} size="md" />
              </View>
            )}

            {topCard ? (
              <SwipeableCard
                key={topCard.id}
                card={topCard}
                tiltAngle={tiltAngle}
                threshold={threshold}
                escapeVelocity={escapeVelocity}
                onDismiss={handleDismiss}
              />
            ) : (
              <View style={styles.emptyDeckSlot}>
                <AppText variant="muted">Deck Empty</AppText>
              </View>
            )}
          </View>

          {/* Right Discard Tray */}
          <View style={styles.trayZone}>
            <AppText variant="muted" style={styles.trayLabel}>KEEP (RIGHT)</AppText>
            <AppBadge label={`${rightTray.length}`} tone="success" size="sm" />
          </View>
        </View>

        <View style={styles.deckButtonsRow}>
          <AppButton
            variant="outline"
            tone="neutral"
            size="sm"
            label="Reset Deck"
            onPress={handleReset}
          />
        </View>
      </AppCard>
    </ScrollView>
  );
}

function SwipeableCard({
  card,
  tiltAngle,
  threshold,
  escapeVelocity,
  onDismiss,
}: {
  card: PlayingCardData;
  tiltAngle: number;
  threshold: number;
  escapeVelocity: number;
  onDismiss: (dir: KineticSwipeDirection) => void;
}) {
  const swipe = useKineticSwipe({
    tiltAngle,
    threshold,
    escapeVelocity,
    directions: ['left', 'right'],
    onDismiss,
  });

  return (
    <GestureDetector gesture={swipe.gesture}>
      <Animated.View style={[styles.swipeableCardContainer, swipe.animatedStyle]}>
        <PlayingCard suit={card.suit} rank={card.rank} size="md" />
      </Animated.View>
    </GestureDetector>
  );
}

// ============================================================================
// Scenario 3: 4-Way Multi-Axis Action Pad (Up, Down, Left, Right)
// ============================================================================

function ActionPadScenario({
  threshold,
  escapeVelocity,
}: {
  threshold: number;
  escapeVelocity: number;
}) {
  const [activeAction, setActiveAction] = useState<string>('Center Ready');
  const [actionCount, setActionCount] = useState(0);

  const handleActionDismiss = (dir: KineticSwipeDirection) => {
    const labels: Record<KineticSwipeDirection, string> = {
      up: '🚀 SUPER PLAY (UP)',
      down: '🗑️ FOLD & DISCARD (DOWN)',
      left: '⬅️ PASS TURN (LEFT)',
      right: '➡️ BET & RAISE (RIGHT)',
    };
    setActiveAction(labels[dir]);
    setActionCount((c) => c + 1);
  };

  const swipe = useKineticSwipe({
    directions: ['up', 'down', 'left', 'right'],
    threshold,
    escapeVelocity,
    tiltAngle: 12,
    onDismiss: (dir: KineticSwipeDirection) => {
      handleActionDismiss(dir);
      swipe.reset();
    },
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <AppTitle level={3}>4-Way Directional Pad</AppTitle>
          <AppBadge label={`Action #${actionCount}`} tone="primary" size="sm" />
        </View>
        <AppText variant="muted">
          Drag in any of the 4 cardinal directions. When released, Reanimated computes whether translation or velocity exceeds the directional boundary.
        </AppText>

        <View style={styles.actionPadStage}>
          {/* Top Target Zone */}
          <View style={[styles.padZone, styles.padZoneTop]}>
            <AppText style={styles.padZoneText}>UP: SUPER PLAY</AppText>
          </View>

          {/* Left & Right Zones */}
          <View style={styles.padMiddleRow}>
            <View style={[styles.padZone, styles.padZoneLeft]}>
              <AppText style={styles.padZoneText}>LEFT: PASS</AppText>
            </View>

            {/* Center Swipable Action Token */}
            <GestureDetector gesture={swipe.gesture}>
              <Animated.View style={[styles.actionToken, swipe.animatedStyle]}>
                <PlayingCard suit="diamonds" rank="A" size="sm" />
              </Animated.View>
            </GestureDetector>

            <View style={[styles.padZone, styles.padZoneRight]}>
              <AppText style={styles.padZoneText}>RIGHT: RAISE</AppText>
            </View>
          </View>

          {/* Bottom Target Zone */}
          <View style={[styles.padZone, styles.padZoneBottom]}>
            <AppText style={styles.padZoneText}>DOWN: FOLD</AppText>
          </View>
        </View>

        <View style={styles.actionResultWrapper}>
          <AppBadge label={activeAction} tone="success" variant="soft" size="md" />
        </View>
      </AppCard>
    </ScrollView>
  );
}

// ============================================================================
// Scenario 4: Stress List (20 Carousel Cards with dynamic calculations)
// ============================================================================

const STRESS_SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const STRESS_RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function StressScenario() {
  const largeDeck = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: `stress_${i}`,
      suit: STRESS_SUITS[i % STRESS_SUITS.length],
      rank: STRESS_RANKS[i % STRESS_RANKS.length],
    }));
  }, []);

  const carousel = useKineticCarousel({
    itemWidth: 150,
    itemGap: 10,
    totalItems: largeDeck.length,
    preset: 'coverflow',
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppCard variant="outlined" style={styles.card}>
        <AppTitle level={3}>20-Item Coverflow Stress Test</AppTitle>
        <AppText variant="muted">
          Smooth 60/120 FPS Reanimated transforms across 20 dynamic elements without JS re-render bottlenecks.
        </AppText>

        <View style={styles.carouselStage}>
          <KineticCarouselProvider value={carousel}>
            <Animated.ScrollView
              {...carousel.scrollProps}
              contentContainerStyle={{ paddingHorizontal: 80, alignItems: 'center' }}
            >
              {largeDeck.map((card, idx) => (
                <StressCardItem key={card.id} card={card} index={idx} />
              ))}
            </Animated.ScrollView>
          </KineticCarouselProvider>
        </View>

        <View style={styles.controlsRow}>
          <AppButton
            variant="outline"
            tone="neutral"
            size="sm"
            label="◀ Jump to 0"
            onPress={() => carousel.scrollToIndex(0)}
          />
          <AppBadge label={`Index: ${carousel.activeIndex}`} tone="primary" size="sm" />
          <AppButton
            variant="outline"
            tone="neutral"
            size="sm"
            label="Jump to 19 ▶"
            onPress={() => carousel.scrollToIndex(19)}
          />
        </View>
      </AppCard>
    </ScrollView>
  );
}

function StressCardItem({ card, index }: { card: PlayingCardData; index: number }) {
  const { animatedStyle } = useKineticCarouselItem(index);

  return (
    <Animated.View
      style={[
        {
          width: 150,
          marginRight: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <PlayingCard suit={card.suit} rank={card.rank} size="sm" />
    </Animated.View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carouselStage: {
    height: 180,
    justifyContent: 'center',
    marginVertical: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  deckStage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 200,
    marginVertical: 12,
  },
  trayZone: {
    width: 70,
    height: 110,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#71717a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trayLabel: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardStackWrapper: {
    width: 90,
    height: 126,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardUnderlay: {
    position: 'absolute',
  },
  cardUnderlay2: {
    transform: [{ scale: 0.94 }, { translateY: 6 }],
    opacity: 0.7,
  },
  swipeableCardContainer: {
    position: 'absolute',
  },
  emptyDeckSlot: {
    width: 90,
    height: 126,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#52525b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionPadStage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  padZone: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#52525b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padZoneTop: {
    width: 140,
    height: 32,
    backgroundColor: '#18181b',
  },
  padZoneBottom: {
    width: 140,
    height: 32,
    backgroundColor: '#18181b',
  },
  padMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  padZoneLeft: {
    width: 90,
    height: 60,
    backgroundColor: '#18181b',
  },
  padZoneRight: {
    width: 90,
    height: 60,
    backgroundColor: '#18181b',
  },
  padZoneText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  actionToken: {
    width: 76,
    height: 106,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionResultWrapper: {
    alignItems: 'center',
    marginTop: 6,
  },
});
