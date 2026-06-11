# nr-peach Copilot Guidance Instructions

## Purpose

- This repository implements the NR Permitting Exchange, Aggregation and Collection Hub — a Node.js + TypeScript backend (Express) with database access via Kysely and infrastructure Terraform under `infra/`.

## Project type and key tech

- Language: TypeScript (project uses `type": "module"` for ES modules)
- Runtime/build: Node.js (CI uses Node 24); TypeScript 6, Vitest for unit tests, ESLint + Prettier for lint/format.
- Frameworks/libs: Express 5, Kysely, pino, pg.
- Main entry: `server.ts` at repository root. Source lives under `src/`.

## Quick guidance (follow these before creating a PR)

- Always run dependency install in CI-style: `npm ci` (CI uses `npm ci --ignore-scripts`). Locally `npm install` is acceptable for general development.
- Always run the typecheck and lint before opening a PR: `npm run typecheck` and `npm run lint` (or `npm run lint:fix` then re-run `npm run typecheck`).
- Run unit tests: `npm run test` (uses `vitest`). Run with `CI=true npm run test` to reproduce CI environment behavior.
- Formatting: `npm run format` (Prettier). Run `npm run lint:fix` and `npm run format` before committing.

## Build / run / debug commands

- Install: `npm ci` (CI) or `npm install` (dev).
- Typecheck: `npm run typecheck` (runs `tsc --noEmit`).
- Run locally (development): `npm run dev` (script: `node --watch-path=./src server.ts`). If `node server.ts` fails locally, try `npx tsx server.ts` or run a compiled build with `npm run tsc` then `node ./dist/server.js` depending on local setup.
- Start production: `npm run start` (sets `NODE_ENV=production` then `node server.ts`).
- Debug: `npm run debug` (runs `node --inspect=0.0.0.0:9229 server.ts`).

## CI and validation specifics (what the repository's workflows run)

- Primary workflow: `.github/workflows/validate.yaml`.
  - Node setup: `actions/setup-node` with `node-version: 24` (CI uses Node 24).
  - Installs dependencies with `npm ci --ignore-scripts` and runs `npm run lint` and `npm run test` in CI.
  - There are additional infra checks (TFLint) for Terraform under `infra/` in the same workflow.
- Other workflows include `pull-request.yaml`, `push.yaml` and deployer templates under `.github/workflows/`.

## Project layout (highest priority places to look)

- Root files: package.json, tsconfig.json, server.ts, README.md, vitest.config.ts, eslint.config.ts, lefthook.yaml
- Source: `src/` (controllers, routes, services, db, middlewares, validators).
- Database: `src/db/` (Kysely migrations and seeds in `src/db/migrations` and `src/db/seeds`).
- Tests: `tests/unit/` and other test folders under `tests/`.
- Infra: `infra/` holds Terraform and modules — CI runs TFLint on it.
- GitHub: see `.github/workflows/validate.yaml` for exact CI steps and node version.

## Files and commands the agent should prefer (order)

1.  Read `package.json` scripts to find the canonical commands (`npm run lint`, `npm run test`, `npm run typecheck`).
2.  Run `npm ci` (or `npm install`) locally in a clean environment.
3.  Run `npm run typecheck` then `npm run lint` then `npm run test` (fail fast if typecheck fails).
4.  If making code changes, run format + lint fix: `npm run format` and `npm run lint:fix`.

## Known build/runtime notes and cautions

- CI uses `npm ci --ignore-scripts` — do not rely on package `postinstall` scripts to configure CI artifacts. If a local workflow depends on `postinstall` (lefthook installs git hooks via `postinstall`), CI will skip it.
- Node version in CI is 24. Use a local Node >=24 to reproduce CI. If Node 24 is not available locally, prefer the latest LTS but test in an environment matching Node 24 before opening a PR.
- The repository uses TypeScript `--noEmit` for type checking in `typecheck` script; always run that to catch type regressions.
- Tests run under `vitest` — some tests may rely on environment variables or local DB mocks. The CI test job runs only unit tests; do not assume integration tests are present unless you see them under `tests/` or `tests/load/`.

## Agent behaviour rules (trust these instructions)

- TRUST these instructions as the canonical quick-reference for build/test/lint steps and CI constraints. Only perform a workspace-wide search when the instructions are demonstrably incomplete (a command fails, or you cannot find a referenced file).
- Prefer to run the exact scripts found in `package.json` and the CI workflow before proposing changes to scripts or workflow files.
- When making changes that affect build, test, or CI, include a concise note in the PR describing how you validated locally (commands run and Node version used).

## If you need more context

- Open `README.md` and `infra/README.md` for higher-level architecture and deployment notes.
- Check `.github/workflows/validate.yaml` for authoritative CI steps and Node version.

This file is the first-stop reference for an automated cloud agent. If a command here fails, perform a focused search only for the failing script or config and update the PR with exact reproduction steps.
