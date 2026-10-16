import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSimulatedRelayHub,
  SimulatedRelayTransport,
} from "../src/transports/simulated";

describe("SimulatedEdgeRelayHub & SimulatedRelayTransport", () => {
  let hub: ReturnType<typeof createSimulatedRelayHub>;

  beforeEach(() => {
    hub = createSimulatedRelayHub();
    vi.useFakeTimers();
  });

  it("connects client and receives room_joined with existing peers", () => {
    const t1 = new SimulatedRelayTransport({
      id: "p1",
      name: "Alice",
      roomCode: "ROOM",
      isHost: true,
      latencyMs: 10,
      hub,
    });

    const t2 = new SimulatedRelayTransport({
      id: "p2",
      name: "Bob",
      roomCode: "ROOM",
      isHost: false,
      latencyMs: 10,
      hub,
    });

    const t1Messages: any[] = [];
    const t2Messages: any[] = [];
    const t1Statuses: string[] = [];

    t1.onMessage((m) => t1Messages.push(m));
    t1.onStatusChange((s) => t1Statuses.push(s));
    t2.onMessage((m) => t2Messages.push(m));

    // Client 1 connects
    t1.connect();
    expect(t1Statuses).toContain("connecting");

    vi.advanceTimersByTime(15);
    expect(t1Statuses).toContain("connected");
    expect(t1Messages).toHaveLength(1);
    expect(t1Messages[0].type).toBe("room_joined");
    expect(t1Messages[0].peers).toEqual([]);

    // Client 2 connects to the same room
    t2.connect();
    vi.advanceTimersByTime(15);

    // Client 2 should receive room_joined with Client 1 in peers list
    expect(t2Messages.some((m) => m.type === "room_joined" && m.peers.some((p: any) => p.id === "p1"))).toBe(true);

    // Client 1 should receive peer_joined with Client 2
    vi.advanceTimersByTime(25);
    expect(t1Messages.some((m) => m.type === "peer_joined" && m.peer.id === "p2")).toBe(true);

    t1.destroy();
    t2.destroy();
  });

  it("broadcasts messages between peers in the same room", () => {
    const t1 = new SimulatedRelayTransport({
      id: "p1",
      name: "Alice",
      roomCode: "GAME",
      isHost: true,
      latencyMs: 10,
      hub,
    });

    const t2 = new SimulatedRelayTransport({
      id: "p2",
      name: "Bob",
      roomCode: "GAME",
      isHost: false,
      latencyMs: 10,
      hub,
    });

    const t1Received: any[] = [];
    const t2Received: any[] = [];

    t1.onMessage((m) => t1Received.push(m));
    t2.onMessage((m) => t2Received.push(m));

    t1.connect();
    t2.connect();
    vi.advanceTimersByTime(50);

    // Clear initial join handshakes
    t1Received.length = 0;
    t2Received.length = 0;

    // T1 broadcasts
    t1.send({ type: "CARD_PLAYED", card: "ace" });
    vi.advanceTimersByTime(30);

    // T2 should receive it, T1 should not receive its own broadcast
    expect(t2Received.some((m) => m.type === "CARD_PLAYED" && m.card === "ace")).toBe(true);
    expect(t1Received.some((m) => m.type === "CARD_PLAYED")).toBe(false);

    t1.destroy();
    t2.destroy();
  });

  it("broadcasts peer_left when a peer disconnects", () => {
    const t1 = new SimulatedRelayTransport({
      id: "p1",
      name: "Alice",
      roomCode: "LOBBY",
      isHost: true,
      latencyMs: 10,
      hub,
    });

    const t2 = new SimulatedRelayTransport({
      id: "p2",
      name: "Bob",
      roomCode: "LOBBY",
      isHost: false,
      latencyMs: 10,
      hub,
    });

    const t1Messages: any[] = [];
    t1.onMessage((m) => t1Messages.push(m));

    t1.connect();
    t2.connect();
    vi.advanceTimersByTime(50);

    t1Messages.length = 0;
    t2.disconnect();
    vi.advanceTimersByTime(30);

    expect(t1Messages.some((m) => m.type === "peer_left" && m.peerId === "p2")).toBe(true);

    t1.destroy();
    t2.destroy();
  });

  it("handles ping and returns pong with round-trip timestamp", () => {
    const t1 = new SimulatedRelayTransport({
      id: "p1",
      name: "Alice",
      roomCode: "PING",
      isHost: true,
      latencyMs: 15,
      hub,
    });

    const messages: any[] = [];
    t1.onMessage((m) => messages.push(m));

    t1.connect();
    vi.advanceTimersByTime(30);

    const sentAt = Date.now();
    t1.send({ type: "ping", sentAt });

    vi.advanceTimersByTime(40);
    const pong = messages.find((m) => m.type === "pong");
    expect(pong).toBeDefined();
    expect(pong.sentAt).toBe(sentAt);

    t1.destroy();
  });

  it("ignores in-flight events after transport destroy", () => {
    const t1 = new SimulatedRelayTransport({
      id: "p1",
      name: "Alice",
      roomCode: "DEAD",
      isHost: true,
      latencyMs: 50,
      hub,
    });

    const messages: any[] = [];
    t1.onMessage((m) => messages.push(m));

    t1.connect();
    // Destroy immediately before latency delay finishes
    t1.destroy();

    vi.advanceTimersByTime(100);
    expect(messages).toHaveLength(0);
  });
});
