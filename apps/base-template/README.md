# Base Template

Canonical starting point for a new application on top of `alambre`. This is a **generic skeleton** — it carries no product logic; the reference product is `apps/colguetti`.

## What is wired in

- Expo SDK 54 (managed, no prebuild committed; run features like notifications with `npx expo run:android`).
- `alambre` capabilities and behaviors, connected through a `Storage` adapter over AsyncStorage:
  - `createConfigProvider` (`src/providers/config.ts`)
  - `createLightDarkProvider` (`src/providers/theme.ts`)
  - `createLangProvider` (es/en, `src/providers/lang.tsx`)
  - `NavigatorProvider` + `ToastProvider` with an app-owned toast body (`src/providers/toast.tsx`)
- Navigator chrome, light/dark toggle and small presentational components live in the app (see `docs/ui.md`): `AppNavigatorBody`, `ToggleLightDark`, `AppButton`, `AppTitle`.
- Subpage navigation example: `navigate('home', { subpage: 'details' })`.
- Validation setup: ESLint, `tsc`, Vitest with one example test (`tests/storage.test.ts`).

Add persisted collections of typed records with `createCollectionProvider` from `alambre` (see `apps/colguetti/src/items/items-context.tsx` for the adapter pattern).

## Start a new app from this template

1. Copy the directory (or fork) and rename: `package.json` `name`, `app.json` `name`/`slug`.
2. `pnpm install` and adjust the Expo intro (`app.json`) with your own identity.
3. Replace the placeholder views with your product screens.
4. Run checks: `pnpm --filter @alambre/base-template lint`, `typecheck`, `test`.

The library is consumed via `pnpm --filter alambre build` (Metro resolves `dist/` through the `workspace:*` link).