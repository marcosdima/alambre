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
  storage: Storage,
  defaultLang?: keyof T
);
```

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

export const { LangProvider, useLang } = createLangProvider(langs, storage, 'es');
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
  storage: Storage,
  defaultTheme?: 'light' | 'dark'
);
```

### Hook Return
```typescript
const { theme, currThemeName, toggleTheme, setTheme } = useLightDark();
```
* `theme: T`: Active theme tokens (colors, surfaces, borders).
* `currThemeName`: `'light' | 'dark'`.
* `toggleTheme(): Promise<void>`: Toggles between light and dark themes.
* `setTheme(name: 'light' | 'dark'): Promise<void>`: Sets theme explicitly.

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
