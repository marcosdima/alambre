# Discoveries

Register of reusable patterns observed while building the reference application (base-template / Colguetti) that could be rescued into `alambre`.

Each entry captures the pattern, where it appeared, and the candidate abstraction (if any). Nothing here is an adopted decision until it is validated and discussed in a design review.

## Structured collection persistence (discovered in I2)

**Pattern:** the app needs persisted collections of typed records (items, later alarms) with add/update/remove, plus plain JSON get/set/remove helpers.

**Where it appears:** `apps/base-template/src/storage/` (json-storage, collection), `apps/base-template/src/items/` (items-context, items-model).

**Current alambre surface is a poor fit:** `Storage` only supports string get/set (`packages/alambre/src/types/actions.ts`); there is no remove and no JSON handling. The config capability is flat string fields, not typed lists.

**Candidate for alambre:**

- Extend the `Storage` contract with an optional `remove` (`get(key)`, `set(key, value)`, `remove(key)`). Optional method keeps it additive; contract test in `tests/public-api.test.ts` must be updated.
- A content-driven capability factory `createCollectionProvider` — content = key + initial records, framework supplies load/CRUD/persist, mirroring the existing `createConfigProvider` shape.
- Validate against a second consumer (alarms in I3) before proposing.

**Not adopted:** app-level prototype, per project rules (prototype first, extract when demonstrated).

## Screen forms need navigation params (discovered in I2)

**Pattern:** edit screens need to know which record they are editing, but the navigator behavior does not carry params.

**Where it appears:** `apps/base-template/src/views/items/ItemForm.tsx` uses a `RouteIntent` context (`apps/base-template/src/navigator/RouteIntent.tsx`) to pass `itemId` from the list into the form subpage.

**Candidate for alambre:** the navigator `navigate(target, { subpage })` settings could accept arbitrary params carried by the page path, or expose an optional `params` on the navigation settings. The `RouteIntent` context is the app-level prototype.

**Not adopted:** app-level prototype.

## The app re-implements the capability pattern with React context (discovered in I2)

**Pattern:** `ItemsProvider` (`apps/base-template/src/items/items-context.tsx`) is essentially a content-driven provider: load on mount, typed actions, persist, context + hook. It reads like a manual rewrite of `createConfigProvider` with a richer (non-string) payload and async load.

**Candidate for alambre:** feeds into the `createCollectionProvider` idea above; also suggests a generic "async-loading provider" shape. If a `createCollectionProvider` lands in alambre, Colguetti's items and alarms both become its consumers.

**Not adopted:** app-level prototype.