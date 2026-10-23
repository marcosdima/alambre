# Alambre Monorepo Documentation

Welcome to the Alambre repository. To maximize LLM context window efficiency, documentation is sharded by domain. 

## 🗺️ Navigation Map

### Packages
- **[Framework Core (`packages/alambre`)](./framework/architecture.md)**: Monorepo structure, dependency direction, headless architecture, and public contracts.
- **[UI Kit (`packages/ui`)](./framework/ui-decisions.md)**: Tactile mobile design system, theme tokens, and component contracts.
- **[Room Relay (`packages/room-relay`)](./reference/room-relay.md)**: Lightweight ephemeral multi-device room synchronization over WebSockets and in-memory simulated transport.

### Applications
- **[Base Template (`apps/base-template`)](./apps/base-template.md)**: The canonical starter application and app agent guidelines.
- **[Playground (`apps/playground`)](./apps/playground.md)**: Strict rules for the behavioral testing proving ground.
- **[Cross-App Logic](./apps/cross-logic.md)**: Guidelines for domain models and shared logic across applications.

### Reference & API
- **[Functional Reference Catalog](./reference/index.md)**: Complete API index for alambre capabilities, behaviors, hooks, storage, and components.
  - **[Capabilities](./reference/capabilities.md)**: Headless stores (`createConfig`, `createLang`, `createLightDark`, `createCollection`).
  - **[Behaviors](./reference/behaviors.md)**: Navigation, overlays (`confirm`, `toast`), kinetic carousels, and pickers.
  - **[Storage](./reference/storage.md)**: Persistence contracts and JSON/collection adapters.
  - **[Hooks & Utilities](./reference/hooks.md)**: Headless interaction and motion drivers (`useHistoryState`, `useStopwatch`, `useCollapsible`).
  - **[Drag & Drop](./reference/dnd.md)**: Tactile kinetic drag-and-drop contracts.
  - **[Text Animations](./reference/text-animations.md)**: Staggered, ticker, and kinetic typography.
  - **[UI Components](./reference/components.md)**: Tactile mobile UI primitives and design tokens.

### Guidelines & Workflows
- **[Agent Matrix & Routing](./guidelines/agents.md)**: Subagent definitions, routing tier rules, and prompts.
- **[Testing](./guidelines/testing.md)**: Maestro E2E testing architecture and unit test rules.
- **[Workflow](./guidelines/workflow.md)**: Build commands, linting, publishing, and PR workflows.

### Logs
- **[Proposals](./logs/proposals.md)**: Pending framework changes and RFCs. Promotion of reusable code follows the Extraction Audit in [Agent Matrix & Routing](./guidelines/agents.md) §6.
