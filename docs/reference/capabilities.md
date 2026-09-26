---
title: Capabilities Reference
summary: Content-driven provider factories backed by the Storage contract: createConfigProvider, createLangProvider, createLightDarkProvider, and createCollectionProvider.
---

# Capabilities Reference

Capabilities are content-driven provider factories backed by the [`Storage`](storage.md) contract. They manage persistent application state, reactively updating components across the tree.

---

## 1. `createConfigProvider`

Creates a provider and hook for flat, key-value string configuration (user preferences, flags, toggles).

### Signature
```typescript
import { createConfigProvider } from 'alambre';

const { ConfigProvider, useConfig } = createConfigProvider<T>(
  defaultConfig: T,
  storage: Storage
);
```

### Hook Return
```typescript
const { config, saveField } = useConfig();
```
* `config: T`: Current configuration values.
* `saveField(field: keyof T, value: string): Promise<void>`: Updates a single field and persists it.

### Example
```typescript
// providers/config.ts
import { createConfigProvider } from 'alambre';
import { storage } from '../storage';

const defaultConfig = {
  autoCross: 'true',
  defaultDifficulty: 'easy',
};

export const { ConfigProvider, useConfig } = createConfigProvider(defaultConfig, storage);
```

---

## 2. `createLangProvider`

Creates a provider and hook for multi-language localization (i18n).

### Signature
```typescript
import { createLangProvider } from 'alambre';

const { LangProvider, useLang } = createLangProvider<T>(
  langs: T,
  storage: Storage
);
```

The default (initial) language is the first key of the `langs` dictionary. There is no `defaultLang` option.

### Hook Return
```typescript
const { lang, currentLang, changeLang } = useLang();
```
* `lang`: Dictionary object corresponding to `currentLang`.
* `currentLang`: Key of the current active language (e.g. `'es'`, `'en'`).
* `changeLang(code: keyof T): Promise<void>`: Changes active language and saves preference.

### Example
```typescript
// providers/lang.tsx
import { createLangProvider } from 'alambre';
import { storage } from '../storage';

const langs = {
  es: { welcome: 'Hola', start: 'Comenzar' },
  en: { welcome: 'Hello', start: 'Start' },
};

export const { LangProvider, useLang } = createLangProvider(langs, storage);
```

---

## 3. `createLightDarkProvider`

Creates a provider and hook for light and dark theme switching.

### Signature
```typescript
import { createLightDarkProvider } from 'alambre';

const { LightDarkProvider, useLightDark } = createLightDarkProvider<T>(
  lightTheme: T,
  darkTheme: T,
  storage: Storage
);
```

The initial theme is `light` until `setThemeName` persists a preference. There is no `defaultTheme` option.

### Hook Return
```typescript
const { theme, currThemeName, toggleTheme, setThemeName } = useLightDark();
```
* `theme: T`: Active theme tokens (colors, surfaces, borders).
* `currThemeName`: `'light' | 'dark'`.
* `toggleTheme(): Promise<void>`: Toggles between light and dark themes.
* `setThemeName(name: 'light' | 'dark'): Promise<void>`: Sets theme explicitly.

### Example
```typescript
// providers/theme.ts
import { createLightDarkProvider } from 'alambre';
import { storage } from '../storage';

export const light = { background: '#ffffff', color: '#111827' };
export const dark = { background: '#111827', color: '#f9fafb' };

export const { LightDarkProvider, useLightDark } = createLightDarkProvider(light, dark, storage);
```

---

## 4. `createCollectionProvider`

Creates a typed, persisted collection provider over the `Storage` contract with CRUD operations.

### Signature
```typescript
import { createCollectionProvider } from 'alambre';

interface CollectionOptions {
  storage: Storage;
  storageKey: string;
  initialValue?: T[];
  hookName?: string;
}

const { Provider, useValue } = createCollectionProvider<T extends { id: string }>(
  options: CollectionOptions
);
```

### Hook Return (`UseCollectionType<T>`)
```typescript
const { records, loading, add, update, remove } = useValue();
```
* `records: T[]`: Array of loaded records.
* `loading: boolean`: True while initially loading from storage.
* `add(record: T): Promise<void>`: Adds record to the collection and persists.
* `update(id: string, patch: Partial<T>): Promise<void>`: Merges patch into item matching `id`.
* `remove(id: string): Promise<void>`: Removes item matching `id`.

The empty state before hydration is `initialValue` (defaults to `[]`); `hookName` (default `'Collection'`) only customizes the missing-provider error message.

### Example
```typescript
// session/records-context.tsx
import { createCollectionProvider } from 'alambre';
import { storage } from '../storage';

interface RecordItem {
  id: string;
  score: number;
  completedAt: string;
}

const { Provider: RecordsProvider, useValue: useRecords } = createCollectionProvider<RecordItem>({
  storage,
  storageKey: 'myapp.records',
  hookName: 'Records',
});
```

---

## 5. Hydration Lifecycle & Error Resilience

All capabilities backed by `Storage` follow a consistent, non-blocking asynchronous hydration lifecycle.

### Initial Synchronous Render vs. Async Hydration
1. **Immediate Initial Frame:** When a provider mounts, it initializes synchronously with in-memory default state (`baseConfig` for Config, the first language key for Lang, `light` theme for LightDark, and `initialValue` with `loading: true` for Collection). This guarantees zero white-screen flash and instant first-frame paint.
2. **Mount Hydration (`hydrate`):** During `useEffect`, the provider fires an asynchronous `hydrate()` task that calls `storage.get(...)`. When the storage read resolves, the internal store calls `setState` and triggers a reactive re-render with persisted values.
3. **Handling the `loading` State in Collections:**
   Unlike key-value capabilities where defaults are valid active states, collections often represent remote or persisted user datasets. `useCollection()` exposes `loading: boolean`:
   ```tsx
   function RecordList() {
     const { records, loading } = useRecords();

     if (loading) {
       return <ActivityIndicator size="large" />;
     }

     if (records.length === 0) {
       return <Text>No records yet.</Text>;
     }

     return (
       <FlatList
         data={records}
         keyExtractor={(item) => item.id}
         renderItem={({ item }) => <RecordRow item={item} />}
       />
     );
   }
   ```

### Storage Failure & Corrupted Data Handling
- **Missing or Corrupted JSON:** `createCollectionProvider` wraps storage deserialization in a safe JSON parser. If stored raw text is null, unparseable, or not a JSON array, it safely falls back to `initialValue` without throwing unhandled exceptions.
- **Async Write Failure:** Capability action methods (`add`, `update`, `remove`, `saveField`, `changeLang`, `setThemeName`) update internal memory state optimistically and then `await storage.set(...)`. If the underlying storage engine throws an error (e.g. disk full, quota exceeded), the returned Promise rejects, allowing callers to catch errors or display toasts if desired.

---

## 6. Root Provider Composition Pattern

To prevent deep JSX nesting ("provider pyramid of doom") at application root, compose capability providers cleanly using a helper or a dedicated `AppProviders` component:

```tsx
// providers/AppProviders.tsx
import type { ReactNode } from 'react';
import { ConfigProvider } from './config';
import { LangProvider } from './lang';
import { LightDarkProvider } from './theme';
import { RecordsProvider } from './records';

type ProviderComponent = React.ComponentType<{ children: ReactNode }>;

const composeProviders = (...providers: ProviderComponent[]) => {
  return ({ children }: { children: ReactNode }) => (
    providers.reduceRight(
      (acc, Provider) => <Provider>{acc}</Provider>,
      children,
    )
  );
};

export const AppProviders = composeProviders(
  ConfigProvider,
  LangProvider,
  LightDarkProvider,
  RecordsProvider,
);
```

```tsx
// App.tsx
import { AppProviders } from './providers/AppProviders';
import { RootNavigator } from './navigation/RootNavigator';

export default function App() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
```

