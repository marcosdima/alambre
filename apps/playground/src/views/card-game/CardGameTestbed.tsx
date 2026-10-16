import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useLightDark } from '../../providers/theme';
import AppCard from '../../components/AppCard';
import AppButton from '../../components/AppButton';
import AppBadge from '../../components/AppBadge';
import AppTitle, { AppText } from '../../components/AppTitle';
import AppSegmentedControl from '../../components/AppSegmentedControl';
import { GummyTabs } from '../../components/test-utils/GummyTabs';
import { TestCard } from '../../components/test-utils/TestCard';
import { ConfigSlider } from '../../components/test-utils/ConfigSlider';
import { ConfigSwitch } from '../../components/test-utils/ConfigSwitch';
import { PlayingCard } from './components/PlayingCard';
import { FlipCard } from './components/FlipCard';
import { CardHand } from './components/CardHand';
import { CardTable } from './components/CardTable';
import { FlyingCard } from './components/FlyingCard';
import { MultiplayerArena } from './components/MultiplayerArena';
import { useRoomRelay, generateRoomCode } from '@alambre/room-relay';
import type { PlayingCardData, Rank, Suit } from './types';

export interface CardPhysicsConfig {
  flightDuration: number;
  springDamping: number;
  springStiffness: number;
  flipOnFly: boolean;
}

export default function CardGameTestbed() {
  const { theme } = useLightDark();

  // Rule 2: Expose rich physics configurations
  const [flightDuration, setFlightDuration] = useState(420);
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
    { id: 'arena', label: 'Relay Arena', content: <MultiplayerArena physics={physics} /> },
    { id: 'table', label: 'Table Play', content: <CardTableScenario physics={physics} /> },
    { id: 'hand', label: 'Hand Fan', content: <CardHandScenario physics={physics} /> },
    { id: 'flip', label: '3D Flip', content: <CardFlipScenario physics={physics} /> },
    { id: 'relay', label: 'Raw Relay', content: <EdgeRelayScenario /> },
  ];


  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TestCard
        title="Card Game Architecture"
        description="Physical card game laboratory: Low-latency Edge Room Relay, Reanimated 3D flip with parabolic mid-flight translation, rotational hand fan, and kinetic table drop physics."
      >
        <ConfigSlider
          label={`Flight Duration (${flightDuration} ms)`}
          value={flightDuration}
          min={150}
          max={900}
          step={30}
          onChange={setFlightDuration}
        />
        <ConfigSlider
          label={`Spring Damping (${springDamping})`}
          value={springDamping}
          min={6}
          max={32}
          step={1}
          onChange={setSpringDamping}
        />
        <ConfigSlider
          label={`Spring Stiffness (${springStiffness})`}
          value={springStiffness}
          min={50}
          max={320}
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
// Scenario 1: Edge Room Relay
// ============================================================================

function EdgeRelayScenario() {
  const { theme } = useLightDark();
  const [activeRoomCode, setActiveRoomCode] = useState('XK89');
  const [transportMode, setTransportMode] = useState<'simulated' | 'websocket'>('simulated');
  const [customWsUrl, setCustomWsUrl] = useState('ws://localhost:8787');

  // Client 1: Host (Alice)
  const hostRelay = useRoomRelay({
    roomCode: activeRoomCode,
    playerName: 'Alice (Host)',
    isHost: true,
    mode: transportMode,
    serverUrl: customWsUrl,
  });

  // Client 2: Guest (Bob) - for dual simulation in same playground!
  const guestRelay = useRoomRelay({
    roomCode: activeRoomCode,
    playerName: 'Bob',
    isHost: false,
    mode: transportMode,
    serverUrl: customWsUrl,
  });

  const handleCreateNewRoom = () => {
    const newCode = generateRoomCode();
    setActiveRoomCode(newCode);
    hostRelay.joinRoom(newCode);
    guestRelay.joinRoom(newCode);
  };

  const getStatusTone = (status: string): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'connected':
        return 'success';
      case 'connecting':
      case 'reconnecting':
        return 'warning';
      default:
        return 'danger';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Relay Connection Header Card */}
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <AppTitle level={3}>Room #{activeRoomCode}</AppTitle>
            <View style={styles.statusRow}>
              <AppBadge
                label={hostRelay.status.toUpperCase()}
                tone={getStatusTone(hostRelay.status)}
                variant="solid"
                size="sm"
              />
              {hostRelay.latency > 0 && (
                <AppBadge
                  label={`${hostRelay.latency} ms RTT`}
                  tone="success"
                  variant="soft"
                  size="sm"
                />
              )}
            </View>
          </View>

          <View style={styles.headerActions}>
            {hostRelay.status === 'connected' ? (
              <AppButton
                variant="outline"
                tone="danger"
                size="sm"
                label="Disconnect"
                onPress={() => {
                  hostRelay.disconnect();
                  guestRelay.disconnect();
                }}
              />
            ) : (
              <AppButton
                variant="solid"
                tone="primary"
                size="sm"
                label="Connect"
                onPress={() => {
                  hostRelay.connect();
                  guestRelay.connect();
                }}
              />
            )}
          </View>
        </View>

        {/* Transport Mode Selector */}
        <View style={[styles.sectionDivider, { backgroundColor: theme.border }]} />
        <AppText variant="muted" style={styles.sectionHeading}>
          TRANSPORT MODE
        </AppText>
        <AppSegmentedControl
          value={transportMode}
          options={[
            { label: 'Simulated Edge (Offline Bus)', value: 'simulated' },
            { label: 'Live WebSocket (PartyKit / CF)', value: 'websocket' },
          ]}
          onChange={(val) => {
            const next = val as 'simulated' | 'websocket';
            setTransportMode(next);
            hostRelay.setMode(next);
            guestRelay.setMode(next);
          }}
        />

        {transportMode === 'websocket' && (
          <View style={styles.inputRow}>
            <AppText variant="muted" style={styles.label}>Edge WS URL:</AppText>
            <TextInput
              accessible={true}
              accessibilityLabel="Edge WebSocket URL"
              style={[styles.input, { color: theme.color, borderColor: theme.border }]}
              value={customWsUrl}
              onChangeText={setCustomWsUrl}
              placeholder="wss://relay.your-edge.workers.dev"
              placeholderTextColor={theme.muted}
            />
          </View>
        )}

        <View style={styles.roomActionsRow}>
          <AppButton
            variant="ghost"
            tone="primary"
            size="sm"
            label="Generate New Room Code"
            onPress={handleCreateNewRoom}
          />
        </View>
      </AppCard>

      {/* Dual Simulation: Peer Interaction */}
      <AppCard variant="outlined" style={styles.card}>
        <AppTitle level={3}>Dual Simulated Clients</AppTitle>
        <AppText variant="muted">
          Simulating two players communicating via the Edge Room Relay. Actions sent by Alice are delivered to Bob with realistic edge network latency.
        </AppText>

        <View style={styles.dualPeersContainer}>
          {/* Alice's Terminal */}
          <View style={[styles.peerPanel, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={styles.peerHeader}>
              <AppTitle level={3} style={styles.peerName}>Alice (Host)</AppTitle>
              <AppBadge
                label={hostRelay.status === 'connected' ? 'LIVE' : 'OFF'}
                tone={getStatusTone(hostRelay.status)}
                size="sm"
              />
            </View>
            <View style={styles.peerActions}>
              <AppButton
                variant="solid"
                tone="primary"
                size="sm"
                label="Play Ace ♠"
                onPress={() =>
                  hostRelay.send('CARD_PLAYED', { card: 'A♠', player: 'Alice' })
                }
              />
              <AppButton
                variant="soft"
                tone="primary"
                size="sm"
                label="Deal 4 Cards"
                onPress={() =>
                  hostRelay.send('DEAL_CARDS', { count: 4, timestamp: Date.now() })
                }
              />
              <AppButton
                variant="outline"
                tone="neutral"
                size="sm"
                label="Pass Turn"
                onPress={() => hostRelay.send('PASS_TURN', { player: 'Alice' })}
              />
            </View>
          </View>

          {/* Bob's Terminal */}
          <View style={[styles.peerPanel, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <View style={styles.peerHeader}>
              <AppTitle level={3} style={styles.peerName}>Bob (Guest)</AppTitle>
              <AppBadge
                label={guestRelay.status === 'connected' ? 'LIVE' : 'OFF'}
                tone={getStatusTone(guestRelay.status)}
                size="sm"
              />
            </View>
            <View style={styles.peerActions}>
              <AppButton
                variant="solid"
                tone="danger"
                size="sm"
                label="Play King ♥"
                onPress={() =>
                  guestRelay.send('CARD_PLAYED', { card: 'K♥', player: 'Bob' })
                }
              />
              <AppButton
                variant="soft"
                tone="neutral"
                size="sm"
                label="Chat: Hello!"
                onPress={() =>
                  guestRelay.send('CHAT', { message: 'Ready to play!', player: 'Bob' })
                }
              />
              <AppButton
                variant="outline"
                tone="neutral"
                size="sm"
                label="Pass Turn"
                onPress={() => guestRelay.send('PASS_TURN', { player: 'Bob' })}
              />
            </View>
          </View>
        </View>
      </AppCard>

      {/* Realtime Event Stream Log */}
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.logHeader}>
          <AppTitle level={3}>Edge Event Feed ({hostRelay.history.length})</AppTitle>
          <AppButton
            variant="ghost"
            tone="primary"
            size="sm"
            label="Clear"
            onPress={hostRelay.clearHistory}
          />
        </View>

        {hostRelay.history.length === 0 ? (
          <AppText variant="muted" style={styles.emptyLogText}>
            No room events yet. Connect and click an action above to broadcast.
          </AppText>
        ) : (
          hostRelay.history.slice(0, 10).map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.logItem,
                { borderBottomColor: theme.border },
              ]}
            >
              <View style={styles.logMeta}>
                <AppText style={[styles.logSender, { color: theme.primary }]}>
                  {msg.senderName}
                </AppText>
                <AppText style={styles.logType}>
                  {msg.type}
                </AppText>
                {msg.latencyMs !== undefined && (
                  <AppBadge
                    label={`+${msg.latencyMs}ms`}
                    tone="success"
                    size="sm"
                    variant="soft"
                  />
                )}
              </View>
              <AppText variant="muted" style={styles.logPayload}>
                {JSON.stringify(msg.payload)}
              </AppText>
            </View>
          ))
        )}
      </AppCard>
    </ScrollView>
  );
}

// ============================================================================
// Scenario 2: 3D Flip & Card Visuals
// ============================================================================

function CardFlipScenario({ physics }: { physics: CardPhysicsConfig }) {
  const [globalFaceUp, setGlobalFaceUp] = useState(true);
  const [cardStates, setCardStates] = useState<Record<string, boolean>>({
    c1: true,
    c2: true,
    c3: false,
    c4: true,
  });
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');

  const toggleSingle = (id: string) => {
    setCardStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const flipAll = () => {
    const next = !globalFaceUp;
    setGlobalFaceUp(next);
    setCardStates({
      c1: next,
      c2: next,
      c3: next,
      c4: next,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <AppCard variant="outlined" style={styles.card}>
        <AppTitle level={3}>3D Perspective Flip with Parabolic Lift</AppTitle>
        <AppText variant="muted">
          Reanimated 4 3D worklet with perspective 1000, backface isolation, and mid-flip parabolic elevation translateY to simulate lifting off the table.
        </AppText>

        <View style={styles.flipControlRow}>
          <AppButton
            variant="solid"
            tone="primary"
            size="sm"
            label={globalFaceUp ? 'Flip All to Back' : 'Flip All to Front'}
            onPress={flipAll}
          />

          <AppSegmentedControl
            value={cardSize}
            options={[
              { label: 'Small', value: 'sm' },
              { label: 'Medium', value: 'md' },
              { label: 'Large', value: 'lg' },
            ]}
            onChange={(val) => setCardSize(val as 'sm' | 'md' | 'lg')}
          />
        </View>

        {/* 4 Interactive Flip Cards */}
        <View style={styles.flipGrid}>
          <View style={styles.flipItem}>
            <FlipCard
              suit="spades"
              rank="A"
              faceUp={cardStates.c1}
              size={cardSize}
              springDamping={physics.springDamping}
              springStiffness={physics.springStiffness}
              onPress={() => toggleSingle('c1')}
            />
            <AppText variant="muted" style={styles.cardLabel}>
              Ace of Spades
            </AppText>
          </View>

          <View style={styles.flipItem}>
            <FlipCard
              suit="hearts"
              rank="K"
              faceUp={cardStates.c2}
              size={cardSize}
              springDamping={physics.springDamping}
              springStiffness={physics.springStiffness}
              onPress={() => toggleSingle('c2')}
            />
            <AppText variant="muted" style={styles.cardLabel}>
              King of Hearts
            </AppText>
          </View>

          <View style={styles.flipItem}>
            <FlipCard
              suit="diamonds"
              rank="Q"
              faceUp={cardStates.c3}
              size={cardSize}
              springDamping={physics.springDamping}
              springStiffness={physics.springStiffness}
              onPress={() => toggleSingle('c3')}
            />
            <AppText variant="muted" style={styles.cardLabel}>
              Queen of Diamonds
            </AppText>
          </View>

          <View style={styles.flipItem}>
            <FlipCard
              suit="clubs"
              rank="J"
              faceUp={cardStates.c4}
              size={cardSize}
              springDamping={physics.springDamping}
              springStiffness={physics.springStiffness}
              onPress={() => toggleSingle('c4')}
            />
            <AppText variant="muted" style={styles.cardLabel}>
              Jack of Clubs
            </AppText>
          </View>
        </View>
      </AppCard>

      {/* Interactive 3D Flip with Spatial Translation (Dealing Arc) */}
      <AppCard variant="outlined" style={[styles.card, { overflow: 'visible' }]}>
        <AppTitle level={3}>3D Flip + Spatial Translation (Dealing Arc)</AppTitle>
        <AppText variant="muted">
          Dynamic deal from Dealer slot to Player slot: simultaneous horizontal translation, parabolic elevation arc, and 180° Reanimated 3D flip.
        </AppText>

        <FlipWithTranslationDemo flightDuration={physics.flightDuration} />
      </AppCard>

      {/* Showcase of all 4 Suits & Royals */}
      <AppCard variant="outlined" style={styles.card}>
        <AppTitle level={3}>Suit & Royal Presentation</AppTitle>
        <AppText variant="muted">
          Standard poker ratio, corner pips with inverted orientation, royal badges, and tactile drop shadows.
        </AppText>

        <View style={styles.suitRow}>
          <PlayingCard suit="spades" rank="10" size="sm" />
          <PlayingCard suit="hearts" rank="10" size="sm" />
          <PlayingCard suit="diamonds" rank="10" size="sm" />
          <PlayingCard suit="clubs" rank="10" size="sm" />
        </View>
      </AppCard>
    </ScrollView>
  );
}

function FlipWithTranslationDemo({ flightDuration }: { flightDuration: number }) {
  const { theme } = useLightDark();
  const [atDestination, setAtDestination] = useState(false);
  const [flightKey, setFlightKey] = useState(0);

  const toggleTravel = () => {
    setAtDestination((prev) => !prev);
    setFlightKey((k) => k + 1);
  };

  const from = atDestination ? { x: 90, y: 0 } : { x: -90, y: 0 };
  const to = atDestination ? { x: -90, y: 0 } : { x: 90, y: 0 };

  return (
    <View style={[styles.travelTrackContainer, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, borderWidth: 1 }]}>
      <View style={styles.trackLane}>
        <View style={[styles.trackSlot, { borderColor: theme.border }]}>
          <AppText style={[styles.slotLabel, { color: theme.muted }]}>DEALER (BACK)</AppText>
        </View>
        <View style={[styles.trackSlot, { borderColor: theme.border }]}>
          <AppText style={[styles.slotLabel, { color: theme.muted }]}>PLAYER (FRONT)</AppText>
        </View>
      </View>

      <View style={styles.travelingCardWrapper}>
        <FlyingCard
          key={flightKey}
          card={{ id: 'demo_ace', suit: 'spades', rank: 'A' }}
          from={from}
          to={to}
          flipOnFly={true}
          durationMs={flightDuration}
          size="md"
        />
      </View>

      <View style={styles.travelControlRow}>
        <AppButton
          variant="solid"
          tone="primary"
          size="sm"
          label={atDestination ? '⬅ Return to Dealer (Flip Down)' : 'Deal to Player ➔ (Flip Face-Up)'}
          onPress={toggleTravel}
        />
        <AppBadge
          label={atDestination ? 'Player Slot (Face Up)' : 'Dealer Slot (Face Down)'}
          tone={atDestination ? 'success' : 'neutral'}
          variant="soft"
          size="sm"
        />
      </View>
    </View>
  );
}

// ============================================================================
// Scenario 3: Hand Fan Layout & Kinetics
// ============================================================================

function CardHandScenario({ physics }: { physics: CardPhysicsConfig }) {
  const initialHand: PlayingCardData[] = useMemo(
    () => [
      { id: 'h1', suit: 'spades', rank: 'A' },
      { id: 'h2', suit: 'hearts', rank: 'K' },
      { id: 'h3', suit: 'diamonds', rank: 'Q' },
      { id: 'h4', suit: 'clubs', rank: 'J' },
      { id: 'h5', suit: 'spades', rank: '10' },
    ],
    [],
  );

  const [hand, setHand] = useState<PlayingCardData[]>(initialHand);
  const [selectedCardId, setSelectedCardId] = useState<string | null>('h2');
  const [spreadAngle, setSpreadAngle] = useState(6);
  const [arcCurvature, setArcCurvature] = useState(4);
  const [cardSpacing, setCardSpacing] = useState(38);

  const handleSelectCard = (card: PlayingCardData) => {
    setSelectedCardId((prev) => (prev === card.id ? null : card.id));
  };

  const handleAddCard = () => {
    const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    const newCard: PlayingCardData = {
      id: `c_${Date.now()}_${Math.random()}`,
      suit: randomSuit,
      rank: randomRank,
    };
    setHand((prev) => [...prev, newCard]);
  };

  const handleRemoveSelected = () => {
    if (!selectedCardId) return;
    setHand((prev) => prev.filter((c) => c.id !== selectedCardId));
    setSelectedCardId(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Hand Fan Stage */}
      <AppCard variant="outlined" style={[styles.card, { overflow: 'visible' }]}>
        <AppTitle level={3}>Interactive Fan Hand</AppTitle>
        <AppText variant="muted">
          Rotational arc math with spring kinetics. Tap a card to elevate and inspect it.
        </AppText>

        <View style={styles.handStage}>
          <CardHand
            cards={hand}
            selectedCardId={selectedCardId}
            onSelectCard={handleSelectCard}
            spreadAngle={spreadAngle}
            arcCurvature={arcCurvature}
            cardSpacing={cardSpacing}
            size="md"
            springDamping={physics.springDamping}
            springStiffness={physics.springStiffness}
          />
        </View>

        {/* Hand Action Buttons */}
        <View style={styles.handControlsRow}>
          <AppButton
            variant="solid"
            tone="primary"
            size="sm"
            label="+ Draw Card"
            onPress={handleAddCard}
          />
          <AppButton
            variant="outline"
            tone="danger"
            size="sm"
            label="Discard Selected"
            disabled={!selectedCardId}
            onPress={handleRemoveSelected}
          />
          <AppButton
            variant="soft"
            tone="neutral"
            size="sm"
            label="Shuffle"
            onPress={() => {
              setHand([...hand].sort(() => Math.random() - 0.5));
            }}
          />
        </View>
      </AppCard>

      {/* Arc Geometry Sliders */}
      <AppCard variant="outlined" style={styles.card}>
        <AppTitle level={3}>Fan Geometry Tuning</AppTitle>
        <ConfigSlider
          label={`Spread Angle (${spreadAngle}°)`}
          value={spreadAngle}
          min={0}
          max={14}
          step={1}
          onChange={setSpreadAngle}
        />
        <ConfigSlider
          label={`Arc Curvature (${arcCurvature}px)`}
          value={arcCurvature}
          min={0}
          max={12}
          step={1}
          onChange={setArcCurvature}
        />
        <ConfigSlider
          label={`Card Spacing (${cardSpacing}px)`}
          value={cardSpacing}
          min={24}
          max={60}
          step={2}
          onChange={setCardSpacing}
        />
      </AppCard>
    </ScrollView>
  );
}

// ============================================================================
// Scenario 4: Table Play & Kinetic Flight (No Teleportation)
// ============================================================================

interface ActiveFlight {
  id: string;
  card: PlayingCardData;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromRotation?: number;
  targetRotation: number;
  flipOnFly: boolean;
  destination: 'hand' | 'table';
}

function CardTableScenario({ physics }: { physics: CardPhysicsConfig }) {
  const [deck, setDeck] = useState<PlayingCardData[]>([
    { id: 'd1', suit: 'spades', rank: 'A' },
    { id: 'd2', suit: 'hearts', rank: '7' },
    { id: 'd3', suit: 'clubs', rank: '8' },
    { id: 'd4', suit: 'diamonds', rank: 'K' },
    { id: 'd5', suit: 'hearts', rank: 'J' },
    { id: 'd6', suit: 'diamonds', rank: '4' },
    { id: 'd7', suit: 'spades', rank: 'Q' },
  ]);

  const [hand, setHand] = useState<PlayingCardData[]>([
    { id: 'h1', suit: 'spades', rank: 'K' },
    { id: 'h2', suit: 'hearts', rank: 'A' },
    { id: 'h3', suit: 'diamonds', rank: '10' },
  ]);

  const [playedPile, setPlayedPile] = useState<(PlayingCardData & { rotation?: number })[]>([
    { id: 'p0', suit: 'clubs', rank: 'Q', rotation: -4 },
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFlight, setActiveFlight] = useState<ActiveFlight | null>(null);

  // Dynamic layout measurements relative to tableArena coordinate root
  const [tableCardLayout, setTableCardLayout] = useState({ x: 0, y: 0, width: 340, height: 280 });
  const [tableMatLayout, setTableMatLayout] = useState({ x: 16, y: 70, width: 308, height: 210 });
  const [deckLayout, setDeckLayout] = useState({ x: 30, y: 55, width: 64, height: 92 });
  const [playZoneLayout, setPlayZoneLayout] = useState({ x: 160, y: 55, width: 76, height: 110 });

  const [handCardLayout, setHandCardLayout] = useState({ x: 0, y: 340, width: 340, height: 280 });
  const [handStageLayout, setHandStageLayout] = useState({ x: 16, y: 56, width: 308, height: 190 });

  // Calculate pixel-accurate centers in arena coordinate space
  const deckCoord = useMemo(() => {
    return {
      x: Math.round(tableCardLayout.x + tableMatLayout.x + deckLayout.x + (deckLayout.width - 76) / 2),
      y: Math.round(tableCardLayout.y + tableMatLayout.y + deckLayout.y + (deckLayout.height - 110) / 2),
    };
  }, [tableCardLayout, tableMatLayout, deckLayout]);

  const tableCoord = useMemo(() => {
    return {
      x: Math.round(tableCardLayout.x + tableMatLayout.x + playZoneLayout.x + (playZoneLayout.width - 76) / 2),
      y: Math.round(tableCardLayout.y + tableMatLayout.y + playZoneLayout.y + (playZoneLayout.height - 110) / 2),
    };
  }, [tableCardLayout, tableMatLayout, playZoneLayout]);

  const HAND_CARD_SPACING = 36;
  const HAND_SPREAD_ANGLE = 5;
  const HAND_ARC_CURVATURE = 3;
  const MAX_HAND_SPAN = 270;

  const getHandCardCoord = useCallback((cardIndex: number, totalCards: number) => {
    const normalized = totalCards > 1 ? cardIndex - (totalCards - 1) / 2 : 0;
    const cardSpacing = totalCards > 1 ? Math.min(HAND_CARD_SPACING, MAX_HAND_SPAN / (totalCards - 1)) : HAND_CARD_SPACING;
    const handCenterX = handCardLayout.x + handStageLayout.x + (handStageLayout.width - 76) / 2;
    const handCenterY = handCardLayout.y + handStageLayout.y + (handStageLayout.height - 110) / 2;

    return {
      x: Math.round(handCenterX + normalized * cardSpacing),
      y: Math.round(handCenterY + Math.abs(normalized) * HAND_ARC_CURVATURE),
    };
  }, [handCardLayout, handStageLayout]);

  const getHandCardRotation = useCallback((cardIndex: number, totalCards: number) => {
    const normalized = totalCards > 1 ? cardIndex - (totalCards - 1) / 2 : 0;
    return Math.round(normalized * HAND_SPREAD_ANGLE);
  }, []);

  const handleDraw = () => {
    if (deck.length === 0 || activeFlight) return;
    const [drawn, ...remaining] = deck;
    setDeck(remaining);

    const targetIndex = hand.length;
    const newTotal = hand.length + 1;
    const targetCoord = getHandCardCoord(targetIndex, newTotal);
    const targetRotation = getHandCardRotation(targetIndex, newTotal);

    // Immediately add to hand marked as arriving:
    // Existing sibling cards immediately begin their smooth Reanimated spring
    // transition to open up the slot *concurrently* while the card flies!
    setHand((prev) => [...prev, { ...drawn, isArriving: true }]);

    setActiveFlight({
      id: `flight_${Date.now()}`,
      card: drawn,
      from: deckCoord,
      to: targetCoord,
      fromRotation: 0,
      targetRotation,
      flipOnFly: physics.flipOnFly,
      destination: 'hand',
    });
  };

  const handlePlayCard = (cardToPlay: PlayingCardData) => {
    if (activeFlight) return;
    const cardIndex = hand.findIndex((c) => c.id === cardToPlay.id);
    if (cardIndex === -1) return;

    const sourceCoord = getHandCardCoord(cardIndex, hand.length);
    const sourceRotation = getHandCardRotation(cardIndex, hand.length);
    const randomTilt = Math.round((Math.random() - 0.5) * 18);

    // Immediately remove from hand so remaining sibling cards
    // smoothly spring together to close the gap *during* flight
    setHand((prev) => prev.filter((c) => c.id !== cardToPlay.id));
    if (selectedId === cardToPlay.id) {
      setSelectedId(null);
    }

    setActiveFlight({
      id: `flight_${Date.now()}`,
      card: cardToPlay,
      from: sourceCoord,
      to: tableCoord,
      fromRotation: sourceRotation,
      targetRotation: randomTilt,
      flipOnFly: false,
      destination: 'table',
    });
  };

  const handlePlaySelected = () => {
    if (!selectedId || activeFlight) return;
    const cardToPlay = hand.find((c) => c.id === selectedId);
    if (cardToPlay) {
      handlePlayCard(cardToPlay);
    }
  };


  const handleFlightComplete = React.useCallback(() => {
    if (!activeFlight) return;

    if (activeFlight.destination === 'hand') {
      // Reveal the arrived card seamlessly in its opened slot
      setHand((prev) =>
        prev.map((c) => (c.id === activeFlight.card.id ? { ...c, isArriving: false } : c)),
      );
    } else {
      // Land card onto the played table pile
      setPlayedPile((prev) => [
        ...prev,
        { ...activeFlight.card, rotation: activeFlight.targetRotation },
      ]);
    }

    setActiveFlight(null);
  }, [activeFlight]);

  const handleReset = () => {
    setActiveFlight(null);
    setDeck([
      { id: 'd1', suit: 'spades', rank: 'A' },
      { id: 'd2', suit: 'hearts', rank: '7' },
      { id: 'd3', suit: 'clubs', rank: '8' },
      { id: 'd4', suit: 'diamonds', rank: 'K' },
      { id: 'd5', suit: 'hearts', rank: 'J' },
      { id: 'd6', suit: 'diamonds', rank: '4' },
      { id: 'd7', suit: 'spades', rank: 'Q' },
    ]);
    setHand([
      { id: 'h1', suit: 'spades', rank: 'K' },
      { id: 'h2', suit: 'hearts', rank: 'A' },
      { id: 'h3', suit: 'diamonds', rank: '10' },
    ]);
    setPlayedPile([{ id: 'p0', suit: 'clubs', rank: 'Q', rotation: -4 }]);
    setSelectedId(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.tableArena}>
        {/* Flight Animation Overlay anchored inside table arena */}
        {activeFlight && (
          <FlyingCard
            key={activeFlight.id}
            card={activeFlight.card}
            from={activeFlight.from}
            to={activeFlight.to}
            fromRotation={activeFlight.fromRotation}
            targetRotation={activeFlight.targetRotation}
            flipOnFly={activeFlight.flipOnFly}
            durationMs={physics.flightDuration}
            onComplete={handleFlightComplete}
            size="md"
          />
        )}

        {/* Casino Mat Table */}
        <View onLayout={(e) => setTableCardLayout(e.nativeEvent.layout)}>
          <AppCard variant="outlined" style={[styles.card, { overflow: 'visible' }]}>
            <AppTitle level={3}>Table Center & Deck</AppTitle>
            <AppText variant="muted">
              Draw cards from deck, tap a card in your hand, then play to table. Cards fly across the felt mat along physical parabolic trajectories without teleporting.
            </AppText>

            <CardTable
              deckCount={deck.length}
              playedCards={playedPile}
              onDrawCard={handleDraw}
              onTablePress={handlePlaySelected}
              onMatLayout={setTableMatLayout}
              onDeckLayout={setDeckLayout}
              onPlayZoneLayout={setPlayZoneLayout}
              activePrompt={
                activeFlight
                  ? 'Card in Flight...'
                  : selectedId
                    ? 'Swipe Up or Tap Table to Play'
                    : 'Swipe Up Card to Play, or Tap Deck to Draw'
              }
            />
          </AppCard>
        </View>

        {/* Player's Active Hand */}
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
                  disabled={!selectedId || activeFlight !== null}
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
                cardSpacing={36}
                spreadAngle={5}
                arcCurvature={3}
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
                onPress={handleReset}
              />
            </View>
          </AppCard>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  label: {
    fontSize: 13,
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  roomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  dualPeersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  peerPanel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  peerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  peerActions: {
    gap: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyLogText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  logItem: {
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logSender: {
    fontSize: 12,
    fontWeight: '700',
  },
  logType: {
    fontSize: 12,
    fontWeight: '600',
  },
  logPayload: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  tableArena: {
    position: 'relative',
    gap: 16,
  },
  flipControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  flipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  flipItem: {
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  suitRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  handStage: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginVertical: 8,
  },
  handControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
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
  travelTrackContainer: {
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 12,
    overflow: 'visible',
  },
  trackLane: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    position: 'absolute',
    top: 20,
  },
  trackSlot: {
    width: 76,
    height: 110,
    borderRadius: 9,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  travelingCardWrapper: {
    position: 'absolute',
    top: 20,
    width: 76,
    height: 110,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cardFaceLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
  },
  travelControlRow: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
  },
});
