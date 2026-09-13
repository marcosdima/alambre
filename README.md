# alambre

pnpm workspace monorepo for the `alambre` React Native framework and its applications.

## Structure

- `packages/alambre` — the reusable framework/library. Published to npm as `alambre`. Contains the capability factories (`createConfigProvider`, `createLangProvider`, `createLightDarkProvider`), behaviors (`createApiProvider`, `NavigatorProvider`, `ToastProvider`), base UI components, icons and animations. Must never depend on application code.
- `apps/demo` — the framework demo and manual QA playground. Consumes the library via the `workspace:*` protocol. Ships with an Expo app configuration and an Android prebuild.
- `apps/base-template` — the canonical application template (to be integrated).

Dependency direction is one-way: `apps/* -> packages/alambre`.

## Commands

From the repository root:

```bash
pnpm install                     # install all workspace dependencies
pnpm build                       # build all packages
pnpm lint                        # lint all packages
pnpm typecheck                   # typecheck all packages
pnpm --filter alambre build      # build the library only
pnpm --filter @alambre/demo ios  # run the demo app
```

Library changes are immediately available to the demo app through the workspace link; the demo app bundles the library source via Metro with no extra configuration.

## Publishing

The library is published from `packages/alambre`:

```bash
cd packages/alambre
npm version <bump>
npm publish
```

The package is built with `react-native-builder-bob` (ESM `module` target + TypeScript definitions). `files` includes both `dist/` and `src/`.

## Tooling

- Package manager: pnpm (workspace scopes `packages/*`, `apps/*`).
- Library build: `react-native-builder-bob`.
- Lint: shared ESLint 9 flat config, duplicated per package (each package resolves its own plugin deps under pnpm's strict node_modules layout).
- Demo app: Expo SDK 54 / React Native 0.81.
