# XGen MRP patterns

Use this file when you need a quick repo-specific reminder without re-reading all docs.

## Reading order

1. `docs/README.md`
2. `docs/technical/README.md`
3. The matching role doc under `docs/roles/**`
4. Nearby code in the same feature area

## Structural rules

- Keep role-specific UI inside `src/app/<role>/**` and `src/components/module/<role>/**`.
- Keep business logic in `src/lib/actions/**` when the codebase already uses server actions for that concern.
- Keep shared validation in `src/lib/validation/**`.
- Prefer adjacent patterns over new abstractions.
- Treat code as source of truth if docs drift.

## Validation rules

- Start with the smallest validation set that covers the risk.
- Use the repo scripts before custom commands:
  - `npm run lint`
  - `npm run type-check`
  - `npm run test`
- Run React Doctor after React-facing edits:

```bash
npx -y react-doctor@latest . --verbose --diff
```

- Fix findings that are clearly within the changed scope or are safe, direct follow-ups from the same edit.
- Re-run the checks you used after making fixes.

## Documentation rule

- Keep a dated worklog in `docs/technical/ai-worklog/`.
- Reuse the same slug for the same task during one working session.
- Record changed files, validations, React Doctor status, and unresolved risks.
