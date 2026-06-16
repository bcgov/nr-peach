---
name: scaffold-db-migration
description: Scaffolds Kysely database migrations, matching repository changes, and type definitions. Trigger on keywords migration, create table, modify table, alter column, drop table, database schema change.
argument-hint: '<intent: create|modify|delete> <target_tables> <column_delta: name:type[:null|default|constraint]> [migration_suffix_snake_case]'
metadata:
  internal: true
---

# Kysely DB Migration Protocol

## 1. Parameter Collection

Extract or request these parameters before modifying files:

- **Intent:** `create` | `modify` | `delete`.
- **Target:** Table name(s).
- **Column Delta:** Column names, types, nullability, defaults, and constraints.
- **Suffix:** Concise lowercase snake_case phrase (e.g., `add_user_notes`).

## 2. Destructive Operations Gate

- **Halt Condition:** If intent is `delete` or a destructive `modify`, stop execution immediately.
- **Requirement:** Force the user to explicitly type the confirmation phrase: `CONFIRM DROP <table_name>`. Do not execute any tool or command without this exact string match.

## 3. Execution Pipeline

Execute these steps sequentially. Halt and report the error if any step fails:

### Step 1: Scaffold Migration

- Run command: `npm run migrate:make -- --name <suffix>`.
- Write `up` and `down` lifecycle changes using strict Kysely query builder syntax.
- No raw sql strings unless operations are explicitly unsupported by Kysely.
- For raw sql strings, use Kysely's `sql` tagged template format.

```typescript
// Reference Structure for the LLM
import { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  // Execute schema changes here
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Invert schema changes exactly here
}

### Step 2: Reversibility & Type Verification

Run local tooling to ensure schema integrity and catch downstream breaks:

1. `npm run migrate:list` (Verify current migration state).
2. `npm run migrate:up` (Apply schema changes to dev database).
3. `npm run migrate:down` (Verify rollback parity).
4. `npm run migrate:up` (Re-apply migration).
5. `npm run codegen` (Regenerate database type maps).
6. `npm run typecheck` (Verify compilation integrity across the workspace).

### Step 3: Repository Synchronization

Update the matching codebase layers based on the migration intent:

- **`create`**: Scaffold a new repository file under `src/repositories/<table>.ts` using existing file signatures, and export matching types under `src/types/`.
- **`modify`**: Update existing property signatures across `src/repositories/` and structural interfaces in `src/types/`. Avoid breaking changes.
- **`delete`**: Purge the matching `src/repositories/<table>.ts` file, remove downstream seed data, and strip related workspace imports.

## 4. Quality Fences

- **Zero Type Drift:** Never fallback to `any` for repository signatures or schema mappings.
- **Rollback Parity:** The `down` function must completely and cleanly invert the `up` function logic.

```
