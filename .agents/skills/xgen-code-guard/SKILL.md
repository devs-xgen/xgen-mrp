---
name: xgen-code-guard
description: Preserve XGen MRP coding patterns while implementing or fixing code in this repository. Use when making code changes that should follow existing role-based structure, validate with the repo scripts, run React Doctor after React or TSX changes, and record the work inside the project's docs folder.
---

# Xgen Code Guard

Preserve the repo's current architecture before adding new code. Validate the change with the repo's normal checks, run React Doctor for React-facing edits, and keep a dated worklog in `docs/technical/ai-worklog/`.

## Workflow

### 1. Build context before editing

- Read `docs/README.md` first, then the matching role or technical docs for the area you are touching.
- Inspect nearby implementation files and copy existing patterns before inventing new abstractions.
- Check `git status --short` and work around unrelated changes instead of reverting them.
- Prefer the repo's source-of-truth folders:
  - `src/app/<role>/**` for routes
  - `src/components/module/<role>/**` for role UI
  - `src/lib/actions/**` for server actions
  - `src/lib/validation/**` for shared validation
- Load [references/xgen-mrp-patterns.md](./references/xgen-mrp-patterns.md) when you need a compact reminder of repo-specific conventions and validation expectations.

### 2. Preserve the existing coding style

- Keep changes small and local to the feature area unless the task explicitly requires cross-cutting refactors.
- Reuse established naming, component boundaries, Tailwind patterns, and data-flow style from adjacent files.
- Keep role boundaries intact. Do not move worker/admin/inspector/delivery/superadmin logic into shared space unless the codebase already does that for the same concern.
- Prefer the repo's existing dependencies and scripts over adding new packages or custom tooling.
- Treat docs as navigation and code as source of truth when they disagree.

### 3. Validate after each meaningful change

Run the smallest useful validation set first, then expand if the change surface grows.

- Common repo commands:
  - `npm run lint`
  - `npm run type-check`
  - `npm run test`
- Run React Doctor whenever the change touches React behavior, including:
  - `.tsx` files
  - hooks, state, effects, context, memoization, render paths
  - client/server component boundaries
  - component composition and prop flow
- Use the current project command:

```bash
npx -y react-doctor@latest . --verbose --diff
```

Fix findings that are clearly related to the changed area and safe to address. Re-run the same checks after fixes and record any residual issues in the worklog.

### 4. Document the work in `docs`

Create or update a dated entry inside `docs/technical/ai-worklog/` for the task you are working on.

Use the helper script:

```bash
python3 .agents/skills/xgen-code-guard/scripts/worklog.py \
  --repo-root "$PWD" \
  --slug "<short-task-name>" \
  --title "<human title>" \
  --objective "<what the task is trying to achieve>" \
  --status "in_progress" \
  --note "<timestamped update or summary>" \
  --files "<file-a>,<file-b>" \
  --validation "<command: result>" \
  --react-doctor "<status or short finding summary>"
```

Rules for the worklog:

- Reuse the same slug for the same task so the session stays in one file.
- Record the objective, touched files, validation results, React Doctor status, and next steps.
- Document what actually happened, not what was planned.
- If a check could not be run, say that explicitly.

## Quick Decision Guide

- Bug fix in a React screen or component:
  - Read the matching role docs and nearby files.
  - Implement the smallest fix.
  - Run `npm run lint`, then React Doctor, then any relevant tests.
  - Update the worklog.
- Refactor in shared TypeScript utilities:
  - Trace all callers first.
  - Run `npm run type-check` and targeted tests; run React Doctor too if the utilities affect component behavior.
  - Update the worklog.
- Docs and code disagree:
  - Follow the code.
  - Update docs only if the task requires it or the mismatch directly affects the work.

## Resources

### `references/xgen-mrp-patterns.md`

Read for a compact summary of repo-specific structure, commands, and judgment rules.

### `scripts/worklog.py`

Run to create or update `docs/technical/ai-worklog/<date>-<slug>.md` with a consistent structure.
