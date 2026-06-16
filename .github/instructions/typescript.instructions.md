---
applyTo: '**/*.ts'
---

# TypeScript Instructions

Write minimal, highly intentional TypeScript. Let the type system and local tooling do the heavy lifting.

## Runtime & Engine

- **Target:** Node.js v24 (Strict) | TypeScript 6 (ESM).

## Trust Boundaries & Type Safety

- **Zero Drift:** Strictly forbid the use of `any`. Use precise types or generics instead.
- **Linter Rules:** Follow `recommendedTypeChecked` and `stylisticTypeChecked` ESLint rules.
- **API Gates:** Explicit return types are required on all exported functions and API boundaries.

## Verification Pipeline

Execute local checks sequentially and resolve all failures before committing code:

1. `npm run lint:fix` && `npm run format` (Enforce styles via `eslint.config.ts` and `.prettierrc`).
2. `npm run typecheck` (Verify compilation integrity).
