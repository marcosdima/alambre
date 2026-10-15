# Alambre Monorepo Documentation

Welcome to the Alambre repository. To maximize LLM context window efficiency, documentation is sharded by domain. 

## 🗺️ Navigation Map

### Framework & Architecture
- **[Architecture & Principles](./framework/architecture.md)**: Monorepo structure, dependency direction (`alambre` -> apps), and core headless concepts.
- **[UI Decisions (`ui-decisions.md`)](./framework/ui-decisions.md)**: Concrete UI direction and component decisions.

### Applications
- **[Base Template (`apps/base-template`)](./apps/base-template.md)**: The canonical UI skin. Use this to understand standard component contracts.
- **[Playground (`apps/playground`)](./apps/playground.md)**: Strict rules for the behavioral testing proving ground.
- **[Colguetti (`apps/colguetti`)](./apps/colguetti.md)**: Reference app logic, Android Doze mode rules, and background execution.

### Guidelines & Workflows
- **[Agent Matrix & Routing](./guidelines/agents.md)**: Subagent definitions, routing tier rules, and prompts.
- **[Testing](./guidelines/testing.md)**: Maestro E2E testing architecture and unit test rules.
- **[Workflow](./guidelines/workflow.md)**: Build commands, linting, publishing, and PR workflows.

### Logs
- **[Proposals](./logs/proposals.md)**: Pending framework changes and RFCs. Promotion of reusable code follows the Extraction Audit in [Agent Matrix & Routing](./guidelines/agents.md) §6.
