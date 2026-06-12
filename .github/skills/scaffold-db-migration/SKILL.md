---
name: scaffold-db-migration
description: Scaffolds a timestamped Kysely database migration and its accompanying repository and type changes. Trigger on keywords migration, create table, modify table, alter column, drop table, database schema change.
metadata:
  internal: true
---

# Kysely DB Migration Scaffolding

## Required Inputs

Before starting, gather these explicit details. If missing, ask the user to clarify:

1. **Intent:** `create` | `modify` | `delete`. Ask for clarification and context if ambiguous.
2. **Target Table Name(s)**.
3. **Column Delta** Comprehensive list of names, types, nullability, defaults, or constraints.
4. **Migration Suffix:** A concise, descriptive 2-3 word lowercase phrase (e.g., `add_notes`, `rename_title`, `drop_legacy`). If this is not provided, suggest a few options based on the intent and changes described.
5. **Safety Confirmation:** For destructive changes, require the user to type a specific confirmation phrase to proceed.

## Step-by-Step Execution Loop

## Step 1: Pre-Execution Verification

- If intent is `delete` or a destructive `modify`, halt and demand the explicit safety confirmation phrase: `CONFIRM DROP <table_name>`. Do not proceed without it.

## Step 2: Migration Scaffolding

- Run the shell tool: `npm run migrate:make -- --name <suffix>`.
- Write ONLY the schema modifications within the `up` and `down` functions of the newly generated file using exact Kysely query builder syntax. No raw string queries.
- Prioritize using Kysely schema builder methods. Only use raw SQL for operations that Kysely does not support, and even then, prefer Kysely's `sql` tagged template for consistency.
- Reference previous schemas for general structure, but ensure the new migration is fully self-contained and reversible.
- Reference the Kysely documentation for any syntax or method questions
  - https://kysely-org.github.io/kysely-apidoc/index.html
  - https://kysely.dev/docs/migrations

## Step 3: Kysely Scaffold Gate

Run the following local test suites via the shell tool to validate the structural shift:

1. `npm run migrate:latest` (Apply to local dev DB)
2. `npm run migrate:down` (Ensure reversibility)
3. `npm run migrate:latest` (Apply to local dev DB again)
4. `npm run codegen` (Regenerate type maps)
5. `npm run typecheck` (Ensure compilation)
6. `npm run lint:fix` && `npm run format` (Clean up styles)
7. `npm run test:shuffle` (Verify zero down-stream unit breaks)

If any of these steps fail, halt and report the specific error. Do not proceed to repository scaffolding until all tests pass successfully.

## Step 4: Repository Co-Scaffolding

Analyze the schema change and immediately apply matching codebase changes:

- **`create`**: Scaffold a new CRUD service file under `src/repositories/<table>.ts` following existing project signatures, and export new schema types in `src/types/`.
- **`modify`**: Update matching properties across existing files in `src/repositories/` and structural interfaces in `src/types/`. Avoid breaking changes when possible.
- **`delete`**: Remove the corresponding `src/repositories/<table>.ts` file, clear local seed files utilizing it, and strip related imports.

## Hard Rules & Validation Checklist

- **Zero Type Drift:** Strictly forbid fallback `any` types across the new schema or repository signatures.
- **Rollback Parity:** Every single schema change must be fully reversible; `down` functions must accurately invert the `up` implementation.
- **Signatures:** New repository files must match the exact functional export conventions visible in adjacent `src/repositories/` files.
