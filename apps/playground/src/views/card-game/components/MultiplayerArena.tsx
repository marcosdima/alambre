import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppTextInput } from '@alambre/ui';
import { generateRoomCode } from '@alambre/room-relay';
import AppCard from '../../../components/AppCard';
import AppButton from '../../../components/AppButton';
import AppBadge from '../../../components/AppBadge';
import AppTitle, { AppText } from '../../../components/AppTitle';
import AppSegmentedControl from '../../../components/AppSegmentedControl';
import { CardTable } from './CardTable';
import { CardHand } from './CardHand';
import { CascadeFlightItem } from './CascadeFlightItem';
import { OpponentFlightItem } from './OpponentFlightItem';
import type { CardPhysicsConfig } from '../CardGameTestbed';
import type { PlayingCardData, Point2D } from '../types';
import { useDealCascade } from '../hooks/use-deal-cascade';
import { useCardRelaySync, type OpponentFlightEvent } from '../hooks/use-card-relay-sync';

export function MultiplayerArena({ physics }: { physics: CardPhysicsConfig }) {
  const [activeRoomCode, setActiveRoomCode] = useState('XK89');
  const [transportMode, setTransportMode] = useState<'simulated' | 'websocket'>('simulated');
  const [customWsUrl, setCustomWsUrl] = useState('ws://localhost:8787');
  const [perspective, setPerspective] = useState<'dual' | 'alice' | 'bob'>('dual');

  // Opponent flight state for Alice (observing Bob's plays)
  const [aliceOpponentFlight, setAliceOpponentFlight] = useState<{
    card: PlayingCardData;
    targetRotation: number;
  } | null>(null);

  // Opponent flight state for Bob (observing Alice's plays)
  const [bobOpponentFlight, setBobOpponentFlight] = useState<{
    card: PlayingCardData;
    targetRotation: number;
  } | null>(null);

  // Host Relay Client (Alice)
  const aliceSync = useCardRelaySync({
    roomCode: activeRoomCode,
    playerName: 'Alice (Host)',
    isHost: true,
    mode: transportMode,
    serverUrl: customWsUrl,
    onOpponentPlay: (event: OpponentFlightEvent) => {
      setAliceOpponentFlight({
        card: event.card,
        targetRotation: event.targetRotation,
      });
    },
  });

  // Guest Relay Client (Bob)
  const bobSync = useCardRelaySync({
    roomCode: activeRoomCode,
    playerName: 'Bob',
    isHost: false,
    mode: transportMode,
    serverUrl: customWsUrl,
    onOpponentPlay: (event: OpponentFlightEvent) => {
      setBobOpponentFlight({
        card: event.card,
        targetRotation: event.targetRotation,
      });
    },
  });

  const handleRollCode = () => {
    setActiveRoomCode(generateRoomCode(4));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Relay Room Settings Bar */}
      <AppCard variant="outlined" style={styles.configCard}>
        <View style={styles.roomHeaderRow}>
          <View style={styles.roomCodeCol}>
            <AppText variant="muted" style={styles.fieldLabel}>ROOM CODE</AppText>
            <View style={styles.roomInputRow}>
              <View style={styles.textInputWrapper}>
                <AppTextInput
                  value={activeRoomCode}
                  onChangeText={(t) => setActiveRoomCode(t.toUpperCase())}
                  placeholder="XK89"
                  maxLength={6}
                />
              </View>
              <AppButton
                variant="ghost"
                tone="primary"
                size="sm"
                label="Roll"
                onPress={handleRollCode}
              />
            </View>
          </View>

          <View style={styles.statusCol}>
            <AppText variant="muted" style={styles.fieldLabel}>STATUS</AppText>
            <View style={styles.badgeRow}>
              <AppBadge
                label={aliceSync.relayStatus.toUpperCase()}
                tone={aliceSync.relayStatus === 'connected' ? 'success' : 'neutral'}
                variant="solid"
                size="sm"
              />
              <AppBadge
                label={`${aliceSync.peers.length + 1} PEERS`}
                tone="primary"
                variant="soft"
                size="sm"
              />
            </View>
          </View>
        </View>

        <View style={styles.segmentedRow}>
          <AppText variant="muted" style={styles.fieldLabel}>VIEW PERSPECTIVE</AppText>
          <AppSegmentedControl
            options={[
              { label: 'Dual Match', value: 'dual' },
              { label: 'Alice (Host)', value: 'alice' },
              { label: 'Bob (Peer)', value: 'bob' },
            ]}
            value={perspective}
            onChange={(val) => setPerspective(val as 'dual' | 'alice' | 'bob')}
          />
        </View>

        <View style={styles.segmentedRow}>
          <AppText variant="muted" style={styles.fieldLabel}>RELAY TRANSPORT</AppText>
          <AppSegmentedControl
            options={[
              { label: 'Simulated Hub', value: 'simulated' },
              { label: 'WebSocket Server', value: 'websocket' },
            ]}
            value={transportMode}
            onChange={(val) => setTransportMode(val as 'simulated' | 'websocket')}
          />
        </View>

        {transportMode === 'websocket' && (
          <View style={styles.wsRow}>
            <AppText variant="muted" style={styles.fieldLabel}>WS SERVER URL</AppText>
            <AppTextInput
              value={customWsUrl}
              onChangeText={setCustomWsUrl}
              placeholder="ws://localhost:8787"
            />
          </View>
        )}
      </AppCard>

      {/* Synchronized Match Action Banner */}
      <View style={styles.bannerRow}>
        <AppBadge
          label={aliceSync.gameState.lastActionText}
          tone="primary"
          variant="solid"
          size="md"
        />
      </View>

      {/* Alice Board */}
      {(perspective === 'dual' || perspective === 'alice') && (
        <PlayerBoardSection
          playerTitle="Alice (Host Perspective)"
          sync={aliceSync}
          opponentFlight={aliceOpponentFlight}
          onOpponentFlightComplete={() => setAliceOpponentFlight(null)}
          opponentName="Bob"
          physics={physics}
          onDealRound={() => aliceSync.dealRound(5)}
          canDeal={true}
        />
      )}

      {/* Bob Board */}
      {(perspective === 'dual' || perspective === 'bob') && (
        <PlayerBoardSection
          playerTitle="Bob (Guest Perspective)"
          sync={bobSync}
          opponentFlight={bobOpponentFlight}
          onOpponentFlightComplete={() => setBobOpponentFlight(null)}
          opponentName="Alice (Host)"
          physics={physics}
          onDealRound={() => {}}
          canDeal={false}
        />
      )}
    </ScrollView>
  );
}

// ============================================================================
// Single Player Board Component (Reusable for Host & Guest)
// ============================================================================

interface PlayerBoardSectionProps {
  playerTitle: string;
  sync: ReturnType<typeof useCardRelaySync>;
  opponentFlight: { card: PlayingCardData; targetRotation: number } | null;
  onOpponentFlightComplete: () => void;
  opponentName: string;
  physics: CardPhysicsConfig;
  onDealRound: () => void;
  canDeal: boolean;
}

function PlayerBoardSection({
  playerTitle,
  sync,
  opponentFlight,
  onOpponentFlightComplete,
  opponentName,
  physics,
  onDealRound,
  canDeal,
}: PlayerBoardSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Dynamic layout coordinates
  const [tableCardLayout, setTableCardLayout] = useState({ x: 0, y: 0, width: 340, height: 280 });
  const [tableMatLayout, setTableMatLayout] = useState({ x: 16, y: 70, width: 308, height: 210 });
  const [deckLayout, setDeckLayout] = useState({ x: 30, y: 55, width: 64, height: 92 });
  const [playZoneLayout, setPlayZoneLayout] = useState({ x: 160, y: 55, width: 76, height: 110 });
  const [opponentLayout, setOpponentLayout] = useState({ x: 16, y: 12, width: 308, height: 40 });

  const [handCardLayout, setHandCardLayout] = useState({ x: 0, y: 340, width: 340, height: 280 });
  const [handStageLayout, setHandStageLayout] = useState({ x: 16, y: 56, width: 308, height: 190 });

  const deckCoord: Point2D = useMemo(() => ({
    x: Math.round(tableCardLayout.x + tableMatLayout.x + deckLayout.x + (deckLayout.width - 76) / 2),
    y: Math.round(tableCardLayout.y + tableMatLayout.y + deckLayout.y + (deckLayout.height - 110) / 2),
  }), [tableCardLayout, tableMatLayout, deckLayout]);

  const tableCoord: Point2D = useMemo(() => ({
    x: Math.round(tableCardLayout.x + tableMatLayout.x + playZoneLayout.x + (playZoneLayout.width - 76) / 2),
    y: Math.round(tableCardLayout.y + tableMatLayout.y + playZoneLayout.y + (playZoneLayout.height - 110) / 2),
  }), [tableCardLayout, tableMatLayout, playZoneLayout]);

  const opponentCoord: Point2D = useMemo(() => ({
    x: Math.round(tableCardLayout.x + tableMatLayout.x + opponentLayout.x + (opponentLayout.width - 76) / 2),
    y: Math.round(tableCardLayout.y + tableMatLayout.y + opponentLayout.y + 10),
  }), [tableCardLayout, tableMatLayout, opponentLayout]);

  const handCenterCoord: Point2D = useMemo(() => ({
    x: Math.round(handCardLayout.x + handStageLayout.x + (handStageLayout.width - 76) / 2),
    y: Math.round(handCardLayout.y + handStageLayout.y + (handStageLayout.height - 110) / 2),
  }), [handCardLayout, handStageLayout]);

  // Deal Cascade Hook for dealing into local hand
  const dealCascade = useDealCascade({
    deckOrigin: deckCoord,
    handCenter: handCenterCoord,
    handContainerWidth: handStageLayout.width,
    flightDurationMs: physics.flightDuration,
    staggerDelayMs: 90,
    liftHeight: 55,
    flipOnFly: physics.flipOnFly,
  });

  const handlePlaySelected = () => {
    if (!selectedId || !sync.isMyTurn) return;
    sync.playCard(selectedId, 'table', Math.round((Math.random() - 0.5) * 16));
    setSelectedId(null);
  };

  const handlePlayCard = (card: PlayingCardData) => {
    if (!sync.isMyTurn) return;
    sync.playCard(card.id, 'table', Math.round((Math.random() - 0.5) * 16));
    if (selectedId === card.id) {
      setSelectedId(null);
    }
  };

  return (
    <View style={styles.boardWrapper}>
      {/* In-Flight Cards from Deal Cascade */}
      {dealCascade.activeFlights.map((spec) => (
        <CascadeFlightItem
          key={spec.card.id}
          spec={spec}
          onComplete={() => dealCascade.handleFlightComplete(spec.card.id)}
          size="md"
        />
      ))}

      {/* Opponent In-Flight Card (observed across relay) */}
      {opponentFlight && (
        <OpponentFlightItem
          card={opponentFlight.card}
          from={opponentCoord}
          to={tableCoord}
          targetRotation={opponentFlight.targetRotation}
          durationMs={physics.flightDuration}
          onComplete={onOpponentFlightComplete}
          size="md"
        />
      )}

      {/* Table Section */}
      <View onLayout={(e) => setTableCardLayout(e.nativeEvent.layout)}>
        <AppCard variant="outlined" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppTitle level={3}>{playerTitle}</AppTitle>
            <View style={styles.badgeRow}>
              <AppBadge
                label={sync.isMyTurn ? 'YOUR TURN' : 'OPPONENT TURN'}
                tone={sync.isMyTurn ? 'success' : 'neutral'}
                variant={sync.isMyTurn ? 'solid' : 'soft'}
                size="sm"
              />
              {canDeal && (
                <AppButton
                  variant="solid"
                  tone="primary"
                  size="sm"
                  label="Deal 5 Cards"
                  disabled={sync.gameState.phase === 'playing'}
                  onPress={onDealRound}
                />
              )}
            </View>
          </View>

          <CardTable
            deckCount={sync.gameState.deck.length}
            playedCards={sync.gameState.playedPile}
            onDrawCard={sync.drawCard}
            onTablePress={handlePlaySelected}
            onMatLayout={setTableMatLayout}
            onDeckLayout={setDeckLayout}
            onPlayZoneLayout={setPlayZoneLayout}
            onOpponentLayout={setOpponentLayout}
            opponent={{
              name: opponentName,
              cardCount: sync.opponentHand.length,
              isTurn: !sync.isMyTurn,
            }}
            activePrompt={
              sync.isMyTurn
                ? 'Your turn! Tap deck to draw or play a card'
                : `Waiting for ${opponentName} to play...`
            }
          />
        </AppCard>
      </View>

      {/* Hand Section */}
      <View onLayout={(e) => setHandCardLayout(e.nativeEvent.layout)}>
        <AppCard variant="outlined" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <AppTitle level={3}>Your Hand ({sync.myHand.length})</AppTitle>
            <AppButton
              variant="solid"
              tone="primary"
              size="sm"
              label="Play to Table ➔"
              disabled={!selectedId || !sync.isMyTurn}
              onPress={handlePlaySelected}
            />
          </View>

          <View
            style={styles.handStage}
            onLayout={(e) => setHandStageLayout(e.nativeEvent.layout)}
          >
            <CardHand
              cards={sync.myHand}
              selectedCardId={selectedId}
              onSelectCard={(c) => setSelectedId(selectedId === c.id ? null : c.id)}
              onPlayCard={handlePlayCard}
              enableSwipeToPlay={sync.isMyTurn}
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
              label="Reset Match"
              onPress={() => sync.resetGame()}
            />
          </View>
        </AppCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  configCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    overflow: 'visible',
  },
  roomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  roomCodeCol: {
    flex: 1,
    gap: 4,
  },
  statusCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  roomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInputWrapper: {
    minWidth: 100,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentedRow: {
    gap: 6,
    marginTop: 4,
  },
  wsRow: {
    gap: 4,
    marginTop: 4,
  },
  bannerRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  boardWrapper: {
    position: 'relative',
    gap: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handStage: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginVertical: 8,
  },
  resetRow: {
    alignItems: 'center',
    marginTop: 4,
  },
});
