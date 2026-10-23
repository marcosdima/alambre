# Workflow & Quality

Build, validation, and commit conventions for the monorepo. Commands are
workspace scripts defined in the root `package.json`; dependency direction is
one-way (`apps/* -> packages/*`).

---

## 1. Validation

Run the progressive order below from the repository root. Each step fans out via
`pnpm -r` across every workspace package.

```bash
pnpm lint       # pnpm -r lint
pnpm typecheck  # pnpm -r typecheck
pnpm test       # pnpm -r test
pnpm build      # pnpm -r build
```

Progressive order rationale: `lint` and `typecheck` fail fast and cheaply, `test`
catches behavior, and `build` is the last gate because it is the slowest and most
likely to be superseded by an earlier failure.

Targeted scope when iterating on a single package:

```bash
pnpm --filter alambre build
```

Inside the monorepo, apps resolve `alambre` from its TypeScript source via
Metro. Rebuild the library after changing it: `pnpm --filter alambre build`.

## 2. End-to-end tests

Maestro flows are separate from unit tests and are not part of the routine order
above. Run them when the change touches navigation, gestures, or background
execution.

```bash
pnpm test:e2e              # scripts/e2e.sh — all flows
pnpm test:e2e smoke        # a single named flow
pnpm test:e2e -- --tag ui  # filter by tag
```

The runner prepares the device (disables OS transition animations, wakes the
device, bypasses Chrome first-run) and restores animation scales on exit. See
`docs/guidelines/testing.md` for flow architecture and
`docs/packages/alambre/dnd.md` for gesture-level contracts.

## 3. Commit format

Conventional Commits. Type is required; scope is optional.

```
<type>(<scope>): <summary>
```

Observed types in history: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`,
`perf`. Observed scopes: `alambre`, `ui`, `room-relay`, `playground`, `colguetti`,
`base-template`, `agents`.

```bash
feat(playground): add carousel laboratory view
refactor(alambre): decouple toast from React Context
docs: restructure documentation for LLM efficiency
```

Rules:

- One commit per coherent unit of work; do not mix refactors with feature work.
- The summary is written in the imperative mood and stays under ~72 characters.
- Do not commit generated output (`dist/`, `node_modules/`, `.agents/artifacts/`).
- Never commit secrets or signing credentials.

## 4. Pre-completion checklist

Before considering work done:

1. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all pass.
2. Behavior that is visual or runtime-relevant was verified directly, not
   inferred from a successful compile.
3. The final diff was reviewed for unintended files or dependency changes.
4. Documentation was updated if a public contract or architectural boundary
   moved. See `docs/packages/alambre/architecture.md` for what counts as a boundary.