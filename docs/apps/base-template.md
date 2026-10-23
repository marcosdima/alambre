# Base Template

`apps/base-template` is the canonical UI skin and starting point for new applications. It sits between the headless framework (`packages/alambre`) and concrete apps.

## Promotion destination

Code is promoted here through the Extraction Audit (`docs/guidelines/agents.md` §6) when it is **presentation or compound UI** that does not belong in `alambre` (it carries a visual skin, theme tokens, or app-level opinions) but would be welcome in any new app. Unlike `alambre`, no second consumer is required.

Requirements for promoted code:

* Consume semantic colors from the theme provider; never hardcode palette values.
* Honor accessibility contracts (roles, labels, single accessibility node for compound controls; see `docs/packages/ui/overview.md` §8).
* Build on `packages/alambre` behaviors and tokens; never leak app-specific code into the framework.
* Stay free of domain-specific logic (e.g. card-game or alarm domain code stays in its app).
