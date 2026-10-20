# Room Relay Deployment Templates

This directory provides production deployment blueprints for hosting `@some-alambre/room-relay` servers across containerized clouds and global serverless edge networks.

---

## 1. Containerized Deployment (Docker / Fly.io / Railway / Render)

The root `Dockerfile` builds a minimal (approx. 45MB) Alpine Linux Node.js container hosting the standalone edge relay server.

### Local Testing with Docker
```bash
# Build container image
docker build -t alambre-relay -f packages/room-relay/templates/Dockerfile .

# Run container on port 8787
docker run -p 8787:8787 alambre-relay
```

### Deploying to Fly.io
```bash
fly launch --dockerfile packages/room-relay/templates/Dockerfile
fly deploy
```

### Environment Variables
- `PORT`: Listening port (default `8787`).
- `NODE_ENV`: Set to `production`.

---

## 2. Cloudflare Workers + Durable Objects

Located in `cloudflare/`, this template maps each room code (e.g. `XK89`) directly to a Cloudflare Durable Object at the nearest edge datacenter.

### Features
- **Zero cold starts**: Hibernation-capable WebSockets.
- **Global affinity**: Players in the same room connect to the same Durable Object instance regardless of where in the world they connect from.
- **Automatic TLS**: Free `wss://` endpoints managed by Cloudflare.

### Deployment with Wrangler
```bash
cd packages/room-relay/templates/cloudflare
npx wrangler deploy
```

---

## 3. Client Connection Best Practices

In your React Native application, connect using `resolveRelayUrl`:

```tsx
import { useRoomRelay, resolveRelayUrl } from '@some-alambre/room-relay';

const SERVER_URL = resolveRelayUrl(
  process.env.EXPO_PUBLIC_RELAY_URL ?? 'wss://my-relay.fly.dev/room'
);

export function MyGame() {
  const relay = useRoomRelay({
    roomCode: 'XK89',
    mode: 'websocket',
    serverUrl: SERVER_URL,
  });

  return (
    <Text>Latency: {relay.latencyMs}ms</Text>
  );
}
```
