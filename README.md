# alambre

pnpm workspace monorepo for the `alambre` React Native framework and its applications.

## Structure

- `packages/alambre` — the reusable framework/library. Published to npm as `alambre`. Contains the capability factories (`createConfigProvider`, `createLangProvider`, `createLightDarkProvider`), behaviors (`createApiProvider`, `NavigatorProvider`, `ToastProvider`), base UI components, icons and animations. Must never depend on application code.
- `apps/colguetti` — the reference application (reminders for the things to carry when leaving home). It is a real product that exercises and validates `alambre`. Consumes the library via the `workspace:*` protocol. Ships with an Expo app configuration and an Android prebuild.
- `apps/base-template` — the canonical application **template**: a generic, product-free skeleton to bootstrap new apps on top of `alambre` (capabilities wired, navigator with subpages, toast, storage adapters, validation setup). Its standalone copy is the GitHub template repository `marcosdima/base-expo` (see *Bootstrapping a new app* below).

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

## Publishing

The library is published from `packages/alambre`:

```bash
cd packages/alambre
npm version <bump>
npm publish
```

The package is built with `react-native-builder-bob` (ESM `module` target + TypeScript definitions). `files` includes both `dist/` and `src/`. The package is currently in a frozen pre-baseline versioning phase — see the versioning policy in `docs/architecture.md` §9 before changing versions.

## Bootstrapping a new app

The template also lives as a standalone GitHub template repository:

- **Template repo:** https://github.com/marcosdima/base-expo — use the GitHub *"Use this template"* button to create a new app repository outside this monorepo.
- Apps created that way depend on the **published** `alambre` package (pinned to the exact version at export time; the pre-baseline versioning policy is `docs/architecture.md` §9) and stay connected to the framework through npm/pnpm: `pnpm add alambre@latest` / `npm install alambre@latest`.

Regenerate the standalone template repo from `apps/base-template` after template changes:

```bash
bash scripts/export-template.sh
```

The script checks the working tree, builds the library, seeds the remote with `git subtree split` on first run, and then overlays the standalone-specific files (registry `alambre` pin, `.gitignore`, fresh `pnpm-lock.yaml`, license) and pushes to the template repo.

## Tooling

- Package manager: pnpm (workspace scopes `packages/*`, `apps/*`).
- Library build: `react-native-builder-bob`.
- Lint: shared ESLint 9 flat config, duplicated per package (each package resolves its own plugin deps under pnpm's strict node_modules layout).
- Lint/typecheck/test run per package; the reference app (Colguetti) is Expo SDK 54 / React Native 0.81.
