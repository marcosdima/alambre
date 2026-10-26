import React, { useEffect, useMemo, useState } from 'react';
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
import {
  createTurnEngine,
  createSimulatedRelayHub,
  type ITurnEngineClient,
  type TurnReducer,
  type TurnEngineState,
} from 'alambre/relay';

interface GameState {
  deck: string[];
  hands: {
    alice: string[];
    bob: string[];
  };
  table: string[];
}

type GameAction =
  | { type: 'PLAY_CARD'; player: 'alice' | 'bob'; card: string }
  | { type: 'DRAW_CARD'; player: 'alice' | 'bob' };

const gameReducer: TurnReducer<GameState, GameAction> = (state, action) => {
  switch (action.type) {
    case 'PLAY_CARD': {
      const playerHand = state.hands[action.player] ?? [];
      return {
        ...state,
        hands: {
          ...state.hands,
          [action.player]: playerHand.filter((c) => c !== action.card),
        },
        table: [...state.table, `${action.player.toUpperCase()}: ${action.card}`],
      };
    }
    case 'DRAW_CARD': {
      if (state.deck.length === 0) return state;
      const [drawn, ...restDeck] = state.deck;
      return {
        ...state,
        deck: restDeck,
        hands: {
          ...state.hands,
          [action.player]: [...state.hands[action.player], drawn],
        },
      };
    }
    default:
      return state;
  }
};

export default function TurnEngineFoWTestbed() {
  const { theme } = useLightDark();
  const [rejectMode, setRejectMode] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const hub = useMemo(() => createSimulatedRelayHub(), []);

  const [aliceEngine, setAliceEngine] = useState<ITurnEngineClient<GameState, GameAction> | null>(null);
  const [bobEngine, setBobEngine] = useState<ITurnEngineClient<GameState, GameAction> | null>(null);

  const [aliceState, setAliceState] = useState<TurnEngineState<GameState> | null>(null);
  const [bobState, setBobState] = useState<TurnEngineState<GameState> | null>(null);

  const appendLog = (msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  useEffect(() => {
    const initialState: GameState = {
      deck: ['♠️A', '♥️K', '♦️Q', '♣️J'],
      hands: {
        alice: ['♥️10', '♦️9'],
        bob: ['♣️8', '♠️7'],
      },
      table: [],
    };

    // Alice: Host with Fog-of-War projection
    const alice = createTurnEngine<GameState, GameAction>({
      roomCode: 'FOW1',
      playerId: 'alice_host',
      playerName: 'Alice (Host)',
      isHost: true,
      simulatedHub: hub,
      autoConnect: true,
      initialState,
      reducer: gameReducer,
      validateAction: (_state, action) => {
        if (rejectMode && action.type === 'PLAY_CARD') {
          return false;
        }
        return true;
      },
      projectStateForPeer: (state, peerId) => {
        if (peerId.includes('bob')) {
          return {
            ...state,
            deck: state.deck.map(() => '🂠 [HIDDEN]'),
            hands: {
              alice: state.hands.alice.map(() => '🂠 [OPPONENT]'),
              bob: state.hands.bob,
            },
          };
        }
        return state;
      },
      onActionCommitted: (act, _st, meta) => {
        appendLog(`Host committed seq #${meta.seq}: ${JSON.stringify(act)}`);
      },
      onActionRejected: (act, senderId) => {
        appendLog(`Host REJECTED action from ${senderId}: ${JSON.stringify(act)}`);
      },
      onHostMigrated: (newHostId, isHost, seq) => {
        appendLog(`Host Migrated to ${newHostId} (isHost: ${isHost}, seq: ${seq})`);
      },
    });

    // Bob: Guest with optimistic execution enabled
    const bob = createTurnEngine<GameState, GameAction>({
      roomCode: 'FOW1',
      playerId: 'bob_guest',
      playerName: 'Bob (Guest)',
      isHost: false,
      simulatedHub: hub,
      autoConnect: true,
      optimistic: true,
      initialState,
      reducer: gameReducer,
      onActionRejected: (act) => {
        appendLog(`Bob: Optimistic action rolled back: ${JSON.stringify(act)}`);
      },
      onHostMigrated: (newHostId, isHost) => {
        appendLog(`Bob received migration: ${newHostId} is now host (amIHost: ${isHost})`);
      },
    });

    setAliceEngine(alice);
    setBobEngine(bob);

    const unsubAlice = alice.subscribe(() => setAliceState(alice.getState()));
    const unsubBob = bob.subscribe(() => setBobState(bob.getState()));

    setAliceState(alice.getState());
    setBobState(bob.getState());

    return () => {
      unsubAlice();
      unsubBob();
      alice.destroy();
      bob.destroy();
    };
  }, [hub, rejectMode]);

  const handleBobPlay = (card: string) => {
    if (!bobEngine) return;
    appendLog(`Bob: Dispatching card ${card} (optimistic)...`);
    bobEngine.dispatch({ type: 'PLAY_CARD', player: 'bob', card });
  };

  const handleAliceDisconnect = () => {
    if (!aliceEngine) return;
    appendLog('Alice disconnected! Testing automated host migration...');
    aliceEngine.destroy();
    setAliceEngine(null);
    setAliceState(null);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={2}>Multiplayer Fog-of-War & Migration</AppTitle>
        <AppText variant="muted">
          Dual-device simulation demonstrating private state redaction, 0ms optimistic actions, and seamless host handover.
        </AppText>

        <View style={styles.controlRow}>
          <View style={styles.switchBox}>
            <AppText variant="body">Host Rejection Guard</AppText>
            <AppSwitch checked={rejectMode} onChange={setRejectMode} />
          </View>

          {aliceEngine && (
            <AppButton size="sm" variant="outline" tone="danger" onPress={handleAliceDisconnect}>
              Simulate Host Drop
            </AppButton>
          )}
        </View>
      </View>

      {/* Side-by-side device panes */}
      <View style={styles.devicesGrid}>
        {/* Device 1: Alice (Host) */}
        <AppCard
          variant="outlined"
          style={[styles.deviceCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <View style={styles.deviceHeader}>
            <AppTitle level={3}>Host View (Alice)</AppTitle>
            <AppBadge tone="primary" size="sm">HOST AUTHORITATIVE</AppBadge>
          </View>

          {aliceState ? (
            <View style={styles.deviceBody}>
              <AppText variant="subtitle" style={{ fontSize: 13, fontWeight: '600' }}>
                Full Uncensored Hand:
              </AppText>
              <View style={styles.cardRow}>
                {aliceState.gameState.hands.alice.map((c: string) => (
                  <AppBadge key={c} tone="primary" variant="solid" size="md">{c}</AppBadge>
                ))}
              </View>

              <AppText variant="subtitle" style={{ fontSize: 13, fontWeight: '600' }}>
                Bob's Hand (visible to host):
              </AppText>
              <View style={styles.cardRow}>
                {aliceState.gameState.hands.bob.map((c: string) => (
                  <AppBadge key={c} tone="neutral" size="sm">{c}</AppBadge>
                ))}
              </View>

              <AppText variant="muted" style={{ fontSize: 11 }}>
                Sequence #{aliceState.seq} | Deck: {aliceState.gameState.deck.length} cards
              </AppText>
            </View>
          ) : (
            <AppText variant="muted" style={{ paddingVertical: 20 }}>
              🔴 Alice Disconnected (App Closed)
            </AppText>
          )}
        </AppCard>

        {/* Device 2: Bob (Guest) */}
        <AppCard
          variant="outlined"
          style={[styles.deviceCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <View style={styles.deviceHeader}>
            <AppTitle level={3}>Guest View (Bob)</AppTitle>
            <AppBadge
              tone={bobEngine?.relay.getState().isHost ? 'success' : bobState?.isOptimistic ? 'warning' : 'neutral'}
              size="sm"
            >
              {bobEngine?.relay.getState().isHost ? 'PROMOTED HOST' : bobState?.isOptimistic ? '⚡ OPTIMISTIC' : 'GUEST PEER'}
            </AppBadge>
          </View>

          {bobState && (
            <View style={styles.deviceBody}>
              <AppText variant="subtitle" style={{ fontSize: 13, fontWeight: '600' }}>
                Alice's Cards (Censored Fog-of-War):
              </AppText>
              <View style={styles.cardRow}>
                {bobState.gameState.hands.alice.map((c: string, i: number) => (
                  <AppBadge key={i} tone="neutral" variant="soft" size="sm">{c}</AppBadge>
                ))}
              </View>

              <AppText variant="subtitle" style={{ fontSize: 13, fontWeight: '600' }}>
                Bob's Hand (Tap to play):
              </AppText>
              <View style={styles.cardRow}>
                {bobState.gameState.hands.bob.map((c: string) => (
                  <AppButton key={c} size="sm" variant="solid" onPress={() => handleBobPlay(c)}>
                    Play {c}
                  </AppButton>
                ))}
              </View>

              <AppText variant="muted" style={{ fontSize: 11 }}>
                Sequence #{bobState.seq} | Pending: {bobState.pendingActionsCount ?? 0}
              </AppText>
            </View>
          )}
        </AppCard>
      </View>

      {/* Table Discard Pile */}
      <AppCard variant="outlined" style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={3}>Table Played Pile</AppTitle>
        <AppText variant="muted">
          {bobState?.gameState.table.length === 0
            ? 'No cards played yet.'
            : bobState?.gameState.table.join('  ➔  ')}
        </AppText>
      </AppCard>

      {/* Network Activity Log */}
      <AppCard variant="outlined" style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <AppTitle level={3}>Live Network Activity</AppTitle>
        <AppText variant="muted" style={{ fontSize: 12 }}>
          {log.join('\n')}
        </AppText>
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
    gap: 14,
    paddingBottom: 40,
  },
  panel: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devicesGrid: {
    gap: 12,
  },
  deviceCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceBody: {
    gap: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
});
