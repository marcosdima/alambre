# Agents

This repository is worked on by a small team of specialized Antigravity
agents. The single source of truth for the agent system is `docs/guidelines/agents.md`;
these definition files are thin wiring.

## Roles

| Identifier | Definition | Responsibility |
| --- | --- | --- |
| `@lead` | `.agents/agents/lead/agent.md` | Orchestrator and sole author of production code; decomposition, implementation, synthesis. `mainAgent`. |
| `@reviewer` | `.agents/agents/reviewer/agent.md` | Architecture/API audits, investigation, regression risk, Extraction Audit. Read-only. |
| `@tester` | `.agents/agents/tester/agent.md` | Test authoring, edge cases, validation loops. Writes test files only. |
| `@ui-reviewer` | `.agents/agents/ui-reviewer/agent.md` | Static UI/a11y audit of JSX, styles and tokens. Read-only, source-only. |
| `@ui-verifier` | `.agents/agents/ui-verifier/agent.md` | Emulator verification, deterministic capture, Maestro flows. Read-only, device-only. |

## Conventions

- Project knowledge lives in `docs/` — do not duplicate it here (see `docs/index.md`).
- All agents follow the retrieval protocol in `.agents/skills/docs-retrieval/SKILL.md`.
- Full matrix, model routing, and emulator flow: `docs/guidelines/agents.md`.
- Dynamic 4-level routing and anti-drift guardrails: `docs/guidelines/agents.md` §5.
- UI verification flow & deterministic capture: `scripts/ui-capture.sh` (see `docs/guidelines/agents.md` §3).
- `@lead` is the primary agent; specialists are invoked via delegation.

## Validation

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from the
repository root (see `docs/guidelines/workflow.md` §1 for the progressive order).