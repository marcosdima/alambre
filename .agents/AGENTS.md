# Agents

This repository is worked on by a small team of specialized Antigravity
agents. The single source of truth for the agent system is `docs/agents.md`;
these definition files are thin wiring.

## Roles

| Identifier | Definition | Responsibility |
| --- | --- | --- |
| `@lead` | `.agents/agents/lead/agent.md` | Orchestrator, decomposition, synthesis. `mainAgent`. |
| `@ui` | `.agents/agents/ui/agent.md` | Component contracts, UX, a11y, emulator verification. |
| `@tester` | `.agents/agents/tester/agent.md` | Test authoring, edge cases, validation loops. |
| `@integrity` | `.agents/agents/integrity/agent.md` | Strict spec/doc audits, drift detection, API consistency. |
| `@scribe` | `.agents/agents/scribe/agent.md` | Discoveries, debt, trade-offs, changelogs. |

## Conventions

- Project knowledge lives in `docs/` — do not duplicate it here (see `docs/project.md` §8).
- All agents follow the retrieval protocol in `.agents/skills/docs-retrieval/SKILL.md`.
- Full matrix, model routing, and emulator flow: `docs/agents.md`.
- `@lead` is the primary agent; specialists are invoked via delegation.

## Validation

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from the
repository root (see `docs/project.md` §7 for the progressive order).