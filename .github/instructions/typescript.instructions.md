---
applyTo: '**/*.ts'
---

# TypeScript Instructions

- **Runtime & Syntax:** Node.js v24 (strictly required) | TypeScript 6 (ESM).
- **Linter Rules:** Follow `recommendedTypeChecked` and `stylisticTypeChecked` ESLint rules.
- **Formatting Rules:** Strictly adhere to `.prettierrc`. Run `npm run format` and fix formatting before committing.
- **ESLint Enforcement:** Ensure code strictly follows `eslint.config.ts`. Run `npm run lint` and address or autofix issues (`npm run lint:fix`) before committing.
- **Type Safety:** Strictly forbid `any`. Use specific types or generics instead.
- **API Boundaries:** Explicit return types and strict typing are required on all functions, especially exported APIs.
- **Pre-Commit Gate:** Resolve all lint/type failures locally before committing via `npm run lint` and `npm run typecheck`.
