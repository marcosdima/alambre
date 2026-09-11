# alambre

`alambre` is a React Native utility library focused on reusable modules, small UI helpers, and navigation/testing playgrounds.

This repository includes a working test app (`tests/`) where modules and components are exercised in real screens.

## Current Scope

- Module factories to keep feature logic encapsulated:
	- `createConfigProvider`
	- `createLangProvider`
	- `createLightDarkProvider`
	- `createApiProvider` (powered by TanStack Query)
	- `NavigatorProvider`
	- `ToastProvider`
- Navigation test flow with nested pages (`home`, `configuration`, `advance`, `play`, `toast`)
- Toast provider integration with queue and custom toast component support
- Theme switching (light/dark) with persisted storage
- API playground in tests:
	- typed route catalog
	- generated query/mutation hooks from route definitions
	- route execution demo and structured response rendering

## Project Structure (high level)

- `src/modules/`: module system and domain modules
- `src/components/`: base UI components and animations
- `tests/providers/`: test providers for config/lang/theme/api/toast
- `tests/views/`: test screens grouped by domain
- `tests/navigator/`: test app navigation config and root test screen
- `App.tsx`: wires providers and test screens together

## Module Architecture

The project uses a class-based module architecture that separates state logic from React rendering.

### Core pieces

- `BaseModule<TState>`:
	- Owns module state.
	- Exposes `getState()` for reads.
	- Exposes `subscribe()` to notify observers on state changes.
	- Exposes protected `setState()` to update state and broadcast updates.
	- Supports optional async initialization via `init()`.
	- Supports cleanup via `dispose()`.
- `createModuleProvider(...)`:
	- Adapts a `BaseModule` instance to React Context.
	- Creates one module instance per provider lifecycle.
	- Subscribes React state to module updates.
	- Runs `module.init()` on mount.
	- Calls `unsubscribe()` and `module.dispose()` on unmount.

### Data flow

1. A provider creates one module instance.
2. React initializes local state with `module.getState()`.
3. Provider subscribes with `module.subscribe(setState)`.
4. Module methods call `setState(...)`.
5. All subscribers are notified and React re-renders.
6. On unmount, provider unsubscribes and disposes module resources.

This keeps state transitions centralized in classes while preserving React's declarative rendering.

## Domain Modules

- `config`:
	- Persists and updates simple string config fields.
	- Exposes `config` and `saveField`.
- `lang`:
	- Persists selected language key.
	- Exposes `lang`, `currentLang`, and `changeLang`.
- `theme`:
	- Persists current theme name (`light` or `dark`).
	- Exposes `theme`, `currThemeName`, `toggleTheme`, and `setThemeName`.
- `api`:
	- Generates typed routes and query/mutation hooks.
	- Wraps TanStack Query setup and request helpers.
- `navigator`:
	- Stores page stack and scroll state.
	- Exposes navigation actions and current page metadata.
- `toast`:
	- Handles toast queue, timers, and lifecycle.
	- Renders a required client `ToastComponent`.

## Quick Start

Install dependencies:

```bash
npm install
```

Run the test app:

```bash
npm run android
```

Other useful scripts:

```bash
npm run lint
npm run build
```