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

### Guidelines & Workflows
- **[Agent Matrix & Routing](./guidelines/agents.md)**: Subagent definitions, routing tier rules, and prompts.
- **[Testing](./guidelines/testing.md)**: Maestro E2E testing architecture, atomic flows, and unit test rules (Vitest + React Native Testing Library) for playground and alambre.
- **[Workflow](./guidelines/workflow.md)**: Build commands, linting, publishing, and PR workflows.

### Logs
- **[Proposals](./logs/proposals.md)**: Pending framework changes and RFCs. Promotion of reusable code follows the Extraction Audit in [Agent Matrix & Routing](./guidelines/agents.md) §6.
