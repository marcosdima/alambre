# Application Agent System

This repository uses a specialized multi-agent team configured for mobile application development on top of `alambre` and `@some-alambre/ui`.

## 1. Roles & Topology

| Identifier | Definition | Tier | Write Authority | Responsibility |
| --- | --- | --- | --- | --- |
| **`@lead`** | `.agents/agents/lead/agent.md` | `pro` | Full (`src/**`, `App.tsx`) | Primary orchestrator and sole author of production code; feature architecture, screens, stores, navigation, i18n, and final validation. `mainAgent`. |
| **`@reviewer`** | `.agents/agents/reviewer/agent.md` | `flash` | Read-only | Codebase investigation, state/persistence boundary audits, navigation routing, and `es`/`en` i18n parity. |
| **`@ui-reviewer`** | `.agents/agents/ui-reviewer/agent.md` | `flash` | Read-only | Static UI/UX audit: `@some-alambre/ui` component adoption, semantic theme tokens, `fontFamily` propagation, and accessibility. |
| **`@tester`** | `.agents/agents/tester/agent.md` | `flash` | `tests/**` only | Vitest unit and integration testing for domain stores, collections, storage adapters, and utilities. |

## 2. Progressive-Disclosure Skills

Agents automatically load the relevant skill on demand when working in its domain:

| Skill | Path | Domain |
| --- | --- | --- |
| **`alambre-ui`** | `.agents/skills/alambre-ui/SKILL.md` | `@some-alambre/ui` components, props, semantic theme tokens, `fontFamily` propagation, and kinetic text. |
| **`alambre-state-storage`** | `.agents/skills/alambre-state-storage/SKILL.md` | `createStore`, `createCollection`, `createConfig`, `createLang`, `createLightDark`, `createSensoryCues`, `useHistoryState`, `useStopwatch`, `createApi`, and Vitest storage mocks. |
| **`alambre-navigation-overlays`** | `.agents/skills/alambre-navigation-overlays/SKILL.md` | `NavigatorProvider`, `pages` & `subpages`, `useNavigator()`, `useConfirm()`, and `useToast()`. |
| **`alambre-kinetics-dnd`** | `.agents/skills/alambre-kinetics-dnd/SKILL.md` | `kinetics` presets, `usePressKinetics`, `useCollapsible`, `useWavefront`, `DndProvider` (`Draggable`, `Droppable`, `SortableRow`), `SpatialSpace`, and `AlambreIcons`. |
| **`alambre-room-relay`** | `.agents/skills/alambre-room-relay/SKILL.md` | `@some-alambre/room-relay` multiplayer rooms (`useRoomRelay`), authoritative turn engine (`useTurnEngine`), room codes, and seeded PRNG (`createSeededRng`). |

## 3. Core Application Conventions

1. **Design System First (`@some-alambre/ui`):**
   Use standard primitives (`AppTitle`, `AppText`, `AppButton`, `AppCard`, `AppBadge`, `AppChip`, `AppTextInput`, `AppSwitch`, `AppSlider`, `AppStepper`, `AppSelect`, `AppNumberPicker`, `AppSegmentedControl`, `AppAccordion`, `AppDialog`, `AppActionSheet`, `ToggleLightDark`, `ConfirmDialog`). Never reinvent buttons, cards, dialogs, or text with unstyled primitives.
2. **Theme, Typography & Provider Tree:**
   - Keep `<ThemeProvider theme={{ ...theme, fontFamily: config.fontFamily }}>` at the top of `App.tsx` above `NavigatorProvider`, `ConfirmProvider`, `ToastProvider`, and `Root`.
   - Consume colors and typography via `useTheme()` (`@some-alambre/ui`) or `useLightDark()` (`src/providers/theme.ts`). Never hardcode hex/RGB colors.
   - Use `AppText` / `AppTitle` so `theme.fontFamily` applies automatically; bind `fontFamily` explicitly on any custom `<Text>` or `<Animated.Text>`.
3. **Headless State & Persistence (`alambre`):**
   Keep domain state out of views using `createStore`, `createConfig`, `createCollection`, `useHistoryState`, and `useStopwatch`, wired to the shared `storage` adapter (`src/storage/index.ts`).
4. **Navigation & Localization:**
   - Register pages and subpages in `src/navigator/navigator.tsx` with localized `title: (lang) => ...` functions.
   - Define all user-facing copy in both `es` and `en` inside `src/providers/lang.tsx` (`useLang()`).
5. **Accessibility by Default:**
   Provide `accessibilityRole`, `accessibilityLabel`, and `accessibilityState`, and maintain a 44x44pt minimum touch target.

## 4. Validation Order

Run from the project root before completing any task:
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
