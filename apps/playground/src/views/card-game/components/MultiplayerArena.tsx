import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useLightDark } from '../../../providers/theme';
import AppCard from '../../../components/AppCard';
import AppButton from '../../../components/AppButton';
import AppBadge from '../../../components/AppBadge';
import AppTitle, { AppText } from '../../../components/AppTitle';
import AppSegmentedControl from '../../../components/AppSegmentedControl';
import { CardTable } from './CardTable';
import { CardHand } from './CardHand';
import { FlyingCard } from './FlyingCard';
import { useRoomRelay, generateRoomCode } from '@alambre/room-relay';
import type { CardPhysicsConfig } from '../CardGameTestbed';
import type { PlayingCardData } from '../types';

export interface ActiveFlight {
  id: string;
  card: PlayingCardData;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromRotation?: number;
  targetRotation: number;
  flipOnFly: boolean;
  destination: 'hand' | 'table';
}

const INITIAL_DECK: PlayingCardData[] = [
  { id: 'c1', suit: 'spades', rank: 'A' },
  { id: 'c2', suit: 'hearts', rank: 'K' },
  { id: 'c3', suit: 'diamonds', rank: 'Q' },
  { id: 'c4', suit: 'clubs', rank: 'J' },
  { id: 'c5', suit: 'spades', rank: '10' },
  { id: 'c6', suit: 'hearts', rank: '9' },
  { id: 'c7', suit: 'diamonds', rank: '8' },
  { id: 'c8', suit: 'clubs', rank: '7' },
  { id: 'c9', suit: 'spades', rank: '6' },
  { id: 'c10', suit: 'hearts', rank: '5' },
  { id: 'c11', suit: 'diamonds', rank: '4' },
  { id: 'c12', suit: 'clubs', rank: '3' },
  { id: 'c13', suit: 'spades', rank: '2' },
  { id: 'c14', suit: 'hearts', rank: 'A' },
  { id: 'c15', suit: 'diamonds', rank: 'K' },
  { id: 'c16', suit: 'clubs', rank: 'Q' },
];

type BoardCoords = {
  deckCoord: { x: number; y: number };
  tableCoord: { x: number; y: number };
  opponentCoord: { x: number; y: number };
  getHandCardCoord: (i: number, total: number) => { x: number; y: number };
  getHandCardRotation: (i: number, total: number) => number;
};

const DEFAULT_COORDS: BoardCoords = {
  deckCoord: { x: 46, y: 110 },
  tableCoord: { x: 176, y: 110 },
  opponentCoord: { x: 176, y: 30 },
  getHandCardCoord: () => ({ x: 176, y: 395 }),
  getHandCardRotation: () => 0,
};

export type CardGameRelayEvents = {
  GAME_DEAL: {
    aliceHand: PlayingCardData[];
    bobHand: PlayingCardData[];
    deckRemaining: PlayingCardData[];
    turn: 'alice' | 'bob';
  };
  CARD_PLAY: {
    playerId: 'alice' | 'bob';
    card: PlayingCardData;
    targetRotation: number;
    nextTurn: 'alice' | 'bob';
  };
  CARD_DRAW: {
    playerId: 'alice' | 'bob';
    card: PlayingCardData;
    nextTurn: 'alice' | 'bob';
  };
  GAME_RESET: {
    deck: PlayingCardData[];
  };
  [key: string]: unknown;
};

export function MultiplayerArena({ physics }: { physics: CardPhysicsConfig }) {
  const { theme } = useLightDark();

  const [activeRoomCode, setActiveRoomCode] = useState('XK89');
  const [transportMode, setTransportMode] = useState<'simulated' | 'websocket'>('simulated');
  const [customWsUrl, setCustomWsUrl] = useState('ws://localhost:8787');
  const [perspective, setPerspective] = useState<'alice' | 'bob' | 'dual'>('alice');

  // Client 1: Host (Alice)
  const hostRelay = useRoomRelay<CardGameRelayEvents>({
    roomCode: activeRoomCode,
    playerName: 'Alice (Host)',
    isHost: true,
    mode: transportMode,
    serverUrl: customWsUrl,
  });

  // Client 2: Guest (Bob)
  const guestRelay = useRoomRelay<CardGameRelayEvents>({
    roomCode: activeRoomCode,
    playerName: 'Bob',
    isHost: false,
    mode: transportMode,
    serverUrl: customWsUrl,
  });

  // Shared synchronized game state
  const [deck, setDeck] = useState<PlayingCardData[]>(INITIAL_DECK);
  const [aliceHand, setAliceHand] = useState<PlayingCardData[]>([]);
  const [bobHand, setBobHand] = useState<PlayingCardData[]>([]);
  const [playedPile, setPlayedPile] = useState<(PlayingCardData & { rotation?: number })[]>([
    { id: 'p0', suit: 'diamonds', rank: '7', rotation: -5 },
  ]);
  const [currentTurn, setCurrentTurn] = useState<'alice' | 'bob'>('alice');
  const [lastAction, setLastAction] = useState<string>('Room connected. Tap "Deal 5 Cards" to begin.');

  const [aliceSelectedId, setAliceSelectedId] = useState<string | null>(null);
  const [bobSelectedId, setBobSelectedId] = useState<string | null>(null);

  const [aliceFlight, setAliceFlight] = useState<ActiveFlight | null>(null);
  const [bobFlight, setBobFlight] = useState<ActiveFlight | null>(null);

  // Layout coordinate helpers ref for Alice and Bob boards
  const aliceCoordsRef = useRef<BoardCoords>(DEFAULT_COORDS);
  const bobCoordsRef = useRef<BoardCoords>(DEFAULT_COORDS);

  // Relay Message Listeners: Host (Alice)
  useEffect(() => {
    const unsubPlay = hostRelay.on('CARD_PLAY', (data) => {
      if (data.playerId === 'bob') {
        // Bob played: Alice observes incoming flight from Opponent zone to Table
        setAliceFlight({
          id: `flight_bob_${Date.now()}`,
          card: data.card,
          from: aliceCoordsRef.current.opponentCoord,
          to: aliceCoordsRef.current.tableCoord,
          targetRotation: data.targetRotation,
          flipOnFly: false,
          destination: 'table',
        });
        setBobHand((prev) => prev.filter((c) => c.id !== data.card.id));
        setCurrentTurn(data.nextTurn);
        setLastAction(`Bob played ${data.card.rank} of ${data.card.suit}. Alice's turn!`);
      }
    });

    const unsubDraw = hostRelay.on('CARD_DRAW', (data) => {
      if (data.playerId === 'bob') {
        setAliceFlight({
          id: `flight_draw_bob_${Date.now()}`,
          card: data.card,
          from: aliceCoordsRef.current.deckCoord,
          to: aliceCoordsRef.current.opponentCoord,
          targetRotation: 0,
          flipOnFly: true,
          destination: 'hand',
        });
        setDeck((prev) => prev.filter((c) => c.id !== data.card.id));
        setBobHand((prev) => [...prev, data.card]);
        setCurrentTurn(data.nextTurn);
        setLastAction('Bob drew a card. Alice\'s turn!');
      }
    });

    return () => {
      unsubPlay();
      unsubDraw();
    };
  }, [hostRelay]);

  // Relay Message Listeners: Guest (Bob)
  useEffect(() => {
    const unsubDeal = guestRelay.on('GAME_DEAL', (data) => {
      setAliceHand(data.aliceHand);
      setBobHand(data.bobHand);
      setDeck(data.deckRemaining);
      setCurrentTurn(data.turn);
      setPlayedPile([{ id: 'p0', suit: 'diamonds', rank: '7', rotation: -5 }]);
      setLastAction('Alice dealt 5 cards to each player. Alice goes first!');
    });

    const unsubPlay = guestRelay.on('CARD_PLAY', (data) => {
      if (data.playerId === 'alice') {
        // Alice played: Bob observes incoming flight from Opponent zone to Table
        setBobFlight({
          id: `flight_alice_${Date.now()}`,
          card: data.card,
          from: bobCoordsRef.current.opponentCoord,
          to: bobCoordsRef.current.tableCoord,
          targetRotation: data.targetRotation,
          flipOnFly: false,
          destination: 'table',
        });
        setAliceHand((prev) => prev.filter((c) => c.id !== data.card.id));
        setCurrentTurn(data.nextTurn);
        setLastAction(`Alice played ${data.card.rank} of ${data.card.suit}. Bob's turn!`);
      }
    });

    const unsubDraw = guestRelay.on('CARD_DRAW', (data) => {
      if (data.playerId === 'alice') {
        setBobFlight({
          id: `flight_draw_alice_${Date.now()}`,
          card: data.card,
          from: bobCoordsRef.current.deckCoord,
          to: bobCoordsRef.current.opponentCoord,
          targetRotation: 0,
          flipOnFly: true,
          destination: 'hand',
        });
        setDeck((prev) => prev.filter((c) => c.id !== data.card.id));
        setAliceHand((prev) => [...prev, data.card]);
        setCurrentTurn(data.nextTurn);
        setLastAction('Alice drew a card. Bob\'s turn!');
      }
    });

    const unsubReset = guestRelay.on('GAME_RESET', (data) => {
      setDeck(data.deck);
      setAliceHand([]);
      setBobHand([]);
      setPlayedPile([{ id: 'p0', suit: 'diamonds', rank: '7', rotation: -5 }]);
      setCurrentTurn('alice');
      setLastAction('Game reset by Host.');
    });

    return () => {
      unsubDeal();
      unsubPlay();
      unsubDraw();
      unsubReset();
    };
  }, [guestRelay]);


  // Deal Action (Host initiates)
  const handleDealGame = () => {
    if (deck.length < 10) return;
    const shuffled = [...INITIAL_DECK].sort(() => Math.random() - 0.5);
    const aHand = shuffled.slice(0, 5);
    const bHand = shuffled.slice(5, 10);
    const remDeck = shuffled.slice(10);

    setAliceHand(aHand);
    setBobHand(bHand);
    setDeck(remDeck);
    setCurrentTurn('alice');
    setPlayedPile([{ id: 'p0', suit: 'diamonds', rank: '7', rotation: -5 }]);
    setLastAction('Alice dealt 5 cards to each player. Alice goes first!');

    hostRelay.send('GAME_DEAL', {
      aliceHand: aHand,
      bobHand: bHand,
      deckRemaining: remDeck,
      turn: 'alice',
    });
  };

  // Alice Plays Card
  const handleAlicePlayCard = (cardToPlay: PlayingCardData) => {
    if (currentTurn !== 'alice' || aliceFlight) return;
    const cardIndex = aliceHand.findIndex((c) => c.id === cardToPlay.id);
    if (cardIndex === -1) return;

    const sourceCoord = aliceCoordsRef.current.getHandCardCoord(cardIndex, aliceHand.length);
    const sourceRotation = aliceCoordsRef.current.getHandCardRotation(cardIndex, aliceHand.length);
    const randomTilt = Math.round((Math.random() - 0.5) * 18);

    setAliceHand((prev) => prev.filter((c) => c.id !== cardToPlay.id));
    setAliceSelectedId(null);

    setAliceFlight({
      id: `flight_${Date.now()}`,
      card: cardToPlay,
      from: sourceCoord,
      to: aliceCoordsRef.current.tableCoord,
      fromRotation: sourceRotation,
      targetRotation: randomTilt,
      flipOnFly: false,
      destination: 'table',
    });

    setCurrentTurn('bob');
    setLastAction(`Alice played ${cardToPlay.rank} of ${cardToPlay.suit}. Bob's turn!`);

    hostRelay.send('CARD_PLAY', {
      playerId: 'alice',
      card: cardToPlay,
      targetRotation: randomTilt,
      nextTurn: 'bob',
    });
  };

  // Bob Plays Card
  const handleBobPlayCard = (cardToPlay: PlayingCardData) => {
    if (currentTurn !== 'bob' || bobFlight) return;
    const cardIndex = bobHand.findIndex((c) => c.id === cardToPlay.id);
    if (cardIndex === -1) return;

    const sourceCoord = bobCoordsRef.current.getHandCardCoord(cardIndex, bobHand.length);
    const sourceRotation = bobCoordsRef.current.getHandCardRotation(cardIndex, bobHand.length);
    const randomTilt = Math.round((Math.random() - 0.5) * 18);

    setBobHand((prev) => prev.filter((c) => c.id !== cardToPlay.id));
    setBobSelectedId(null);

    setBobFlight({
      id: `flight_${Date.now()}`,
      card: cardToPlay,
      from: sourceCoord,
      to: bobCoordsRef.current.tableCoord,
      fromRotation: sourceRotation,
      targetRotation: randomTilt,
      flipOnFly: false,
      destination: 'table',
    });

    setCurrentTurn('alice');
    setLastAction(`Bob played ${cardToPlay.rank} of ${cardToPlay.suit}. Alice's turn!`);

    guestRelay.send('CARD_PLAY', {
      playerId: 'bob',
      card: cardToPlay,
      targetRotation: randomTilt,
      nextTurn: 'alice',
    });
  };

  // Draw Card from Deck
  const handleDrawCard = (player: 'alice' | 'bob') => {
    if (deck.length === 0) return;
    if (player === 'alice' && (currentTurn !== 'alice' || aliceFlight)) return;
    if (player === 'bob' && (currentTurn !== 'bob' || bobFlight)) return;

    const [drawn, ...remaining] = deck;
    setDeck(remaining);

    if (player === 'alice') {
      const targetIndex = aliceHand.length;
      const targetCoord = aliceCoordsRef.current.getHandCardCoord(targetIndex, aliceHand.length + 1);

      setAliceHand((prev) => [...prev, { ...drawn, isArriving: true }]);
      setAliceFlight({
        id: `flight_draw_${Date.now()}`,
        card: drawn,
        from: aliceCoordsRef.current.deckCoord,
        to: targetCoord,
        targetRotation: 0,
        flipOnFly: physics.flipOnFly,
        destination: 'hand',
      });
      setCurrentTurn('bob');
      setLastAction('Alice drew a card. Bob\'s turn!');

      hostRelay.send('CARD_DRAW', {
        playerId: 'alice',
        card: drawn,
        nextTurn: 'bob',
      });
    } else {
      const targetIndex = bobHand.length;
      const targetCoord = bobCoordsRef.current.getHandCardCoord(targetIndex, bobHand.length + 1);

      setBobHand((prev) => [...prev, { ...drawn, isArriving: true }]);
      setBobFlight({
        id: `flight_draw_${Date.now()}`,
        card: drawn,
        from: bobCoordsRef.current.deckCoord,
        to: targetCoord,
        targetRotation: 0,
        flipOnFly: physics.flipOnFly,
        destination: 'hand',
      });
      setCurrentTurn('alice');
      setLastAction('Bob drew a card. Alice\'s turn!');

      guestRelay.send('CARD_DRAW', {
        playerId: 'bob',
        card: drawn,
        nextTurn: 'alice',
      });
    }
  };

  // Flight Completion
  const handleAliceFlightComplete = useCallback(() => {
    if (!aliceFlight) return;
    if (aliceFlight.destination === 'table') {
      setPlayedPile((prev) => [
        ...prev,
        { ...aliceFlight.card, rotation: aliceFlight.targetRotation },
      ]);
    } else {
      setAliceHand((prev) =>
        prev.map((c) => (c.id === aliceFlight.card.id ? { ...c, isArriving: false } : c)),
      );
    }
    setAliceFlight(null);
  }, [aliceFlight]);

  const handleBobFlightComplete = useCallback(() => {
    if (!bobFlight) return;
    if (bobFlight.destination === 'table') {
      setPlayedPile((prev) => [
        ...prev,
        { ...bobFlight.card, rotation: bobFlight.targetRotation },
      ]);
    } else {
      setBobHand((prev) =>
        prev.map((c) => (c.id === bobFlight.card.id ? { ...c, isArriving: false } : c)),
      );
    }
    setBobFlight(null);
  }, [bobFlight]);

  // Reset Game
  const handleResetGame = () => {
    setAliceFlight(null);
    setBobFlight(null);
    setDeck(INITIAL_DECK);
    setAliceHand([]);
    setBobHand([]);
    setPlayedPile([{ id: 'p0', suit: 'diamonds', rank: '7', rotation: -5 }]);
    setCurrentTurn('alice');
    setLastAction('Game reset by Host.');

    hostRelay.send('GAME_RESET', { deck: INITIAL_DECK });
  };

  const handleNewRoom = () => {
    const newCode = generateRoomCode();
    setActiveRoomCode(newCode);
    hostRelay.joinRoom(newCode);
    guestRelay.joinRoom(newCode);
    handleResetGame();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Room Relay Connection & Transport Bar */}
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.roomTitleRow}>
              <AppTitle level={3}>Room #{activeRoomCode}</AppTitle>
              <AppBadge
                label={hostRelay.status.toUpperCase()}
                tone={hostRelay.status === 'connected' ? 'success' : 'danger'}
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
            <AppText variant="muted" style={styles.roomSubtitle}>
              Low-latency edge synchronization over {transportMode === 'simulated' ? 'in-memory hub' : 'WebSocket'}.
            </AppText>
          </View>

          <AppButton
            variant="outline"
            tone="primary"
            size="sm"
            label="New Room"
            onPress={handleNewRoom}
          />
        </View>

        {/* Transport Mode Switcher */}
        <View style={styles.transportRow}>
          <AppText style={styles.label}>Transport:</AppText>
          <AppSegmentedControl
            options={[
              { label: 'Simulated Hub', value: 'simulated' },
              { label: 'WebSocket Edge', value: 'websocket' },
            ]}
            value={transportMode}
            onChange={(m) => setTransportMode(m as 'simulated' | 'websocket')}
          />
        </View>

        {transportMode === 'websocket' && (
          <View style={styles.wsRow}>
            <AppText style={styles.label}>Edge URL:</AppText>
            <TextInput
              style={[styles.input, { color: theme.color, borderColor: theme.border }]}
              value={customWsUrl}
              onChangeText={setCustomWsUrl}
              placeholder="ws://localhost:8787"
              placeholderTextColor={theme.muted}
            />
          </View>
        )}
      </AppCard>

      {/* Game Match Action Banner */}
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.actionHeaderRow}>
          <View style={styles.turnBadgeRow}>
            <AppText style={styles.turnLabel}>Active Turn:</AppText>
            <AppBadge
              label={currentTurn === 'alice' ? 'ALICE (HOST)' : 'BOB (GUEST)'}
              tone={currentTurn === 'alice' ? 'primary' : 'warning'}
              variant="solid"
              size="md"
            />
          </View>

          <View style={styles.gameButtonRow}>
            <AppButton
              variant="solid"
              tone="primary"
              size="sm"
              label="Deal 5 Cards"
              disabled={deck.length < 10 || aliceFlight !== null || bobFlight !== null}
              onPress={handleDealGame}
            />
            <AppButton
              variant="ghost"
              tone="neutral"
              size="sm"
              label="Reset"
              onPress={handleResetGame}
            />
          </View>
        </View>

        <View style={styles.actionBanner}>
          <AppText style={styles.actionText}>{lastAction}</AppText>
        </View>

        {/* Perspective View Switcher */}
        <View style={styles.perspectiveRow}>
          <AppText style={styles.label}>Perspective:</AppText>
          <AppSegmentedControl
            options={[
              { label: 'Alice View', value: 'alice' },
              { label: 'Bob View', value: 'bob' },
              { label: 'Dual View', value: 'dual' },
            ]}
            value={perspective}
            onChange={(p) => setPerspective(p as 'alice' | 'bob' | 'dual')}
          />
        </View>
      </AppCard>

      {/* Arena Perspective Boards */}
      {(perspective === 'alice' || perspective === 'dual') && (
        <PlayerBoard
          player="alice"
          title="Alice's Perspective (Host)"
          roleBadge="HOST"
          isMyTurn={currentTurn === 'alice'}
          deckCount={deck.length}
          playedCards={playedPile}
          hand={aliceHand}
          opponentName="Bob"
          opponentCardCount={bobHand.length}
          selectedCardId={aliceSelectedId}
          onSelectCard={(c) => setAliceSelectedId(aliceSelectedId === c.id ? null : c.id)}
          onPlayCard={handleAlicePlayCard}
          onDrawCard={() => handleDrawCard('alice')}
          activeFlight={aliceFlight}
          onFlightComplete={handleAliceFlightComplete}
          physics={physics}
          onCoordsReady={(coords) => {
            aliceCoordsRef.current = coords;
          }}
        />
      )}

      {(perspective === 'bob' || perspective === 'dual') && (
        <PlayerBoard
          player="bob"
          title="Bob's Perspective (Guest)"
          roleBadge="GUEST"
          isMyTurn={currentTurn === 'bob'}
          deckCount={deck.length}
          playedCards={playedPile}
          hand={bobHand}
          opponentName="Alice (Host)"
          opponentCardCount={aliceHand.length}
          selectedCardId={bobSelectedId}
          onSelectCard={(c) => setBobSelectedId(bobSelectedId === c.id ? null : c.id)}
          onPlayCard={handleBobPlayCard}
          onDrawCard={() => handleDrawCard('bob')}
          activeFlight={bobFlight}
          onFlightComplete={handleBobFlightComplete}
          physics={physics}
          onCoordsReady={(coords) => {
            bobCoordsRef.current = coords;
          }}
        />
      )}
    </ScrollView>
  );
}

// ============================================================================
// Single Player Board Component (Coordinate Isolated)
// ============================================================================

interface PlayerBoardProps {
  player: 'alice' | 'bob';
  title: string;
  roleBadge: string;
  isMyTurn: boolean;
  deckCount: number;
  playedCards: (PlayingCardData & { rotation?: number })[];
  hand: PlayingCardData[];
  opponentName: string;
  opponentCardCount: number;
  selectedCardId: string | null;
  onSelectCard: (card: PlayingCardData) => void;
  onPlayCard: (card: PlayingCardData) => void;
  onDrawCard: () => void;
  activeFlight: ActiveFlight | null;
  onFlightComplete: () => void;
  physics: CardPhysicsConfig;
  onCoordsReady: (coords: {
    deckCoord: { x: number; y: number };
    tableCoord: { x: number; y: number };
    opponentCoord: { x: number; y: number };
    getHandCardCoord: (i: number, total: number) => { x: number; y: number };
    getHandCardRotation: (i: number, total: number) => number;
  }) => void;
}

function PlayerBoard({
  title,
  roleBadge,
  isMyTurn,
  deckCount,
  playedCards,
  hand,
  opponentName,
  opponentCardCount,
  selectedCardId,
  onSelectCard,
  onPlayCard,
  onDrawCard,
  activeFlight,
  onFlightComplete,
  physics,
  onCoordsReady,
}: PlayerBoardProps) {
  // Measurement state for arena layout
  const [tableCardLayout, setTableCardLayout] = useState({ x: 0, y: 0, width: 340, height: 280 });
  const [tableMatLayout, setTableMatLayout] = useState({ x: 16, y: 70, width: 308, height: 210 });
  const [deckLayout, setDeckLayout] = useState({ x: 30, y: 55, width: 64, height: 92 });
  const [playZoneLayout, setPlayZoneLayout] = useState({ x: 160, y: 55, width: 76, height: 110 });
  const [opponentLayout, setOpponentLayout] = useState({ x: 16, y: 16, width: 308, height: 40 });

  const [handCardLayout, setHandCardLayout] = useState({ x: 0, y: 340, width: 340, height: 280 });
  const [handStageLayout, setHandStageLayout] = useState({ x: 16, y: 56, width: 308, height: 190 });

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

  const opponentCoord = useMemo(() => {
    return {
      x: Math.round(tableCardLayout.x + tableMatLayout.x + opponentLayout.x + (opponentLayout.width - 76) / 2),
      y: Math.round(tableCardLayout.y + tableMatLayout.y + opponentLayout.y + 10),
    };
  }, [tableCardLayout, tableMatLayout, opponentLayout]);

  const getHandCardCoord = useCallback((cardIndex: number, totalCards: number) => {
    const normalized = totalCards > 1 ? cardIndex - (totalCards - 1) / 2 : 0;
    const cardSpacing = totalCards > 1 ? Math.min(36, 270 / (totalCards - 1)) : 36;
    const handCenterX = handCardLayout.x + handStageLayout.x + (handStageLayout.width - 76) / 2;
    const handCenterY = handCardLayout.y + handStageLayout.y + (handStageLayout.height - 110) / 2;

    return {
      x: Math.round(handCenterX + normalized * cardSpacing),
      y: Math.round(handCenterY + Math.abs(normalized) * 3),
    };
  }, [handCardLayout, handStageLayout]);

  const getHandCardRotation = useCallback((cardIndex: number, totalCards: number) => {
    const normalized = totalCards > 1 ? cardIndex - (totalCards - 1) / 2 : 0;
    return Math.round(normalized * 5);
  }, []);

  useEffect(() => {
    onCoordsReady({
      deckCoord,
      tableCoord,
      opponentCoord,
      getHandCardCoord,
      getHandCardRotation,
    });
  }, [
    deckCoord,
    tableCoord,
    opponentCoord,
    getHandCardCoord,
    getHandCardRotation,
    onCoordsReady,
  ]);

  const selectedCard = hand.find((c) => c.id === selectedCardId);

  return (
    <View style={styles.tableArena}>
      {/* Ballistic flight animation layer */}
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
          onComplete={onFlightComplete}
          size="md"
        />
      )}

      {/* Table Felt Card */}
      <View onLayout={(e) => setTableCardLayout(e.nativeEvent.layout)}>
        <AppCard variant="outlined" style={[styles.card, { overflow: 'visible' }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.playerTitleRow}>
              <AppTitle level={3}>{title}</AppTitle>
              <AppBadge label={roleBadge} tone="primary" variant="solid" size="sm" />
            </View>
            <AppBadge
              label={isMyTurn ? 'YOUR TURN' : 'WAITING'}
              tone={isMyTurn ? 'success' : 'neutral'}
              variant={isMyTurn ? 'solid' : 'soft'}
              size="sm"
            />
          </View>

          <CardTable
            deckCount={deckCount}
            playedCards={playedCards}
            onDrawCard={onDrawCard}
            onTablePress={() => {
              if (selectedCard && isMyTurn) {
                onPlayCard(selectedCard);
              }
            }}
            opponent={{
              name: opponentName,
              cardCount: opponentCardCount,
              isTurn: !isMyTurn,
            }}
            onMatLayout={setTableMatLayout}
            onDeckLayout={setDeckLayout}
            onPlayZoneLayout={setPlayZoneLayout}
            onOpponentLayout={setOpponentLayout}
            activePrompt={
              activeFlight
                ? 'Card in Flight...'
                : isMyTurn
                  ? selectedCardId
                    ? 'Swipe Up or Tap Play to Discard'
                    : 'Your turn! Flick a card up or tap deck'
                  : `Waiting for ${opponentName} to play...`
            }
          />
        </AppCard>
      </View>

      {/* Hand Fan Card */}
      <View onLayout={(e) => setHandCardLayout(e.nativeEvent.layout)}>
        <AppCard variant="outlined" style={[styles.card, { overflow: 'visible' }]}>
          <View style={styles.cardHeaderRow}>
            <AppTitle level={3}>Hand ({hand.length})</AppTitle>
            <AppButton
              variant="solid"
              tone="primary"
              size="sm"
              label="Play to Table ➔"
              disabled={!isMyTurn || !selectedCardId || activeFlight !== null}
              onPress={() => {
                if (selectedCard) onPlayCard(selectedCard);
              }}
            />
          </View>
          <AppText variant="muted">
            {isMyTurn
              ? 'Swipe upward directly on any card to flick it onto the table felt, or tap to select.'
              : 'Card interaction is locked while waiting for opponent.'}
          </AppText>

          <View
            style={styles.handStage}
            onLayout={(e) => setHandStageLayout(e.nativeEvent.layout)}
          >
            <CardHand
              cards={hand}
              selectedCardId={selectedCardId}
              onSelectCard={onSelectCard}
              onPlayCard={onPlayCard}
              enableSwipeToPlay={isMyTurn}
              cardSpacing={36}
              spreadAngle={5}
              arcCurvature={3}
              size="md"
              springDamping={physics.springDamping}
              springStiffness={physics.springStiffness}
            />
          </View>
        </AppCard>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  wsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBanner: {
    backgroundColor: 'rgba(0, 87, 216, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  perspectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tableArena: {
    position: 'relative',
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handStage: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
});
