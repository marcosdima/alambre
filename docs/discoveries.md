# Discoveries

Register of reusable patterns observed while building the reference application Colguetti (`apps/colguetti`) that could be rescued into `alambre`.

Each entry captures the pattern, where it appeared, and the candidate abstraction (if any). Nothing here is an adopted decision until it is validated and discussed in a design review.

## Structured collection persistence (discovered in I2)

**Pattern:** the app needs persisted collections of typed records (items, later alarms) with add/update/remove, plus plain JSON get/set/remove helpers.

**Where it appears:** `apps/colguetti/src/storage/` (json-storage, collection), `apps/colguetti/src/items/` (items-context, items-model).

**Current alambre surface is a poor fit:** `Storage` only supports string get/set (`packages/alambre/src/types/actions.ts`); there is no remove and no JSON handling. The config capability is flat string fields, not typed lists.

**Candidate for alambre:**

- Extend the `Storage` contract with an optional `remove` (`get(key)`, `set(key, value)`, `remove(key)`). Optional method keeps it additive; contract test in `tests/public-api.test.ts` must be updated.
- A content-driven capability factory `createCollectionProvider` — content = key + initial records, framework supplies load/CRUD/persist, mirroring the existing `createConfigProvider` shape.
- Validate against a second consumer (alarms in I3) before proposing.

**Status (I6): ADOPTED.** `Storage.remove` (optional) and `createCollectionProvider` ship with `alambre` (see `packages/alambre/CHANGELOG.md`, `docs/architecture.md` §8, and the Q3 decision log). Colguetti's items and alarms are the validating consumers.

## Screen forms need navigation params (discovered in I2)

**Pattern:** edit screens need to know which record they are editing, but the navigator behavior does not carry params.

**Where it appears:** `apps/colguetti/src/views/items/ItemForm.tsx` uses a `RouteIntent` context (`apps/colguetti/src/navigator/RouteIntent.tsx`) to pass `itemId` from the list into the form subpage.

**Candidate for alambre:** the navigator `navigate(target, { subpage })` settings could accept arbitrary params carried by the page path, or expose an optional `params` on the navigation settings. The `RouteIntent` context is the app-level prototype.

**Status (I6): NOT EXTRACTED.** Navigational params keep their app-level prototype (`RouteIntent`) until a second consumer demonstrates reuse. Same for the shared `createId` util (trivial, app-owned).

## The app re-implements the capability pattern with React context (discovered in I2)

**Pattern:** `ItemsProvider` (`apps/colguetti/src/items/items-context.tsx`) is essentially a content-driven provider: load on mount, typed actions, persist, context + hook. It reads like a manual rewrite of `createConfigProvider` with a richer (non-string) payload and async load.

**Candidate for alambre:** feeds into the `createCollectionProvider` idea above; also suggests a generic "async-loading provider" shape. If a `createCollectionProvider` lands in alambre, Colguetti's items and alarms both become its consumers.

**Status (I6): ADOPTED — superseded by `createCollectionProvider`.** `ItemsProvider` and `AlarmsProvider` are thin adapters now wrapping the shipped capability (see the first entry).

## Local-notification plan differs structurally from framework value (I4)

**Pattern:** recurring alarms must produce one repeating notification per selected weekday, with a persisted scheduling plan that is diffed against storage on every change (`ambos keys: schedule plan + reminders`).

**Where it appears:** `apps/colguetti/src/notifications/` (schedule, sync, NotificationsWatcher) and `apps/colguetti/src/checklist/checklist-model.ts` (pending detection, resend cadence).

**Assessment:** the scheduling/diff logic is lean and reusable, but it sits inside the `expo-notifications` ecosystem the app owns (ecosystem-first). The `Storage` contract (`remove`) + `createCollectionProvider` candidates remain the framework takeaways. Not planned for extraction without a second consumer.

## Delight kept in the app (I4-I5)

**Pattern:** checkbox strikes through item names; confirmed routine flashes a drawn tick (`AlambreIcons.Tick` + `iconAnimation`) before navigating; reminders re-alert only while within the resend window so the app never spams.

**Where it appears:** `apps/colguetti/src/views/home/Home.tsx`.

**Assessment:** presentation and identity stay in the app per §2/§6. No alambre surface change needed.