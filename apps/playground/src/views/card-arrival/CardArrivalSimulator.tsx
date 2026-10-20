import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useHandArrival, predictHandArrivalSlot, type PredictedHandArrivalSlot } from 'alambre';
import { AppCard, AppButton, AppTitle, AppText, AppBadge } from '@some-alambre/ui';
import { useLightDark } from '../../providers/theme';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { PlayingCard } from '../card-game/components/PlayingCard';
import { CardHand } from '../card-game/components/CardHand';
import { ArrivalFlightOverlay } from './ArrivalFlightOverlay';
import type { PlayingCardData, Point2D } from '../card-game/types';
import { createStandardDeck, shuffleDeck, drawCard as drawFromDeck } from '../card-game/engine/deck';

const INITIAL_HAND_COUNT = 4;

interface ArrivalLogEntry {
  id: string;
  time: string;
  cardName: string;
  slotIndex: number;
  totalCards: number;
  targetCoords: string;
}

export default function CardArrivalSimulator() {
  const { theme } = useLightDark();

  // Deck & Hand State
  const [deck, setDeck] = useState<PlayingCardData[]>(() => {
    const full = shuffleDeck(createStandardDeck());
    return full.slice(INITIAL_HAND_COUNT);
  });

  const [hand, setHand] = useState<PlayingCardData[]>(() => {
    const full = shuffleDeck(createStandardDeck());
    return full.slice(0, INITIAL_HAND_COUNT).map((c) => ({ ...c, isArriving: false }));
  });

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Trajectory & Physics Controls
  const [flightDuration, setFlightDuration] = useState(360);
  const [liftHeight, setLiftHeight] = useState(55);
  const [peakScale, setPeakScale] = useState(1.12);
  const [flipOnFly, setFlipOnFly] = useState(false);
  const [anticipatoryFan, setAnticipatoryFan] = useState(true);

  // Sequential draw burst state
  const sequentialRemainingRef = useRef(0);
  const [isBurstActive, setIsBurstActive] = useState(false);

  // Telemetry & Event Log
  const [arrivalLogs, setArrivalLogs] = useState<ArrivalLogEntry[]>([]);
  const [lastSlotTelemetry, setLastSlotTelemetry] = useState<PredictedHandArrivalSlot | null>(null);

  // Arena Layout Coordinates
  const [_arenaLayout, setArenaLayout] = useState({ x: 0, y: 0, width: 340, height: 380 });
  const [deckLayout, setDeckLayout] = useState({ x: 20, y: 30, width: 76, height: 110 });
  const [handLayout, setHandLayout] = useState({ x: 10, y: 180, width: 320, height: 190 });

  // Compute origin and destination references in Arena coordinate space
  const deckCoord: Point2D = useMemo(() => {
    return {
      x: Math.round(deckLayout.x + (deckLayout.width - 76) / 2),
      y: Math.round(deckLayout.y + (deckLayout.height - 110) / 2),
    };
  }, [deckLayout]);

  const handCenterOffset: Point2D = useMemo(() => {
    return {
      x: Math.round(handLayout.x + (handLayout.width - 76) / 2),
      y: Math.round(handLayout.y + (handLayout.height - 110) / 2),
    };
  }, [handLayout]);

  // Hook: useHandArrival from alambre
  const handArrival = useHandArrival<PlayingCardData>({
    currentHand: hand,
    flightDurationMs: flightDuration,
    liftHeight,
    peakScale,
    flipOnFly,
    containerWidth: handLayout.width,
    maxSpan: 280,
    baseSpacing: 38,
    centerOffset: handCenterOffset,
    onArrivalComplete: (card, slot) => {
      // Settle into hand: clear arrival invisibility flag
      setHand((prev) => {
        const exists = prev.some((c) => c.id === card.id);
        if (exists) {
          return prev.map((c) => (c.id === card.id ? { ...c, isArriving: false } : c));
        }
        return [...prev, { ...card, isArriving: false }];
      });

      setArrivalLogs((prev) => [
        {
          id: `${Date.now()}-${card.id}`,
          time: new Date().toLocaleTimeString(),
          cardName: `${card.rank} of ${card.suit}`,
          slotIndex: slot.targetSlotIndex + 1,
          totalCards: slot.targetTotal,
          targetCoords: `(${Math.round(slot.centerCoord.x)}, ${Math.round(slot.centerCoord.y)})`,
        },
        ...prev.slice(0, 3),
      ]);

      // Check if sequential burst has more cards to draw
      if (sequentialRemainingRef.current > 0) {
        sequentialRemainingRef.current -= 1;
        if (sequentialRemainingRef.current === 0) {
          setIsBurstActive(false);
        } else {
          // Trigger next card draw on next tick
          setTimeout(() => {
            triggerDraw();
          }, 60);
        }
      }
    },
  });

  // Predicted next slot for live telemetry display
  const predictedNextSlot = useMemo(() => {
    return predictHandArrivalSlot(hand.length, {
      containerWidth: handLayout.width,
      maxSpan: 280,
      baseSpacing: 38,
      centerOffset: handCenterOffset,
    });
  }, [hand.length, handLayout.width, handCenterOffset]);

  // Primary Draw Handler
  const triggerDraw = useCallback(() => {
    if (deck.length === 0 || handArrival.isArriving) return;

    const { card, remaining } = drawFromDeck(deck);
    if (!card) return;

    setDeck(remaining);

    // If anticipatory fan is enabled, immediately add the card with isArriving: true
    // so sibling cards smoothly fan out to make space while the card is in flight
    if (anticipatoryFan) {
      setHand((prev) => [...prev, { ...card, isArriving: true }]);
    }

    const slot = handArrival.startArrival(deckCoord, card);
    setLastSlotTelemetry(slot);
  }, [deck, handArrival, anticipatoryFan, deckCoord]);

  // Sequential burst trigger
  const handleSequentialDraw = (count: number) => {
    if (deck.length < count || handArrival.isArriving || isBurstActive) return;
    sequentialRemainingRef.current = count;
    setIsBurstActive(true);
    triggerDraw();
  };

  // Play / Discard Card from Hand
  const handlePlayCard = (cardToPlay: PlayingCardData) => {
    if (handArrival.isArriving) return;
    setHand((prev) => prev.filter((c) => c.id !== cardToPlay.id));
    if (selectedCardId === cardToPlay.id) {
      setSelectedCardId(null);
    }
  };

  const handlePlaySelected = () => {
    if (!selectedCardId) return;
    const card = hand.find((c) => c.id === selectedCardId);
    if (card) handlePlayCard(card);
  };

  // Reset Hand Handlers
  const handleResetHand = (targetCount: number) => {
    handArrival.cancelArrival();
    sequentialRemainingRef.current = 0;
    setIsBurstActive(false);

    const freshDeck = shuffleDeck(createStandardDeck());
    const newHand = freshDeck.slice(0, targetCount).map((c) => ({ ...c, isArriving: false }));
    const newDeck = freshDeck.slice(targetCount);

    setDeck(newDeck);
    setHand(newHand);
    setSelectedCardId(null);
    setLastSlotTelemetry(null);
  };

  const displayTelemetry = lastSlotTelemetry ?? predictedNextSlot;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Intro & Diagnostics Card */}
      <TestCard
        title="Card Arrival Simulation"
        description="Dedicated validation environment for useHandArrival and predictHandArrivalSlot. Solves the spatial discontinuity where drawn cards fly to screen center and snap abruptly to their slot."
      >
        <ConfigSlider
          label={`Flight Duration (${flightDuration} ms)`}
          value={flightDuration}
          min={160}
          max={800}
          step={20}
          onChange={setFlightDuration}
        />
        <ConfigSlider
          label={`Parabolic Lift Height (${liftHeight} px)`}
          value={liftHeight}
          min={15}
          max={120}
          step={5}
          onChange={setLiftHeight}
        />
        <ConfigSlider
          label={`Peak Scale Apex (${peakScale.toFixed(2)}x)`}
          value={Math.round(peakScale * 100)}
          min={100}
          max={135}
          step={1}
          onChange={(v) => setPeakScale(v / 100)}
        />
        <ConfigSwitch
          label="Mid-Air 3D Flip (180° Y-Rotation)"
          value={flipOnFly}
          onChange={setFlipOnFly}
        />
        <ConfigSwitch
          label="Anticipatory Hand Fan (Make Space on Launch)"
          value={anticipatoryFan}
          onChange={setAnticipatoryFan}
        />
      </TestCard>

      {/* Main Simulation Arena */}
      <AppCard variant="outlined" style={[styles.arenaCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <View style={styles.arenaHeader}>
          <View style={styles.arenaHeaderLeft}>
            <AppTitle level={3}>Live Table Felt</AppTitle>
            <AppBadge
              tone={handArrival.isArriving ? 'primary' : 'success'}
              variant="soft"
              size="sm"
            >
              {handArrival.isArriving ? 'CARD IN FLIGHT' : 'IDLE'}
            </AppBadge>
          </View>
          <View style={styles.buttonRow}>
            <AppButton
              variant="solid"
              tone="primary"
              size="sm"
              label="Draw 1 Card"
              disabled={deck.length === 0 || handArrival.isArriving || isBurstActive}
              onPress={triggerDraw}
            />
            <AppButton
              variant="soft"
              tone="secondary"
              size="sm"
              label="Draw 3 Burst"
              disabled={deck.length < 3 || handArrival.isArriving || isBurstActive}
              onPress={() => handleSequentialDraw(3)}
            />
          </View>
        </View>

        {/* Felt Surface Area */}
        <View
          style={[styles.feltSurface, { backgroundColor: '#1e3a29', borderColor: '#2f5c40' }]}
          onLayout={(e) => setArenaLayout(e.nativeEvent.layout)}
        >
          {/* Deck Source Zone */}
          <View
            style={styles.deckZone}
            onLayout={(e) => setDeckLayout(e.nativeEvent.layout)}
          >
            {deck.length > 0 ? (
              <Pressable
                onPress={triggerDraw}
                disabled={handArrival.isArriving || isBurstActive}
                accessibilityRole="button"
                accessibilityLabel={`Draw card, ${deck.length} remaining`}
                style={styles.deckStack}
              >
                {/* 3D Stack depth layers */}
                <View style={[styles.deckShadowLayer, styles.deckLayer2]} />
                <View style={[styles.deckShadowLayer, styles.deckLayer1]} />
                <PlayingCard
                  suit="spades"
                  rank="A"
                  faceUp={false}
                  size="md"
                  accessible={false}
                />
                <View style={styles.deckCounterBadge}>
                  <AppText variant="caption" style={styles.deckCounterText}>
                    {deck.length}
                  </AppText>
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handleResetHand(INITIAL_HAND_COUNT)}
                style={styles.emptyDeckPlaceholder}
              >
                <AppText variant="caption" style={{ color: '#9ca3af', textAlign: 'center' }}>
                  Deck Empty{'\n'}Tap to Refill
                </AppText>
              </Pressable>
            )}
            <AppText variant="caption" style={styles.deckPrompt}>
              {deck.length > 0 ? 'Tap Deck to Draw' : 'Empty'}
            </AppText>
          </View>

          {/* Telemetry Badge in Table Center */}
          <View style={styles.tableCenterInfo}>
            <AppText variant="caption" style={styles.centerFeltLabel}>
              {handArrival.isArriving
                ? 'Parabolic Trajectory Active...'
                : selectedCardId
                  ? 'Swipe Card Up or Tap Play to Discard'
                  : 'Hand Fan Synchronized'}
            </AppText>
          </View>

          {/* Player Hand Zone */}
          <View
            style={styles.handZone}
            onLayout={(e) => setHandLayout(e.nativeEvent.layout)}
          >
            <CardHand
              cards={hand}
              selectedCardId={selectedCardId}
              onSelectCard={(c) => setSelectedCardId(selectedCardId === c.id ? null : c.id)}
              onPlayCard={handlePlayCard}
              enableSwipeToPlay={true}
              cardSpacing={38}
              maxSpan={280}
              size="md"
            />
          </View>

          {/* In-Flight Card Arrival Overlay */}
          <ArrivalFlightOverlay
            activeArrival={handArrival.activeArrival}
            flightAnimatedStyle={handArrival.flightAnimatedStyle}
            size="md"
          />
        </View>

        {/* Hand Actions Footer */}
        <View style={styles.handActionsRow}>
          <AppText variant="muted">
            Cards in hand: <AppText variant="body" style={{ fontWeight: '700' }}>{hand.length}</AppText>
          </AppText>

          <View style={styles.handActionButtons}>
            <AppButton
              variant="outline"
              tone="primary"
              size="sm"
              label="Play Selected"
              disabled={!selectedCardId || handArrival.isArriving}
              onPress={handlePlaySelected}
            />
            <AppButton
              variant="ghost"
              tone="neutral"
              size="sm"
              label="Reset (4 Cards)"
              onPress={() => handleResetHand(4)}
            />
            <AppButton
              variant="ghost"
              tone="danger"
              size="sm"
              label="Clear Hand"
              onPress={() => handleResetHand(0)}
            />
          </View>
        </View>
      </AppCard>

      {/* Real-Time Spatial Telemetry Panel */}
      <AppCard variant="outlined" style={styles.telemetryCard}>
        <AppTitle level={3}>Spatial Prediction Telemetry</AppTitle>
        <AppText variant="muted">
          Dynamic values generated mathematically by predictHandArrivalSlot prior to initiating the trajectory.
        </AppText>

        <View style={styles.telemetryGrid}>
          <View style={[styles.telemetryCell, { backgroundColor: theme.surfaceAlt }]}>
            <AppText variant="caption" style={{ color: theme.muted }}>Target Slot Index</AppText>
            <AppText variant="subtitle" style={{ color: theme.color, fontWeight: '700' }}>
              #{displayTelemetry.targetSlotIndex + 1} of {displayTelemetry.targetTotal}
            </AppText>
          </View>

          <View style={[styles.telemetryCell, { backgroundColor: theme.surfaceAlt }]}>
            <AppText variant="caption" style={{ color: theme.muted }}>Target Center (X, Y)</AppText>
            <AppText variant="subtitle" style={{ color: theme.primary, fontWeight: '700' }}>
              ({Math.round(displayTelemetry.centerCoord.x)}, {Math.round(displayTelemetry.centerCoord.y)})
            </AppText>
          </View>

          <View style={[styles.telemetryCell, { backgroundColor: theme.surfaceAlt }]}>
            <AppText variant="caption" style={{ color: theme.muted }}>Fan Arc Angle</AppText>
            <AppText variant="subtitle" style={{ color: theme.color, fontWeight: '700' }}>
              {displayTelemetry.rotateDeg.toFixed(1)}°
            </AppText>
          </View>

          <View style={[styles.telemetryCell, { backgroundColor: theme.surfaceAlt }]}>
            <AppText variant="caption" style={{ color: theme.muted }}>Hand Auto-Compression</AppText>
            <AppBadge
              size="sm"
              variant="soft"
              tone={hand.length > 6 ? 'warning' : 'success'}
            >
              {hand.length > 6 ? 'COMPRESSED' : 'NORMAL SPAN'}
            </AppBadge>
          </View>
        </View>

        {/* Arrival History Log */}
        {arrivalLogs.length > 0 && (
          <View style={styles.logContainer}>
            <AppText variant="subtitle" style={{ fontSize: 13, fontWeight: '700', marginTop: 8 }}>
              Recent Touchdown Events
            </AppText>
            {arrivalLogs.map((log) => (
              <View key={log.id} style={[styles.logRow, { borderBottomColor: theme.border }]}>
                <AppBadge tone="primary" variant="outline" size="sm">
                  {log.time}
                </AppBadge>
                <AppText variant="body" style={{ flex: 1, fontWeight: '600' }}>
                  {log.cardName}
                </AppText>
                <AppText variant="caption" style={{ color: theme.muted }}>
                  Slot {log.slotIndex}/{log.totalCards} ➔ {log.targetCoords}
                </AppText>
              </View>
            ))}
          </View>
        )}
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
    paddingBottom: 40,
  },
  arenaCard: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    overflow: 'visible',
  },
  arenaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  arenaHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feltSurface: {
    position: 'relative',
    borderRadius: 14,
    borderWidth: 2,
    minHeight: 380,
    padding: 12,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  deckZone: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 4,
  },
  deckStack: {
    position: 'relative',
    width: 76,
    height: 110,
  },
  deckShadowLayer: {
    position: 'absolute',
    width: 76,
    height: 110,
    borderRadius: 9,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  deckLayer1: {
    top: -2,
    left: 2,
  },
  deckLayer2: {
    top: -4,
    left: 4,
  },
  deckCounterBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#475569',
  },
  deckCounterText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyDeckPlaceholder: {
    width: 76,
    height: 110,
    borderRadius: 9,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  deckPrompt: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  tableCenterInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  centerFeltLabel: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '600',
  },
  handZone: {
    width: '100%',
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  handActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  handActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  telemetryCell: {
    flex: 1,
    minWidth: 130,
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  logContainer: {
    gap: 8,
    marginTop: 6,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
});
