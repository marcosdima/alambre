# alambre

Reusable framework for React Native applications: capabilities, behaviors, headless hooks, storage helpers and behavior-first UI primitives.

## Install

```bash
npm install alambre
# or
pnpm add alambre
```

Peer dependencies (install the ones you use): `react`, `react-native`, `react-native-svg`, `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, `@tanstack/react-query`.

## Quick start

Capabilities are content-driven: the application supplies the content and the framework supplies the behavior, state and persistence.

```tsx
import { createConfigProvider, createStorage } from 'alambre';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storage = createStorage({
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
});

const { ConfigProvider, useConfig } = createConfigProvider(
  { autoCross: 'true' },
  storage,
);
```

## Scope

- **Capabilities** (`createConfigProvider`, `createLangProvider`, `createLightDarkProvider`, `createCollectionProvider`) — persisted state over the `Storage` contract.
- **Behaviors** (`createApiProvider`, `NavigatorProvider`, `ToastProvider`, `ConfirmProvider`) — interaction patterns decoupled from presentation.
- **Hooks** (`useHistoryState`, `useStopwatch`, history/time helpers) — headless state utilities.
- **Storage** (`createStorage`, `getJson`/`setJson`/`removeJson`, `readCollection`/`writeCollection`).
- **UI** (`Button`, `TimePicker`, `AlambreIcons`) — behavior-first primitives; the application owns presentation.

## Documentation

The complete functional reference lives in the repository:

- [Functional reference](https://github.com/marcosdima/alambre/blob/main/docs/reference/index.md) — capabilities, behaviors, storage, hooks and components.
- [Architecture](https://github.com/marcosdima/alambre/blob/main/docs/framework/architecture.md) — principles, boundaries and the public type contract.
- [Project guidelines](https://github.com/marcosdima/alambre/blob/main/docs/guidelines/workflow.md) — contribution and workflow.

## Monorepo

Inside the `alambre` workspace, applications depend on the local package via the `workspace:*` protocol:

```json
{
  "dependencies": {
    "alambre": "workspace:*"
  }
}
```

## License

MIT
