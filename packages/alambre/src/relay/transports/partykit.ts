import { WebSocketRelayTransport, type WebSocketRelayTransportOptions } from './websocket';
import { sanitizeRoomCode } from '../code';

declare const __DEV__: boolean | undefined;

export interface ResolvePartyKitUrlOptions {
  /**
   * Target host or full URL (e.g. "localhost:1999", "my-party.user.partykit.dev", "wss://my-party.user.partykit.dev").
   * If omitted, falls back to EXPO_PUBLIC_PARTYKIT_HOST, then EXPO_PUBLIC_RELAY_URL, and finally "localhost:1999".
   */
  host?: string | null;
  /**
   * Room code / identifier.
   */
  room: string;
  /**
   * Party name identifier in PartyKit.
   * @default "main"
   */
  party?: string;
  /**
   * Client unique identifier.
   */
  id?: string;
  /**
   * Client display name.
   */
  name?: string;
  /**
   * Whether the client is acting as host.
   */
  isHost?: boolean;
  /**
   * Optional room password / PIN for protected rooms.
   */
  password?: string;
  /**
   * Runtime platform ("android", "ios", "web"). Used for dev loopback routing.
   */
  platform?: 'android' | 'ios' | 'web' | string;
  /**
   * Protocol override ("ws" or "wss"). If not provided, it's inferred from host / environment.
   */
  protocol?: 'ws' | 'wss';
  /**
   * Whether to treat the environment as production.
   */
  isProduction?: boolean;
}

/**
 * Resolves the default local PartyKit dev host based on the active runtime environment.
 * Automatically maps Android emulators to "10.0.2.2:1999" and web/iOS to "localhost:1999".
 */
export function resolveDefaultPartyKitHost(options?: {
  platform?: 'android' | 'ios' | 'web' | string;
  port?: number;
}): string {
  const port = options?.port ?? 1999;
  const platform =
    options?.platform ??
    (typeof process !== 'undefined' && process.env?.EXPO_OS) ??
    (typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent) ? 'android' : 'web');

  if (platform === 'android') {
    return `10.0.2.2:${port}`;
  }
  return `localhost:${port}`;
}

/**
 * Resolves and formats a compliant PartyKit WebSocket URL.
 *
 * Route pattern: `${protocol}://${host}/parties/${party}/${room}?id=${id}&name=${name}&isHost=${isHost}`
 *
 * Automatically inspects process.env.EXPO_PUBLIC_PARTYKIT_HOST or process.env.EXPO_PUBLIC_RELAY_URL
 * when no host is explicitly provided.
 */
export function resolvePartyKitUrl(options: ResolvePartyKitUrlOptions): string {
  let rawHost = (options.host ?? '').trim();

  // Automatic environment variable lookup (standard Expo convention)
  if (!rawHost && typeof process !== 'undefined' && process.env) {
    rawHost = (
      process.env.EXPO_PUBLIC_PARTYKIT_HOST ||
      process.env.EXPO_PUBLIC_RELAY_URL ||
      ''
    ).trim();
  }

  if (!rawHost) {
    rawHost = resolveDefaultPartyKitHost({ platform: options.platform });
  }

  let protocol: 'ws' | 'wss' = 'ws';

  if (rawHost.startsWith('http://')) {
    protocol = 'ws';
    rawHost = rawHost.slice('http://'.length);
  } else if (rawHost.startsWith('https://')) {
    protocol = 'wss';
    rawHost = rawHost.slice('https://'.length);
  } else if (rawHost.startsWith('ws://')) {
    protocol = 'ws';
    rawHost = rawHost.slice('ws://'.length);
  } else if (rawHost.startsWith('wss://')) {
    protocol = 'wss';
    rawHost = rawHost.slice('wss://'.length);
  } else if (options.protocol) {
    protocol = options.protocol;
  } else {
    const isLocal =
      rawHost.includes('localhost') ||
      rawHost.includes('127.0.0.1') ||
      rawHost.includes('10.0.2.2') ||
      rawHost.includes('::1');

    const isProd =
      options.isProduction ??
      (typeof __DEV__ !== 'undefined'
        ? !__DEV__
        : typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');

    protocol = isLocal && !isProd ? 'ws' : 'wss';
  }

  // Strip trailing slashes and any trailing /parties/... or /party/... if user passed a full path
  const cleanHost = rawHost
    .replace(/\/parties(\/.*)?$/, '')
    .replace(/\/party(\/.*)?$/, '')
    .replace(/\/+$/, '');

  const party = (options.party ?? 'main').trim() || 'main';
  const cleanRoom = sanitizeRoomCode(options.room);

  const queryParts: string[] = [];
  if (options.id) {
    queryParts.push(`id=${encodeURIComponent(options.id)}`);
  }
  if (options.name) {
    queryParts.push(`name=${encodeURIComponent(options.name)}`);
  }
  if (typeof options.isHost === 'boolean') {
    queryParts.push(`isHost=${options.isHost ? 'true' : 'false'}`);
  }
  if (options.password) {
    queryParts.push(`password=${encodeURIComponent(options.password)}`);
  }

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  return `${protocol}://${cleanHost}/parties/${encodeURIComponent(party)}/${encodeURIComponent(cleanRoom)}${queryString}`;
}

export interface PartyKitRelayTransportOptions
  extends Omit<WebSocketRelayTransportOptions, 'url'> {
  /**
   * PartyKit host or URL (e.g. "localhost:1999", "my-party.username.partykit.dev").
   * Automatically falls back to process.env.EXPO_PUBLIC_PARTYKIT_HOST or process.env.EXPO_PUBLIC_RELAY_URL.
   */
  host?: string;
  /**
   * PartyKit party name identifier.
   * @default "main"
   */
  party?: string;
  /**
   * Optional room password / PIN for protected rooms.
   */
  password?: string;
}

/**
 * First-class PartyKit transport adapter for `@some-alambre/room-relay`.
 *
 * Connects to PartyKit servers using the canonical path schema:
 * `wss://${host}/parties/${party}/${room}?id=${id}&name=${name}&isHost=${isHost}`
 */
export class PartyKitRelayTransport extends WebSocketRelayTransport {
  protected party: string;
  protected host?: string;
  protected password?: string;

  constructor(options: PartyKitRelayTransportOptions) {
    const initialUrl = resolvePartyKitUrl({
      host: options.host,
      party: options.party,
      room: options.roomCode,
      id: options.id,
      name: options.name,
      isHost: options.isHost,
      password: options.password,
    });

    super({
      ...options,
      url: initialUrl,
    });

    this.party = options.party || 'main';
    this.host = options.host;
    this.password = options.password;
  }

  protected override buildUrl(): string {
    return resolvePartyKitUrl({
      host: this.host,
      party: this.party,
      room: this.roomCode,
      id: this.id,
      name: this.name,
      isHost: this.isHost,
      password: this.password,
    });
  }
}

/**
 * Factory creating a `PartyKitRelayTransport` instance.
 */
export function createPartyKitTransport(
  options: PartyKitRelayTransportOptions,
): PartyKitRelayTransport {
  return new PartyKitRelayTransport(options);
}
