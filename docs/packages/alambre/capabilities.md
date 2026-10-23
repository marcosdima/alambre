---
title: Capabilities Reference
summary: Content-driven external store factories backed by the Storage contract: createConfig, createLang, createLightDark, and createCollection.
---

# Capabilities Reference

Capabilities are content-driven store factories backed by the [`Storage`](storage.md) contract and synchronized via `useSyncExternalStore` (`useExternalStore`). They manage persistent application state with **zero React Context overhead**: no wrapping providers, no unmount crashes, and direct imperative access both inside and outside the component tree.

---

## 1. `createConfig`

Creates an external store and hook for flat, key-value string configuration (user preferences, flags, toggles).

### Signature
```typescript
import { createConfig } from 'alambre';

const { store, actions, useConfig } = createConfig<T extends Record<string, unknown>>(
  baseConfig: T,
  storage: Storage
);
```

### Factory Return
* **`store`**: Decoupled `Store<ConfigState<T>>` instance.
* **`actions`**: Object exposing imperative mutating methods:
  * `saveField<K extends keyof T>(field: K, value: T[K]): Promise<void>`: Updates field in memory and persists to storage (with safe JSON serialization for non-string values).
* **`useConfig()`**: Reactive hook returning `{ config: T, loading: boolean, saveField }`.

### Production Example
```typescript
// services/config.ts
import { createConfig, createStorage } from 'alambre';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = createStorage(AsyncStorage);

export const defaultConfig = {
  autoCross: 'true',
  defaultDifficulty: 'easy',
};

export const { store: configStore, actions: configActions, useConfig } = createConfig(
  defaultConfig,
  storage
);
```

```tsx
// components/DifficultyPicker.tsx
import { View, Text, Pressable } from 'react-native';
import { useConfig } from '../services/config';

export function DifficultyPicker() {
  const { config, saveField } = useConfig();

  return (
    <Pressable onPress={() => saveField('defaultDifficulty', 'hard')}>
      <Text>Current difficulty: {config.defaultDifficulty}</Text>
    </Pressable>
  );
}
```

> **Direct imperative access:** You can also call `configActions.saveField('autoCross', 'false')` from anywhere (e.g. background sync tasks, push notification handlers) without needing a React component context.

---

## 2. `createLang`

Creates an external store and hook for multi-language localization (i18n).

### Signature
```typescript
import { createLang } from 'alambre';

const { store, actions, useLang } = createLang<T extends Record<string, Record<string, string>>>(
  langs: T,
  storage: Storage
);
```

The default (initial) language is the first key of the `langs` dictionary.

### Factory Return
* **`store`**: Decoupled `Store<LangState<T>>` instance.
* **`actions`**: Object exposing imperative mutating methods:
  * `changeLang(lang: keyof T): Promise<void>`: Changes active language in store and saves preference to storage (`currentLanguage`).
* **`useLang()`**: Reactive hook returning `{ lang, currentLang, changeLang }`.

### Production Example
```typescript
// services/lang.ts
import { createLang } from 'alambre';
import { storage } from './config';

const dictionary = {
  es: { welcome: 'Hola', start: 'Comenzar' },
  en: { welcome: 'Hello', start: 'Start' },
};

export const { actions: langActions, useLang } = createLang(dictionary, storage);
```

```tsx
// components/Greeting.tsx
import { View, Text, Button } from 'react-native';
import { useLang } from '../services/lang';

export function Greeting() {
  const { lang, currentLang, changeLang } = useLang();

  return (
    <View>
      <Text>{lang.welcome}!</Text>
      <Button
        title={currentLang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        onPress={() => changeLang(currentLang === 'es' ? 'en' : 'es')}
      />
    </View>
  );
}
```

---

## 3. `createLightDark`

Creates an external store and hook for light and dark theme switching.

### Signature
```typescript
import { createLightDark } from 'alambre';

const { store, actions, useLightDark } = createLightDark<T extends object>(
  lightTheme: T,
  darkTheme: T,
  storage: Storage
);
```

The initial theme is `light` until `setThemeName` or storage hydration resolves.

### Factory Return
* **`store`**: Decoupled `Store<ThemeState>` instance.
* **`actions`**: Object exposing:
  * `setThemeName(themeName: 'light' | 'dark'): Promise<void>`: Persists and sets active theme.
  * `toggleTheme(): Promise<void>`: Toggles between `'light'` and `'dark'`.
  * `getThemeName(): 'light' | 'dark'`: Reads current theme name synchronously.
  * `getTheme(): T`: Reads current theme tokens synchronously.
* **`useLightDark()`**: Reactive hook returning `{ theme, currThemeName, toggleTheme, setThemeName }`.

### Production Example
```typescript
// services/theme.ts
import { createLightDark } from 'alambre';
import { storage } from './config';

export const light = { background: '#ffffff', color: '#111827', surface: '#f3f4f6' };
export const dark = { background: '#111827', color: '#f9fafb', surface: '#1f2937' };

export const {
  actions: themeActions,
  useLightDark,
} = createLightDark(light, dark, storage);
```

```tsx
// components/ThemeToggle.tsx
import { Pressable, Text } from 'react-native';
import { useLightDark } from '../services/theme';

export function ThemeToggle() {
  const { theme, currThemeName, toggleTheme } = useLightDark();

  return (
    <Pressable
      onPress={toggleTheme}
      style={{ backgroundColor: theme.surface, padding: 12, borderRadius: 8 }}
    >
      <Text style={{ color: theme.color }}>Mode: {currThemeName}</Text>
    </Pressable>
  );
}
```

---

## 4. `createCollection`

Creates a typed, persisted collection external store over the `Storage` contract with CRUD operations.

### Signature
```typescript
import { createCollection } from 'alambre';

interface CollectionOptions<T extends { id: string }> {
  storage: Storage;
  storageKey: string;
  initialValue?: T[];
}

const { store, actions, useCollection } = createCollection<T extends { id: string }>(
  options: CollectionOptions<T>
);
```

### Factory Return
* **`store`**: Decoupled `Store<CollectionState<T>>` instance.
* **`actions`**: Object exposing:
  * `add(record: T): Promise<void>`: Adds record to the collection and persists as JSON.
  * `update(id: string, patch: Partial<T>): Promise<void>`: Merges patch into item matching `id` and persists.
  * `remove(id: string): Promise<void>`: Removes item matching `id` and persists.
* **`useCollection()`**: Reactive hook returning `{ records, loading, add, update, remove }`.

### Production Example
```typescript
// services/records.ts
import { createCollection } from 'alambre';
import { storage } from './config';

export interface RecordItem {
  id: string;
  title: string;
  score: number;
}

export const {
  actions: recordActions,
  useCollection: useRecords,
} = createCollection<RecordItem>({
  storage,
  storageKey: 'app.records',
  initialValue: [],
});
```

```tsx
// components/RecordList.tsx
import { FlatList, Text, View, Button, ActivityIndicator } from 'react-native';
import { useRecords } from '../services/records';

export function RecordList() {
  const { records, loading, add, remove } = useRecords();

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title}: {item.score}</Text>
            <Button title="Delete" onPress={() => remove(item.id)} />
          </View>
        )}
      />
      <Button
        title="Add Entry"
        onPress={() => add({ id: String(Date.now()), title: 'Game', score: 100 })}
      />
    </View>
  );
}
```

---

## 5. Hydration Lifecycle & Zero-Context Architecture

All capabilities backed by `Storage` follow a consistent, non-blocking asynchronous hydration lifecycle.

### Immediate Synchronous Initialization vs. Non-blocking Async Hydration
1. **Zero Provider Nesting:** Because capabilities are powered by `useSyncExternalStore`, there is **no requirement to wrap the application in `<ConfigProvider>`, `<LangProvider>`, or `<LightDarkProvider>`**. Components call `useConfig()`, `useLang()`, etc., directly.
2. **Immediate Initial Frame:** When a factory (`createConfig`, `createLang`, `createLightDark`, `createCollection`) executes at module evaluation, it synchronously sets up an in-memory store with default values. This guarantees zero white-screen flash and instant first-frame paint.
3. **Immediate Hydration Trigger:** Hydration starts asynchronously (`void hydrate()`) immediately upon store creation. When storage reads resolve, the internal store calls `setState` and triggers a clean, tear-free re-render only for components subscribed to that specific capability via `useSyncExternalStore`.
4. **Loading State in Collections:**
   Unlike key-value capabilities where defaults are valid active states, collections represent user records. `useCollection()` exposes `loading: boolean` so components can render skeletons or activity spinners until hydration finishes.

### Storage Failure & Corrupted Data Handling
- **Safe JSON Fallback:** `createCollection` wraps storage deserialization in a safe JSON parser. If stored raw text is null, unparseable, or not a JSON array, it safely falls back to `initialValue` without throwing unhandled exceptions.
- **Async Write Resilience:** Mutating actions (`add`, `update`, `remove`, `saveField`, `changeLang`, `setThemeName`) update memory state optimistically and `await storage.set(...)`. If the underlying storage engine throws an error, the returned Promise rejects, allowing callers to catch errors or display toasts if desired.


