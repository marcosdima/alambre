# alambre

pnpm workspace monorepo for the `alambre` React Native framework and its applications.

## Structure

- `packages/alambre` — the reusable headless framework/library. Published to npm as `alambre`. Contains the capability factories (`createConfig`, `createLang`, `createLightDark`, `createCollection`), behaviors (`createApi`, `NavigatorProvider`, `ToastHost`, `ConfirmHost`), headless kinetic/spatial hooks (`useWavefront`, `usePressKinetics`, `useSpatialFlip`, `useFlightTrajectory`, `useKineticSwipe`, `useKineticCarousel`, `useKineticPipeline`, `useKineticChoreography`), compound form primitives, and icons. Must never depend on application code.
- `packages/ui` (`@some-alambre/ui`) — tactile, accessible mobile UI kit and design token system built on top of `alambre`.
- `packages/room-relay` (`@some-alambre/room-relay`) — lightweight headless ephemeral multi-device room synchronization over WebSockets and in-memory simulated hubs.
- `apps/base-template` — the canonical application **template**: a generic, product-free skeleton to bootstrap new apps on top of `alambre` and `@some-alambre/ui` (capabilities wired, navigator with subpages, toast, storage adapters, validation setup). Its standalone copy is the GitHub template repository `marcosdima/base-expo` (see *Bootstrapping a new app* below).
- `apps/playground` — the behavioral and kinetic proving ground for prototyping and verifying headless physics, spatial card mechanics, and multiplayer room synchronization before extraction.

Detailed functional reference for all alambre capabilities, hooks, behaviors, and components is documented in [`docs/reference/index.md`](docs/reference/index.md).

Dependency direction is strictly one-way: `apps/* -> packages/*`.

## Commands

From the repository root:

```bash
pnpm install                          # install all workspace dependencies
pnpm build                            # build all packages
pnpm lint                             # lint all packages
pnpm typecheck                        # typecheck all packages
pnpm test                             # run all unit & contract test suites
pnpm --filter alambre build           # build the core library only
pnpm --filter @alambre/playground ios # run the Playground app
```

Inside the monorepo the apps resolve `alambre`, `@some-alambre/ui`, and `@some-alambre/room-relay` from their TypeScript source via Metro (Fast Refresh); standalone apps bootstrapped from the template resolve `alambre` from the published package `exports` (`dist/module`). Either way, rebuild the library after a change: `pnpm --filter alambre build`.

## Publishing

The library and packages are published from their respective directories:

```bash
# Core framework
cd packages/alambre && npm stage publish

# UI package
cd packages/ui && npm stage publish

# Room relay package
cd packages/room-relay && npm stage publish
```

The package is built with `react-native-builder-bob` (ESM `module` target + TypeScript definitions). `files` includes both `dist/` and `src/`. The package is currently in a frozen pre-baseline versioning phase — see the versioning policy in `docs/framework/architecture.md` §9 before changing versions.

> The standalone template repo pins the exact published version, so a fresh publish must exist before exporting the template. `scripts/export-template.sh` verifies that the standalone compiles against the `alambre` version on the npm registry and aborts with instructions when the registry copy is stale or missing.

## Bootstrapping a new app

The template also lives as a standalone GitHub template repository:

- **Template repo:** https://github.com/marcosdima/base-expo — use the GitHub *"Use this template"* button to create a new app repository outside this monorepo.
- Apps created that way depend on the **published** `alambre` package (pinned to the exact version at export time; the pre-baseline versioning policy is `docs/framework/architecture.md` §9) and stay connected to the framework through npm/pnpm: `pnpm add alambre@latest` / `npm install alambre@latest`.

Regenerate the standalone template repo from `apps/base-template` after template changes:

```bash
bash scripts/export-template.sh
```

The script checks the working tree, builds the library, seeds the remote with `git subtree split` on first run, and then overlays the standalone-specific files (registry `alambre` pin, `.gitignore`, fresh `pnpm-lock.yaml`, license) and pushes to the template repo. Before pushing, it verifies the exported app installs, typechecks and tests against the published `alambre` (set `SKIP_VERIFY=1` to bypass).

## Tooling

- Package manager: pnpm (workspace scopes `packages/*`, `apps/*`).
- Library build: `react-native-builder-bob`.
- Lint: shared ESLint 9 flat config, duplicated per package (each package resolves its own plugin deps under pnpm's strict node_modules layout).
- Lint/typecheck/test run per package; the reference app (Colguetti) is Expo SDK 54 / React Native 0.81.
