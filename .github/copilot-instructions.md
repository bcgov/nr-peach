# nr-peach Copilot Instructions

NR Permitting Exchange, Aggregation and Collection Hub

## Context & Stack

- **Runtime:** Node.js v24 (strictly required to match CI).
- **Core:** Express 5 | Kysely | pino | pg.
- **Validation:** Vitest (`tests/unit/`) | ESLint | Prettier.
- **CI Pipeline:** Defined in `.github/workflows/validate.yaml`.

## Agent Execution Rules

1. **No Guessing:** Inspect `package.json` for canonical scripts before executing commands.
2. **Local Validation Lineup:** Run `npm run lint` followed by `npm run test:shuffle`.
3. **CI Constraints:** CI runs `npm ci --ignore-scripts`. Do not rely on package `postinstall` hooks.
4. **Git Flow:**
   - **Branches:** Use Conventional prefixes with ticket IDs (e.g., `feature/ABC-123-description`, `fix/`, `chore/`).
   - **Commits:** Follow Conventional Commits format (e.g., `feat(scope): summary`, `fix(scope): summary`).
5. **Specialized Sub-Rules:** Refer to `.github/instructions/copilot-typescript.md` for strict TypeScript typing and ESLint configurations.
6. **Infrastructure:** Changes under `infra/` must pass TFLint constraints defined in the validate workflow.
7. **Scope Limiting:** Avoid global workspace searches unless instructions are demonstrably incomplete or a command fails.

Keep guidance brief. Ask clarifying questions before modifying CI, lint, or infrastructure files if intent is ambiguous.
