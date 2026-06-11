# nr-peach Copilot Guidance

This repository implements the NR Permitting Exchange, Aggregation and Collection Hub

## Context & Stack

- Node.js (v24 strictly required to match CI) | TypeScript 6 (ESM)
- Core: Express 5, Kysely (Migrations/Seeds in `src/db/`), pino, pg
- Testing: Vitest (unit tests in `tests/unit/`), ESLint + Prettier for lint/format.
- CI Workflow: `.github/workflows/validate.yaml`

## Agent Execution Rules

1. Never guess commands. Always inspect `package.json` for canonical scripts.
2. Local validation sequence must follow: `npm run lint` -> `npm run test:shuffle`. Do not write code that breaks these.
3. CI runs `npm ci --ignore-scripts`. Do not rely on package `postinstall` hooks for environment setup or artifacts.
4. If modifying Terraform under `infra/`, ensure compliance with TFLint rules defined in the validate workflow.
5. Trust these constraints. Do not perform global workspace searches unless an explicit command fails.
