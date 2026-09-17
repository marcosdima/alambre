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
