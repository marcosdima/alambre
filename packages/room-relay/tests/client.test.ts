import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RoomRelayClient, createRoomRelay } from "../src/client";
import { createSimulatedRelayHub } from "../src/transports/simulated";

describe("RoomRelayClient (Headless Core)", () => {
  let hub: ReturnType<typeof createSimulatedRelayHub>;

  beforeEach(() => {
    hub = createSimulatedRelayHub();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("initializes with default state", () => {
    const client = createRoomRelay({
      roomCode: "TEST",
      playerName: "Alice",
      isHost: true,
      simulatedHub: hub,
    });

    const state = client.getState();
    expect(state.status).toBe("disconnected");
    expect(state.roomCode).toBe("TEST");
    expect(state.playerName).toBe("Alice");
    expect(state.isHost).toBe(true);
    expect(state.peers).toEqual([]);
    expect(state.history).toEqual([]);

    client.destroy();
  });

  it("connects and receives room state", () => {
    const client = new RoomRelayClient({
      roomCode: "XK89",
      playerName: "Host",
      simulatedLatencyMs: 10,
      simulatedHub: hub,
    });

    const statusUpdates: string[] = [];
    client.subscribe(() => {
      statusUpdates.push(client.getState().status);
    });

    client.connect();
    expect(client.getState().status).toBe("connecting");

    vi.advanceTimersByTime(20);
    expect(client.getState().status).toBe("connected");

    client.destroy();
  });

  it("routes typed messages to subscribers", () => {
    type GameEvents = {
      CARD_PLAYED: { cardId: string; x: number; y: number };
      TURN_ENDED: { nextPlayerId: string };
    };

    const host = new RoomRelayClient<GameEvents>({
      roomCode: "POKER",
      playerName: "Host",
      isHost: true,
      simulatedLatencyMs: 10,
      simulatedHub: hub,
    });

    const guest = new RoomRelayClient<GameEvents>({
      roomCode: "POKER",
      playerName: "Guest",
      isHost: false,
      simulatedLatencyMs: 10,
      simulatedHub: hub,
    });

    host.connect();
    guest.connect();
    vi.advanceTimersByTime(40);

    const receivedCards: any[] = [];
    const unsub = guest.on("CARD_PLAYED", (payload, msg) => {
      receivedCards.push({ payload, from: msg.from });
    });

    host.send("CARD_PLAYED", { cardId: "ace_hearts", x: 100, y: 200 });
    vi.advanceTimersByTime(40);

    expect(receivedCards).toHaveLength(1);
    expect(receivedCards[0].payload).toEqual({ cardId: "ace_hearts", x: 100, y: 200 });

    // Unsubscribe and verify no more events
    unsub();
    host.send("CARD_PLAYED", { cardId: "king_spades", x: 50, y: 50 });
    vi.advanceTimersByTime(40);
    expect(receivedCards).toHaveLength(1);

    host.destroy();
    guest.destroy();
  });

  it("handles atomic room switching via joinRoom and createRoom", () => {
    const client = new RoomRelayClient({
      roomCode: "ROOM1",
      playerName: "Player",
      simulatedLatencyMs: 10,
      simulatedHub: hub,
    });

    client.connect();
    vi.advanceTimersByTime(25);
    expect(client.getState().status).toBe("connected");
    expect(client.getState().roomCode).toBe("ROOM1");

    // Atomic joinRoom
    client.joinRoom("ROOM2");
    expect(client.getState().roomCode).toBe("ROOM2");
    expect(client.getState().isHost).toBe(false);

    vi.advanceTimersByTime(25);
    expect(client.getState().status).toBe("connected");

    // Atomic createRoom
    const newCode = client.createRoom();
    expect(client.getState().roomCode).toBe(newCode);
    expect(client.getState().isHost).toBe(true);

    vi.advanceTimersByTime(25);
    expect(client.getState().status).toBe("connected");

    client.destroy();
  });

  it("respects maxHistoryLength and clearHistory", () => {
    const client = new RoomRelayClient({
      roomCode: "HIST",
      maxHistoryLength: 3,
      simulatedLatencyMs: 5,
      simulatedHub: hub,
    });

    client.connect();
    vi.advanceTimersByTime(15);

    client.send("MSG1", {});
    client.send("MSG2", {});
    client.send("MSG3", {});
    client.send("MSG4", {});

    const history = client.getState().history;
    expect(history).toHaveLength(3);
    expect(history[0].type).toBe("MSG4");
    expect(history[1].type).toBe("MSG3");
    expect(history[2].type).toBe("MSG2");

    client.clearHistory();
    expect(client.getState().history).toEqual([]);

    client.destroy();
  });

  it("tracks peer presence accurately", () => {
    const host = new RoomRelayClient({
      roomCode: "SYNC",
      playerName: "Host",
      isHost: true,
      simulatedLatencyMs: 10,
      simulatedHub: hub,
    });

    const guest = new RoomRelayClient({
      roomCode: "SYNC",
      playerName: "Guest",
      isHost: false,
      simulatedLatencyMs: 10,
      simulatedHub: hub,
    });

    host.connect();
    vi.advanceTimersByTime(25);
    expect(host.getState().peers).toHaveLength(0);

    guest.connect();
    vi.advanceTimersByTime(35);

    // Host sees guest
    expect(host.getState().peers).toHaveLength(1);
    expect(host.getState().peers[0].name).toBe("Guest");

    // Guest disconnects
    guest.disconnect();
    vi.advanceTimersByTime(35);

    expect(host.getState().peers).toHaveLength(0);

    host.destroy();
    guest.destroy();
  });

  it("reports isDestroyed correctly throughout its lifecycle", () => {
    const client = new RoomRelayClient({
      roomCode: "TEST_DESTROY",
      simulatedHub: hub,
    });

    expect(client.isDestroyed()).toBe(false);
    client.destroy();
    expect(client.isDestroyed()).toBe(true);
  });

  it("ignores self-echo reflection from WebSocket/transport broadcasts", () => {
    const client = new RoomRelayClient({
      roomCode: "ECHO_ROOM",
      playerName: "Sender",
      simulatedLatencyMs: 10,
      simulatedHub: hub,
    });

    client.connect();
    vi.advanceTimersByTime(25);

    const receivedCount = { value: 0 };
    client.on("MOVE", () => {
      receivedCount.value++;
    });

    // Local send dispatches once immediately
    client.send("MOVE", { x: 10 });
    expect(receivedCount.value).toBe(1);
    expect(client.getState().history).toHaveLength(1);

    // If an external transport broadcasts the message back with msg.from === client.playerId
    const rawEcho = {
      type: "MOVE",
      from: client.getState().playerId,
      senderName: "Sender",
      payload: { x: 10 },
      timestamp: Date.now(),
    };
    (client as any).handleIncomingRaw(rawEcho);

    // Should NOT duplicate event dispatch or history entry
    expect(receivedCount.value).toBe(1);
    expect(client.getState().history).toHaveLength(1);

    client.destroy();
  });
});
