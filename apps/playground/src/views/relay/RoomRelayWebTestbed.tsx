import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useRoomRelay, generateRoomCode, type RelayMessage } from '@some-alambre/room-relay';
import { useLightDark } from '../../providers/theme';
import {
  AppCard,
  AppText,
  AppTitle,
  AppBadge,
  AppButton,
  AppTextInput,
} from '@some-alambre/ui';
import { TestCard } from '../../components/test-utils';

interface PacketLogEntry {
  id: string;
  timestamp: string;
  sender: string;
  recipient: string;
  event: string;
  payload: Record<string, unknown>;
}

const PROVIDER_PRESETS = [
  {
    label: 'PartyKit Cloud (Edge)',
    url: 'wss://relay.alambre.party/room',
    description: 'Cloudflare Workers / PartyKit edge deployment (no local daemon needed)',
  },
  {
    label: 'PartyKit Local (Dev)',
    url: 'ws://localhost:1999/party/alambre-room',
    description: 'Local development server running `npx partykit dev`',
  },
  {
    label: 'Custom WebSocket Relay',
    url: 'ws://localhost:8787/room',
    description: 'Custom WebSocket server endpoint',
  },
];

export default function RoomRelayWebTestbed() {
  const { theme } = useLightDark();

  const [serverUrl, setServerUrl] = useState(PROVIDER_PRESETS[0].url);
  const [roomCode, setRoomCode] = useState('TEST');
  const [aliceInputText, setAliceInputText] = useState('Hello from Alice via Web Provider!');
  const [bobInputText, setBobInputText] = useState('Bob received it via Web Relay!');
  const [packetLogs, setPacketLogs] = useState<PacketLogEntry[]>([]);

  const addLog = useCallback(
    (sender: string, recipient: string, event: string, payload: Record<string, unknown>) => {
      const entry: PacketLogEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        sender,
        recipient,
        event,
        payload,
      };
      setPacketLogs((prev) => [entry, ...prev.slice(0, 49)]);
    },
    [],
  );

  // Client A: Alice (Host/Sender) — strictly connects through external WebSocket provider
  const clientA = useRoomRelay({
    roomCode,
    playerName: 'Alice (Sender)',
    isHost: true,
    mode: 'websocket',
    serverUrl,
    autoConnect: true,
  });

  // Client B: Bob (Guest/Receiver) — strictly connects through external WebSocket provider
  const clientB = useRoomRelay({
    roomCode,
    playerName: 'Bob (Receiver)',
    isHost: false,
    mode: 'websocket',
    serverUrl,
    autoConnect: true,
  });

  // Subscribe to messages received on Bob
  useEffect(() => {
    const unsub = clientB.onMessage((msg: RelayMessage) => {
      addLog(msg.senderName || msg.from || 'Alice', 'Bob', msg.type, msg.payload as Record<string, unknown>);
    });
    return unsub;
  }, [clientB, addLog]);

  // Subscribe to messages received on Alice
  useEffect(() => {
    const unsub = clientA.onMessage((msg: RelayMessage) => {
      addLog(msg.senderName || msg.from || 'Bob', 'Alice', msg.type, msg.payload as Record<string, unknown>);
    });
    return unsub;
  }, [clientA, addLog]);

  const handleAliceSend = useCallback(() => {
    if (!aliceInputText.trim()) return;
    clientA.send('CHAT_MESSAGE', { text: aliceInputText.trim() });
    setAliceInputText('');
  }, [aliceInputText, clientA]);

  const handleAlicePing = useCallback(() => {
    clientA.send('PING', { sentAt: Date.now() });
  }, [clientA]);

  const handleAliceSendCard = useCallback(() => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', 'K', 'Q', 'J', '10', '7'];
    const card = `${ranks[Math.floor(Math.random() * ranks.length)]}${suits[Math.floor(Math.random() * suits.length)]}`;
    clientA.send('PLAY_CARD', { card, action: 'toss' });
  }, [clientA]);

  const handleBobReply = useCallback(() => {
    if (!bobInputText.trim()) return;
    clientB.send('REPLY_MESSAGE', { reply: bobInputText.trim() });
    setBobInputText('');
  }, [bobInputText, clientB]);

  const handleGenerateNewRoom = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return { label: 'Conectado (Web)', tone: 'success' as const };
      case 'connecting':
        return { label: 'Conectando...', tone: 'warning' as const };
      case 'reconnecting':
        return { label: 'Reconectando', tone: 'warning' as const };
      default:
        return { label: 'Desconectado', tone: 'neutral' as const };
    }
  };

  const statusA = getStatusBadge(clientA.status);
  const statusB = getStatusBadge(clientB.status);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <TestCard
        title="Integración de Proveedor Web Externo"
        description="Prueba de mensajería cliente-a-cliente exclusivamente mediante WebSockets externos (PartyKit, Cloudflare Workers o servidor remoto)."
      >
        {/* Web Provider URL & Presets */}
        <View style={styles.section}>
          <AppText variant="subtitle" style={{ color: theme.color, fontWeight: '600' }}>
            Presets de Proveedor Web
          </AppText>
          <View style={styles.presetsRow}>
            {PROVIDER_PRESETS.map((preset) => (
              <AppButton
                key={preset.url}
                variant={serverUrl === preset.url ? 'solid' : 'outline'}
                tone={serverUrl === preset.url ? 'primary' : 'neutral'}
                size="sm"
                onPress={() => setServerUrl(preset.url)}
                style={styles.presetBtn}
              >
                {preset.label}
              </AppButton>
            ))}
          </View>

          <View style={styles.webConfigBox}>
            <AppTextInput
              label="URL del Proveedor WebSocket"
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="wss://... o ws://..."
            />
            <AppText variant="caption" style={{ color: theme.muted }}>
              Conecta a un servicio externo en la web para reemplazar el proceso `pnpm relay:server`.
            </AppText>
          </View>

          {/* Room Code Bar */}
          <View style={styles.roomCodeRow}>
            <View style={styles.roomCodeField}>
              <AppTextInput
                label="Código de Sala"
                value={roomCode}
                onChangeText={(text) => setRoomCode(text.toUpperCase())}
                maxLength={8}
              />
            </View>
            <AppButton
              variant="outline"
              tone="primary"
              size="md"
              onPress={handleGenerateNewRoom}
              style={styles.newRoomBtn}
            >
              Nuevo Código 🎲
            </AppButton>
          </View>
        </View>
      </TestCard>

      {/* Dual Client Sandbox */}
      <View style={styles.dualClientRow}>
        {/* Client A (Sender - Alice) */}
        <AppCard
          variant="outlined"
          title="Cliente A (Alice)"
          subtitle="Emisor / Host de la Sala"
          style={[styles.clientCard, { borderColor: theme.border }]}
        >
          <View style={styles.statusRow}>
            <AppBadge tone={statusA.tone} variant="solid" size="sm">
              {statusA.label}
            </AppBadge>
            <AppBadge tone="neutral" variant="outline" size="sm">
              {`${clientA.latencyMs || 0} ms`}
            </AppBadge>
            <AppBadge tone="primary" variant="soft" size="sm">
              {`Pares: ${clientA.peers.length}`}
            </AppBadge>
          </View>

          <View style={styles.clientActions}>
            <AppTextInput
              label="Mensaje para Bob"
              value={aliceInputText}
              onChangeText={setAliceInputText}
              placeholder="Escribe algo..."
            />
            <AppButton
              variant="solid"
              tone="primary"
              size="sm"
              onPress={handleAliceSend}
              disabled={clientA.status !== 'connected' || !aliceInputText.trim()}
            >
              Enviar por Proveedor Web ➔
            </AppButton>

            <View style={styles.quickActions}>
              <AppButton
                variant="outline"
                tone="neutral"
                size="sm"
                onPress={handleAlicePing}
                disabled={clientA.status !== 'connected'}
                style={styles.quickBtn}
              >
                Ping 🏓
              </AppButton>
              <AppButton
                variant="outline"
                tone="neutral"
                size="sm"
                onPress={handleAliceSendCard}
                disabled={clientA.status !== 'connected'}
                style={styles.quickBtn}
              >
                Tirar Carta 🃏
              </AppButton>
            </View>

            <View style={styles.connectionToggleRow}>
              {clientA.status === 'connected' ? (
                <AppButton
                  variant="outline"
                  tone="danger"
                  size="sm"
                  onPress={() => clientA.disconnect()}
                >
                  Desconectar
                </AppButton>
              ) : (
                <AppButton
                  variant="solid"
                  tone="success"
                  size="sm"
                  onPress={() => clientA.connect()}
                >
                  Conectar a Web
                </AppButton>
              )}
            </View>
          </View>
        </AppCard>

        {/* Client B (Receiver - Bob) */}
        <AppCard
          variant="outlined"
          title="Cliente B (Bob)"
          subtitle="Receptor / Invitado"
          style={[styles.clientCard, { borderColor: theme.border }]}
        >
          <View style={styles.statusRow}>
            <AppBadge tone={statusB.tone} variant="solid" size="sm">
              {statusB.label}
            </AppBadge>
            <AppBadge tone="neutral" variant="outline" size="sm">
              {`${clientB.latencyMs || 0} ms`}
            </AppBadge>
            <AppBadge tone="primary" variant="soft" size="sm">
              {`Pares: ${clientB.peers.length}`}
            </AppBadge>
          </View>

          <View style={styles.clientActions}>
            <AppTextInput
              label="Respuesta para Alice"
              value={bobInputText}
              onChangeText={setBobInputText}
              placeholder="Responder..."
            />
            <AppButton
              variant="solid"
              tone="success"
              size="sm"
              onPress={handleBobReply}
              disabled={clientB.status !== 'connected' || !bobInputText.trim()}
            >
              Responder por Proveedor Web ↩
            </AppButton>

            <View style={styles.connectionToggleRow}>
              {clientB.status === 'connected' ? (
                <AppButton
                  variant="outline"
                  tone="danger"
                  size="sm"
                  onPress={() => clientB.disconnect()}
                >
                  Desconectar
                </AppButton>
              ) : (
                <AppButton
                  variant="solid"
                  tone="success"
                  size="sm"
                  onPress={() => clientB.connect()}
                >
                  Conectar a Web
                </AppButton>
              )}
            </View>
          </View>
        </AppCard>
      </View>

      {/* Packet & Message Flow Inspector */}
      <AppCard
        variant="outlined"
        title="Inspector de Paquetes en Vivo"
        subtitle={`Registro de mensajes transmitidos por el proveedor web (${packetLogs.length} eventos)`}
        style={[styles.inspectorCard, { borderColor: theme.border }]}
      >
        {packetLogs.length > 0 && (
          <AppButton
            variant="outline"
            tone="neutral"
            size="sm"
            onPress={() => setPacketLogs([])}
            style={styles.clearBtn}
          >
            Limpiar Historial
          </AppButton>
        )}

        {packetLogs.length === 0 ? (
          <View style={styles.emptyLogs}>
            <AppText variant="caption" style={{ color: theme.muted, textAlign: 'center' }}>
              No hay mensajes transmitidos aún. Envía un mensaje desde el Cliente A para observar la entrega a través del proveedor web.
            </AppText>
          </View>
        ) : (
          <View style={styles.logsList}>
            {packetLogs.map((log) => (
              <Animated.View
                key={log.id}
                entering={FadeInDown.duration(200)}
                layout={LinearTransition}
                style={[
                  styles.logItem,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.logHeader}>
                  <AppBadge
                    tone={log.sender.includes('Alice') ? 'primary' : 'success'}
                    variant="solid"
                    size="sm"
                  >
                    {`${log.sender} ➔ ${log.recipient}`}
                  </AppBadge>
                  <AppText variant="caption" style={{ color: theme.muted, fontSize: 11 }}>
                    {log.timestamp}
                  </AppText>
                </View>
                <AppTitle level={3} style={{ fontSize: 13, marginTop: 4 }}>
                  {`Evento: ${log.event}`}
                </AppTitle>
                <AppText
                  variant="caption"
                  style={[styles.payloadText, { color: theme.color, backgroundColor: theme.surface }]}
                >
                  {JSON.stringify(log.payload, null, 2)}
                </AppText>
              </Animated.View>
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
    paddingBottom: 48,
  },
  section: {
    gap: 12,
    marginTop: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetBtn: {
    flexGrow: 1,
  },
  webConfigBox: {
    gap: 8,
    marginTop: 4,
  },
  roomCodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  roomCodeField: {
    flex: 1,
  },
  newRoomBtn: {
    marginBottom: 2,
  },
  dualClientRow: {
    gap: 16,
  },
  clientCard: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  clientActions: {
    gap: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
  },
  connectionToggleRow: {
    marginTop: 4,
  },
  inspectorCard: {
    gap: 12,
  },
  clearBtn: {
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  emptyLogs: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  logsList: {
    gap: 10,
  },
  logItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payloadText: {
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 8,
    fontSize: 11,
    marginTop: 2,
  },
});
