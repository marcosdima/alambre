import { describe, it, expect } from "vitest";
import * as RoomRelayAPI from "../src/index";

describe("Public API Contract: @alambre/room-relay", () => {
  it("exports room code utilities", () => {
    expect(RoomRelayAPI.ROOM_CODE_ALPHABET).toBeDefined();
    expect(typeof RoomRelayAPI.generateRoomCode).toBe("function");
    expect(typeof RoomRelayAPI.sanitizeRoomCode).toBe("function");
  });

  it("exports transport classes and factories", () => {
    expect(typeof RoomRelayAPI.SimulatedEdgeRelayHub).toBe("function");
    expect(typeof RoomRelayAPI.SimulatedRelayTransport).toBe("function");
    expect(typeof RoomRelayAPI.createSimulatedRelayHub).toBe("function");
    expect(RoomRelayAPI.defaultSimulatedHub).toBeDefined();
    expect(typeof RoomRelayAPI.WebSocketRelayTransport).toBe("function");
  });

  it("exports headless core client", () => {
    expect(typeof RoomRelayAPI.RoomRelayClient).toBe("function");
    expect(typeof RoomRelayAPI.createRoomRelay).toBe("function");
  });

  it("exports React hooks", () => {
    expect(typeof RoomRelayAPI.useRoomRelay).toBe("function");
    expect(typeof RoomRelayAPI.useRoomRelaySelector).toBe("function");
  });
});
