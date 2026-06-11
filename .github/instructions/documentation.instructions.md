---
applyTo: '**/*.md'
---

# Documentation Instructions

- **Punctuation:** Use periods or commas to separate ideas. Do not use semicolons. Do not use em-dashes, en-dashes, or smart (curly) punctuation in any context. Strictly use hyphens (-), straight quotes ("), and plain apostrophes (').
- **Sentence Style:** Prefer simple, clear sentences. Use commas or periods rather than semicolons to join clauses.
- **Markdown Linting:** Follow `markdownlint` rules and repository markdown style. Run `npx markdownlint .` and address reported issues before committing.
- **Formatting:** Run `npm run format` (or `npx prettier --check .`) to check and fix formatting. Ensure files are formatted before committing.
- **Pre-Commit Checks:** Ensure `npm run format` and `npx markdownlint .` pass in local pre-commit and CI checks. Fix or autofix issues prior to pushing.
- **Examples:** Replace typographic quotes and dashes with plain characters. For lists and inline punctuation, prefer simple hyphens and straight quotes.

If any rule is ambiguous for a specific file, open a short issue to propose the exact phrasing or exception.
