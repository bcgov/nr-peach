---
name: scaffold-db-migration
description: Scaffolds a timestamped Kysely database migration and its accompanying repository and type changes. Trigger on keywords migration, create table, modify table, alter column, drop table, database schema change.
metadata:
  internal: true
---

# Kysely DB Migration Scaffolding

## Required Inputs

Before starting, gather these explicit details. If missing, ask the user to clarify:

1. **Intent:** `create` | `modify` | `delete`.
2. **Target Table Name(s)**.
3. **Column Delta:** Comprehensive list of names, types, nullability, defaults, or constraints.
4. **Execution Mode:** Generate content only, or execute `npm run migrate:make` directly via shell tool.

## Step-by-Step Execution Loop

## Step 1: Pre-Execution Verification

- If intent is `delete` or a destructive `modify`, halt and demand the explicit safety confirmation phrase: `CONFIRM DROP <table_name>`. Do not proceed without it.

## Step 2: Suffix Generation

- Generate a hyphenated, 2-to-3 word descriptive lowercase suffix (e.g., `add-notes`, `rename-title`, `drop-legacy`).

## Step 3: Migration Scaffolding

- If the user selected direct execution, run the shell tool: `npm run migrate:make -- --name <suffix>`.
- Write the schema modifications within the `up` and `down` functions using exact Kysely query builder syntax. No raw string queries.

## Step 4: Repository Co-Scaffolding

Analyze the schema change and immediately apply matching codebase changes:

- **`create`**: Scaffold a new CRUD service file under `src/repositories/<table>.ts` following existing project signatures, and export new schema types in `src/types/`.
- **`modify`**: Update matching properties across existing files in `src/repositories/` and structural interfaces in `src/types/`. Avoid breaking changes when possible.
- **`delete`**: Remove the corresponding `src/repositories/<table>.ts` file, clear local seed files utilizing it, and strip related imports.

## Step 5: Post-Scaffold Gate

Run the following local test suites via the shell tool to validate the structural shift:

1. `npm run migrate:latest` (Apply to local dev DB)
2. `npm run migrate:down` (Ensure reversibility)
3. `npm run migrate:latest` (Apply to local dev DB again)
4. `npm run codegen` (Regenerate type maps)
5. `npm run typecheck` (Ensure compilation)
6. `npm run lint:fix` && `npm run format` (Clean up styles)
7. `npm run test:shuffle` (Verify zero down-stream unit breaks)

## Hard Rules & Validation Checklist

- **Zero Type Drift:** Strictly forbid fallback `any` types across the new schema or repository signatures.
- **Rollback Parity:** Every single schema change must be fully reversible; `down` functions must accurately invert the `up` implementation.
- **Signatures:** New repository files must match the exact functional export conventions visible in adjacent `src/repositories/` files.
