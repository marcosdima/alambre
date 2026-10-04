# alambre

pnpm workspace monorepo for the `alambre` React Native framework and its applications.

## Structure

- `packages/alambre` — the reusable framework/library. Published to npm as `alambre`. Contains the capability factories (`createConfigProvider`, `createLangProvider`, `createLightDarkProvider`, `createCollectionProvider`), behaviors (`createApiProvider`, `NavigatorProvider`, `ToastProvider`, `ConfirmProvider`), headless hooks (`useHistoryState`, `useStopwatch`), base UI components, icons and animations. Must never depend on application code.
- `apps/colguetti` — the reference application (reminders for the things to carry when leaving home). It is a real product that exercises and validates `alambre`. Consumes the library via the `workspace:*` protocol. Ships with an Expo app configuration and an Android prebuild.
- `apps/cross-logic` — the deductive logic puzzle game (Logic Grid Puzzle). Exercises interactive grid state, headless undo/redo history, auto-cross deduction rules and session persistence over `alambre`.
- `apps/base-template` — the canonical application **template**: a generic, product-free skeleton to bootstrap new apps on top of `alambre` (capabilities wired, navigator with subpages, toast, storage adapters, validation setup). Its standalone copy is the GitHub template repository `marcosdima/base-expo` (see *Bootstrapping a new app* below).

Detailed functional reference for all alambre capabilities, hooks, behaviors, and components is documented in [`docs/reference/index.md`](docs/reference/index.md).

Dependency direction is one-way: `apps/* -> packages/alambre`.

## Commands

From the repository root:

```bash
pnpm install                     # install all workspace dependencies
pnpm build                       # build all packages
pnpm lint                        # lint all packages
pnpm typecheck                   # typecheck all packages
pnpm --filter alambre build      # build the library only
pnpm --filter @alambre/colguetti ios  # run the Colguetti app
```

Inside the monorepo the apps resolve `alambre` from its TypeScript source via Metro (Fast Refresh); standalone apps bootstrapped from the template resolve it from the published package `exports` (`dist/module`). Either way, rebuild the library after a change: `pnpm --filter alambre build`.

## Releasing Colguetti (Google Play)

The reference app ships to Google Play as an Android App Bundle (`.aab`) built with EAS Build, which handles signing automatically. The routine is centralized in pnpm scripts at the repository root:

```bash
pnpm eas:login          # one-time: connect your Expo account (sign up at expo.dev)
pnpm eas:build:apk      # internal APK for manual testing (EAS `preview` profile)
pnpm eas:build:aab      # signed AAB for the Play Store (EAS `production` profile)
pnpm eas:submit         # upload the latest EAS build to Play (needs a Google Play developer account)
```

Centralized release routine (bump `version` + `android.versionCode` in `apps/colguetti/app.json`, run typecheck/lint/test, build the AAB):

```bash
pnpm colguetti:release -- --dry-run            # preview only, writes nothing
pnpm colguetti:release -- --version=1.0.1      # explicit version
```

Local APK builds for quick device installs (no EAS needed):

```bash
pnpm --filter @alambre/colguetti apk           # assembleDebug
pnpm --filter @alambre/colguetti apk:install   # assemble + adb install
```

Before the first Play Store submission, `apps/colguetti/app.json` must carry the final `android.package` (`com.alambre.colguetti`), a monotonic `android.versionCode` and the store `version`. The Android package is immutable once published, so decide it before the first release. EAS builds in the cloud from `app.json` and ignores the local, gitignored `apps/*/android` prebuilds (those are only used by local `expo run:android`).

## Publishing

The library is published from `packages/alambre`:

```bash
cd packages/alambre
npm version <bump>
npm publish
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
