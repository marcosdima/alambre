# Alambre Monorepo Documentation

Welcome to the Alambre monorepo documentation. The documentation mirrors the repository's packages, applications, and guidelines to ensure immediate predictability for developers and AI agents.

## 🗺️ Navigation Map

### Packages
- **[Core Framework (`packages/alambre`)](./packages/alambre/architecture.md)**: Monorepo architecture, dependency boundaries, headless primitives, and public contracts.
  - [Capabilities](./packages/alambre/capabilities.md): External stores (`createConfig`, `createLang`, `createLightDark`, `createCollection`, `createSensoryCues`).
  - [Behaviors](./packages/alambre/behaviors.md): Overlay hosts (`NavigatorProvider`, `confirm`, `toast`), API wrappers, and kinetic containers (`useCarousel`, `useDeck`).
  - [Primitives](./packages/alambre/primitives.md): Headless interaction primitives (`Button`, `Stepper`, `Slider`, `SegmentedControl`, `Input`, `Switch`, `AlambreIcons`).
  - [Storage Layer](./packages/alambre/storage.md): Persistence abstraction and JSON/collection adapters.
  - [Hooks & Utilities](./packages/alambre/hooks.md): Interaction hooks (`useHistoryState`, `useStopwatch`, `useStagger`, `useCollapsible`).
  - [Drag & Drop](./packages/alambre/dnd.md): Physics-driven 60fps drag-and-drop subsystem (`DndProvider`, `Draggable`, `Droppable`).
  - [Text Animations](./packages/alambre/text-animations.md): Headless kinetic typography (`CountUp`, `Typewriter`, `Scramble`, `Marquee`).
- **[Tactile UI Kit (`packages/ui`)](./packages/ui/overview.md)**: Tactile mobile design system (`@some-alambre/ui`).
  - [Overview & Decisions](./packages/ui/overview.md): Philosophy, headless-to-presentation layering, and platform traps.
  - [Design Tokens & Theme](./packages/ui/theme.md): Colors, surface hierarchy, light/dark switching, and font inheritance.
  - [Component Catalog](./packages/ui/components.md): Complete tactile component contracts (`AppButton`, `AppCard`, `AppDialog`, `AppTextInput`, `AppSwitch`, `AnimatedCascade`).
- **[Room Relay (`packages/room-relay`)](./packages/room-relay/architecture.md)**: Real-time ephemeral multi-device room synchronization over simulated transport, WebSockets, and PartyKit.

### Applications
- **[Base Template (`apps/base-template`)](./apps/base-template.md)**: Canonical starter application and app agent guidelines.
- **[Playground (`apps/playground`)](./apps/playground.md)**: Proving ground for behavioral testing and the candidate extraction workflow.

### Guidelines & Quality
- **[Agent Matrix & Routing](./guidelines/agents.md)**: Subagent roles, model tiers, dynamic routing, and anti-drift guardrails.
- **[Workflow & Quality](./guidelines/workflow.md)**: Progressive validation order, E2E invocations, and commit conventions.
- **[Testing Guidelines](./guidelines/testing.md)**: Maestro E2E test architecture and Vitest unit testing contracts.

### Proposals
- **[RFCs & Roadmap](./proposals/proposals.md)**: Pending framework changes and historical architectural proposals.
