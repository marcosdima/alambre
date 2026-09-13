# alambre

pnpm workspace monorepo for the `alambre` React Native framework and its applications.

## Structure

- `packages/alambre` — the reusable framework/library. Published to npm as `alambre`. Contains the capability factories (`createConfigProvider`, `createLangProvider`, `createLightDarkProvider`), behaviors (`createApiProvider`, `NavigatorProvider`, `ToastProvider`), base UI components, icons and animations. Must never depend on application code.
- `apps/base-template` — the canonical application template, currently showcasing the reference app **Colguetti** (reminders for the things to carry when leaving home). Consumes the library via the `workspace:*` protocol. Ships with an Expo app configuration and an Android prebuild.

Dependency direction is one-way: `apps/* -> packages/alambre`.

## Commands

From the repository root:

```bash
pnpm install                     # install all workspace dependencies
pnpm build                       # build all packages
pnpm lint                        # lint all packages
pnpm typecheck                   # typecheck all packages
pnpm --filter alambre build      # build the library only
pnpm --filter @alambre/base-template ios  # run the Colguetti app
```

Library changes are immediately available to the Colguetti app through the workspace link; the app bundles the library source via Metro with no extra configuration.

## Publishing

The library is published from `packages/alambre`:

```bash
cd packages/alambre
npm version <bump>
npm publish
```

The package is built with `react-native-builder-bob` (ESM `module` target + TypeScript definitions). `files` includes both `dist/` and `src/`. The package is currently in a frozen pre-baseline versioning phase — see the versioning policy in `docs/architecture.md` §9 before changing versions.

## Tooling

- Package manager: pnpm (workspace scopes `packages/*`, `apps/*`).
- Library build: `react-native-builder-bob`.
- Lint: shared ESLint 9 flat config, duplicated per package (each package resolves its own plugin deps under pnpm's strict node_modules layout).
- Demo app: Expo SDK 54 / React Native 0.81.
