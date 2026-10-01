---
title: Storage Layer Reference
summary: The agnostic persistence contract, createStorage adapter, and JSON/collection helpers.
---

# Storage Layer Reference

`alambre` provides an agnostic persistence contract that decouples application storage engines (e.g., `@react-native-async-storage/async-storage`, `mmkv`, memory storage) from framework capabilities.

---

## 1. `Storage` Contract & `createStorage`

Adapts raw key-value storage functions to the framework `Storage` contract.

### Contract Definition
```typescript
export type Storage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove?: (key: string) => Promise<void>;
};
```

### Factory Function
```typescript
import { createStorage } from 'alambre';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = createStorage({
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, val) => AsyncStorage.setItem(key, val),
  removeItem: (key) => AsyncStorage.removeItem(key),
});
```

### Raw Binding (`RawStorage`)
`createStorage` adapts a raw binding where `removeItem` is optional:

```typescript
export type RawStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem?: (key: string) => Promise<void>;
};
```

`createStorage` maps `getItem`/`setItem`/`removeItem` to the contract's `get`/`set`/`remove`.

---

## 2. JSON Helpers

Type-safe serialization helpers operating over any `Storage` instance.

### `getJson`
Retrieves and deserializes a JSON object from storage. Returns `null` if the key does not exist or JSON parsing fails.
```typescript
import { getJson } from 'alambre';

const session = await getJson<GameSession>(storage, 'activeGame');
```

### `setJson`
Serializes and saves a JSON object into storage.
```typescript
import { setJson } from 'alambre';

await setJson(storage, 'activeGame', sessionData);
```

### `removeJson`
Deletes a key using the storage adapter's `remove` method.
```typescript
import { removeJson } from 'alambre';

await removeJson(storage, 'activeGame');
```

---

## 3. Collection Helpers

Low-level collection persistence helpers used directly or outside React contexts (e.g., in background tasks or schedulers).

### `readCollection`
Reads an array of records matching `{ id: string }` from storage. Returns an empty array if empty or invalid.
```typescript
import { readCollection } from 'alambre';

const items = await readCollection<Item>(storage, 'app.items');
```

### `writeCollection`
Serializes and saves an array of records to storage.
```typescript
import { writeCollection } from 'alambre';

await writeCollection(storage, 'app.items', updatedItems);
```

---

## 4. Storage Adapters & Patterns

### In-Memory Storage Adapter (Testing & Fallbacks)
When running in Node unit tests, CI environments, or web previews without `@react-native-async-storage/async-storage`, instantiate an in-memory adapter that fulfills the `Storage` contract:

```typescript
// storage/memory-storage.ts
import type { Storage } from 'alambre';

export function createMemoryStorage(initialData: Record<string, string> = {}): Storage {
  const store = new Map<string, string>(Object.entries(initialData));

  return {
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
    },
    remove: async (key: string) => {
      store.delete(key);
    },
  };
}
```

### High-Performance MMKV Adapter
For applications requiring near-instant synchronous disk operations, wrap `react-native-mmkv` inside the `Storage` contract:

```typescript
// storage/mmkv-storage.ts
import { MMKV } from 'react-native-mmkv';
import type { Storage } from 'alambre';

const mmkv = new MMKV();

export const mmkvStorage: Storage = {
  get: async (key: string) => mmkv.getString(key) ?? null,
  set: async (key: string, value: string) => {
    mmkv.set(key, value);
  },
  remove: async (key: string) => {
    mmkv.delete(key);
  },
};
```

---

## 5. Concurrency, Performance & Resilience

### Safe Deserialization
All built-in helpers (`getJson`, `readCollection`) wrap `JSON.parse` in guarded try/catch blocks. If corrupted data or an empty string is encountered in storage, the helpers safely return `null` (or the fallback array) rather than throwing runtime syntax errors.

### High-Frequency Writes
Because `Storage.set` is an asynchronous I/O operation, rapidly dispatching consecutive updates (such as saving slider values on every pan pixel) can cause write contention and disk thrashing.
- **Debouncing:** When persisting high-frequency UI events, debounce the storage write while immediately updating local React state:
```typescript
// Example: debouncing rapid persistent config changes
import { useEffect, useRef } from 'react';

export function useDebouncedSave<T>(
  value: T,
  saveFn: (val: T) => Promise<void>,
  delayMs = 300,
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void saveFn(value);
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delayMs, saveFn]);
}
```

### Error Isolation
The `Storage` contract promises never swallow errors silently in `set` or `remove`. If native persistence throws an error (e.g. disk space full, permission denied), the promise rejects, giving caller capabilities and domain features complete visibility to notify the user via a Toast or alert.

