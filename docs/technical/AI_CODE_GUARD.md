# AI Code Guard Workflow

This repo includes a workspace skill at `.agents/skills/xgen-code-guard/` for code changes that should preserve existing project patterns, validate the result, run React Doctor for React-facing edits, and document the work in `docs`.

## What the workflow expects

- Read the matching docs and nearby implementation before editing.
- Preserve the existing role-based structure and local code patterns.
- Run the normal repo checks that fit the change:
  - `npm run lint`
  - `npm run type-check`
  - `npm run test`
- Run React Doctor after React or TSX changes:

```bash
npx -y react-doctor@latest . --verbose --diff
```

- Record the work in `docs/technical/ai-worklog/`.

## Worklog location

The helper script creates dated entries here:

```text
docs/technical/ai-worklog/YYYY-MM-DD-<slug>.md
```

Example:

```bash
python3 .agents/skills/xgen-code-guard/scripts/worklog.py \
  --repo-root "$PWD" \
  --slug "delivery-task-fix" \
  --title "Delivery task fix" \
  --objective "Repair broken delivery task details view" \
  --status "in_progress" \
  --note "Confirmed the broken state and traced the affected component path." \
  --files "src/app/delivery/(protected)/tasks/page.tsx,src/components/module/delivery/TaskList.tsx" \
  --validation "npm run lint: passed" \
  --react-doctor "No React edits yet, not run."
```

## Worklog contents

Each entry captures:

- objective and current status
- changed files
- validation results
- React Doctor status or findings
- progress notes and open questions
