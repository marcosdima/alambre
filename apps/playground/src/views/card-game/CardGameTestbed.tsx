import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLightDark } from '../../providers/theme';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppTitle, { AppText } from '../../components/AppTitle';
import { GummyTabs } from '../../components/test-utils/GummyTabs';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { CardHand } from './components/CardHand';
import { CardTable } from './components/CardTable';
import { CascadeFlightItem } from './components/CascadeFlightItem';
import { OpponentFlightItem } from './components/OpponentFlightItem';
import { MultiplayerArena } from './components/MultiplayerArena';
import type { PlayingCardData, Point2D } from './types';
import { createStandardDeck, shuffleDeck, dealCards, drawCard as drawFromDeck } from './engine/deck';
import { generateStackJitter } from './engine/drop-zones';
import { useDealCascade } from './hooks/use-deal-cascade';

export interface CardPhysicsConfig {
  flightDuration: number;
  springDamping: number;
  springStiffness: number;
  flipOnFly: boolean;
}

export default function CardGameTestbed() {
  const { theme } = useLightDark();

  const [flightDuration, setFlightDuration] = useState(380);
  const [springDamping, setSpringDamping] = useState(16);
  const [springStiffness, setSpringStiffness] = useState(140);
  const [flipOnFly, setFlipOnFly] = useState(true);

  const physics: CardPhysicsConfig = {
    flightDuration,
    springDamping,
    springStiffness,
    flipOnFly,
  };

  const tabs = [
    {
      id: 'table',
      label: 'Solo Table Play',
      content: <CardTableScenario physics={physics} />,
    },
    {
      id: 'arena',
      label: 'Multiplayer Arena',
      content: <MultiplayerArena physics={physics} />,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard
        title="Card Game Laboratory"
        description="Modular physics-driven card engine: responsive dynamic hand fan, 3D parabolic cascade dealing, critically-damped toss physics, and live Room Relay synchronization."
      >
        <ConfigSlider
          label={`Flight Duration (${flightDuration} ms)`}
          value={flightDuration}
          min={180}
          max={850}
          step={20}
          onChange={setFlightDuration}
        />
        <ConfigSlider
          label={`Spring Damping (${springDamping})`}
          value={springDamping}
          min={8}
          max={32}
          step={1}
          onChange={setSpringDamping}
        />
        <ConfigSlider
          label={`Spring Stiffness (${springStiffness})`}
          value={springStiffness}
          min={60}
          max={300}
          step={10}
          onChange={setSpringStiffness}
        />
        <ConfigSwitch
          label="Mid-Air 3D Flip on Dealing"
          value={flipOnFly}
          onChange={setFlipOnFly}
        />
      </TestCard>

      <GummyTabs tabs={tabs} />
    </View>
  );
}

// ============================================================================
// Scenario 1: Solo Table Play with Deal Cascade & Toss Physics
// ============================================================================

function CardTableScenario({ physics }: { physics: CardPhysicsConfig }) {
  const [deck, setDeck] = useState<PlayingCardData[]>(() =>
    shuffleDeck(createStandardDeck()),
  );

  const [hand, setHand] = useState<PlayingCardData[]>([]);

  const [playedPile, setPlayedPile] = useState<(PlayingCardData & { rotation?: number })[]>([
    { id: 'p0', suit: 'spades', rank: 'A', rotation: -3 },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // In-flight card played from hand to table center
  const [playFlight, setPlayFlight] = useState<{
    card: PlayingCardData;
    from: Point2D;
    to: Point2D;
    targetRotation: number;
  } | null>(null);

  // Dynamic layout measurements
  const [tableCardLayout, setTableCardLayout] = useState({ x: 0, y: 0, width: 340, height: 280 });
  const [tableMatLayout, setTableMatLayout] = useState({ x: 16, y: 70, width: 308, height: 210 });
  const [deckLayout, setDeckLayout] = useState({ x: 30, y: 55, width: 64, height: 92 });
  const [playZoneLayout, setPlayZoneLayout] = useState({ x: 160, y: 55, width: 76, height: 110 });

  const [handCardLayout, setHandCardLayout] = useState({ x: 0, y: 340, width: 340, height: 280 });
  const [handStageLayout, setHandStageLayout] = useState({ x: 16, y: 56, width: 308, height: 190 });

  // Calculate pixel-accurate centers in arena coordinate space
  const deckCoord: Point2D = useMemo(() => {
    return {
      x: Math.round(tableCardLayout.x + tableMatLayout.x + deckLayout.x + (deckLayout.width - 76) / 2),
      y: Math.round(tableCardLayout.y + tableMatLayout.y + deckLayout.y + (deckLayout.height - 110) / 2),
    };
  }, [tableCardLayout, tableMatLayout, deckLayout]);

  const tableCenterCoord: Point2D = useMemo(() => {
    return {
      x: Math.round(tableCardLayout.x + tableMatLayout.x + playZoneLayout.x + (playZoneLayout.width - 76) / 2),
      y: Math.round(tableCardLayout.y + tableMatLayout.y + playZoneLayout.y + (playZoneLayout.height - 110) / 2),
    };
  }, [tableCardLayout, tableMatLayout, playZoneLayout]);

  const handCenterCoord: Point2D = useMemo(() => {
    return {
      x: Math.round(handCardLayout.x + handStageLayout.x + (handStageLayout.width - 76) / 2),
      y: Math.round(handCardLayout.y + handStageLayout.y + (handStageLayout.height - 110) / 2),
    };
  }, [handCardLayout, handStageLayout]);

  // Hook 1: Deal Cascade Hook
  const dealCascade = useDealCascade({
    deckOrigin: deckCoord,
    handCenter: handCenterCoord,
    handContainerWidth: handStageLayout.width,
    flightDurationMs: physics.flightDuration,
    staggerDelayMs: 90,
    liftHeight: 55,
    flipOnFly: physics.flipOnFly,
    onCardLanded: (landedCard) => {
      setHand((prev) =>
        prev.map((c) => (c.id === landedCard.id ? { ...c, isArriving: false } : c)),
      );
    },
  });

  const handleDrawSingle = () => {
    if (deck.length === 0 || dealCascade.isDealing || playFlight) return;
    const { card, remaining } = drawFromDeck(deck);
    if (!card) return;

    setDeck(remaining);
    setHand((prev) => [...prev, { ...card, isArriving: true }]);
    dealCascade.startDeal([card], hand);
  };

  const handleDealBatch = (count: number = 5) => {
    if (deck.length === 0 || dealCascade.isDealing || playFlight) return;
    const { dealt, remaining } = dealCards(deck, count);
    if (dealt.length === 0) return;

    setDeck(remaining);
    // Add all to hand marked as arriving: hand fan auto-compresses and opens slots immediately
    setHand((prev) => [...prev, ...dealt.map((c) => ({ ...c, isArriving: true }))]);
    dealCascade.startDeal(dealt, hand);
  };

  const handlePlayCard = (cardToPlay: PlayingCardData) => {
    if (dealCascade.isDealing || playFlight) return;
    const cardIndex = hand.findIndex((c) => c.id === cardToPlay.id);
    if (cardIndex === -1) return;

    const jitter = generateStackJitter(cardToPlay.id, 14, 6);
    const destination = {
      x: tableCenterCoord.x + jitter.offsetX,
      y: tableCenterCoord.y + jitter.offsetY,
    };

    setHand((prev) => prev.filter((c) => c.id !== cardToPlay.id));
    if (selectedId === cardToPlay.id) {
      setSelectedId(null);
    }

    setPlayFlight({
      card: cardToPlay,
      from: handCenterCoord,
      to: destination,
      targetRotation: jitter.rotation,
    });
  };

  const handlePlaySelected = () => {
    if (!selectedId) return;
    const card = hand.find((c) => c.id === selectedId);
    if (card) {
      handlePlayCard(card);
    }
  };

  const handlePlayFlightComplete = useCallback(() => {
    if (!playFlight) return;
    setPlayedPile((prev) => [
      ...prev,
      { ...playFlight.card, rotation: playFlight.targetRotation },
    ]);
    setPlayFlight(null);
  }, [playFlight]);

  const handleResetRound = () => {
    dealCascade.cancelDeal();
    setPlayFlight(null);
    const freshDeck = shuffleDeck(createStandardDeck());
    setDeck(freshDeck);
    setHand([]);
    setPlayedPile([{ id: 'p0', suit: 'spades', rank: 'A', rotation: -3 }]);
    setSelectedId(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.tableArena}>
        {/* Deal Cascade In-Flight Cards */}
        {dealCascade.activeFlights.map((spec) => (
          <CascadeFlightItem
            key={spec.card.id}
            spec={spec}
            onComplete={() => dealCascade.handleFlightComplete(spec.card.id)}
            size="md"
          />
        ))}

        {/* Hand-to-Table In-Flight Card */}
        {playFlight && (
          <OpponentFlightItem
            card={playFlight.card}
            from={playFlight.from}
            to={playFlight.to}
            targetRotation={playFlight.targetRotation}
            durationMs={physics.flightDuration}
            onComplete={handlePlayFlightComplete}
            size="md"
          />
        )}

        {/* Felt Mat & Table */}
        <View onLayout={(e) => setTableCardLayout(e.nativeEvent.layout)}>
          <AppCard variant="outlined" style={[styles.card, { overflow: 'visible' }]}>
            <View style={styles.cardHeaderRow}>
              <AppTitle level={3}>Table Center & Deck</AppTitle>
              <AppButton
                variant="solid"
                tone="primary"
                size="sm"
                label="Deal 5 Cards"
                disabled={deck.length < 5 || dealCascade.isDealing}
                onPress={() => handleDealBatch(5)}
              />
            </View>
            <AppText variant="muted">
              Tap deck to draw 1 card, or tap "Deal 5 Cards" to observe a 3D parabolic cascade with mid-air flip and hand auto-compression.
            </AppText>

            <CardTable
              deckCount={deck.length}
              playedCards={playedPile}
              onDrawCard={handleDrawSingle}
              onTablePress={handlePlaySelected}
              onMatLayout={setTableMatLayout}
              onDeckLayout={setDeckLayout}
              onPlayZoneLayout={setPlayZoneLayout}
              activePrompt={
                dealCascade.isDealing
                  ? 'Dealing Cascade in Flight...'
                  : playFlight
                    ? 'Card Flying to Table...'
                    : selectedId
                      ? 'Swipe Up or Tap Table to Play'
                      : 'Tap "Deal 5 Cards", or Draw/Swipe a Card'
              }
            />
          </AppCard>
        </View>

        {/* Player Hand Area */}
        <View onLayout={(e) => setHandCardLayout(e.nativeEvent.layout)}>
          <AppCard variant="outlined" style={[styles.card, { overflow: 'visible' }]}>
            <View style={styles.handHeader}>
              <AppTitle level={3}>Player Hand ({hand.length})</AppTitle>
              <View style={styles.playActionWrapper}>
                <AppButton
                  variant="solid"
                  tone="primary"
                  size="sm"
                  label="Play to Table ➔"
                  disabled={!selectedId || dealCascade.isDealing || playFlight !== null}
                  onPress={handlePlaySelected}
                />
              </View>
            </View>

            <View
              style={styles.handStage}
              onLayout={(e) => setHandStageLayout(e.nativeEvent.layout)}
            >
              <CardHand
                cards={hand}
                selectedCardId={selectedId}
                onSelectCard={(c) => setSelectedId(selectedId === c.id ? null : c.id)}
                onPlayCard={handlePlayCard}
                enableSwipeToPlay={true}
                cardSpacing={38}
                maxSpan={280}
                size="md"
                springDamping={physics.springDamping}
                springStiffness={physics.springStiffness}
              />
            </View>

            <View style={styles.resetRow}>
              <AppButton
                variant="ghost"
                tone="neutral"
                size="sm"
                label="Reset Round"
                onPress={handleResetRound}
              />
            </View>
          </AppCard>
        </View>
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
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableArena: {
    position: 'relative',
    gap: 16,
  },
  handStage: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginVertical: 8,
  },
  handHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playActionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resetRow: {
    alignItems: 'center',
    marginTop: 4,
  },
});
