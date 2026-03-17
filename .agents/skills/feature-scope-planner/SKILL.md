---
name: feature-scope-planner
description: Plan and structure new features for XGen MRP before implementation. Use when Codex needs to scope, analyze, or PM-review a feature request, produce requirements or acceptance criteria, write a feature spec or roadmap-style breakdown, compare implementation approaches, or turn a rough idea into a decision-complete plan grounded in this repo's code and docs.
---

# Feature Scope Planner

Produce a repo-aware feature plan that reads like it came from a strong senior project manager. Inspect the codebase and docs first, ask only the product questions that cannot be discovered locally, and return a decision-complete plan in chat before any implementation starts.

## Workflow

### 1. Ground the request in repo truth

- Read `docs/README.md` first to choose the right documentation entrypoint.
- Read `docs/technical/README.md` for shared architecture and source-of-truth folders.
- Read the matching role doc in `docs/roles/<role>/README.md` when the feature is portal-specific.
- Read `docs/plan-spec/README.md` when the request affects planned or recently shipped work.
- Inspect nearby code paths in:
  - `src/app/**`
  - `src/components/module/**`
  - `src/lib/actions/**`
  - `src/lib/validation/**`
  - `prisma/schema.prisma`
- Treat docs as navigation and code as source of truth when they disagree.

### 2. Define the current state before proposing change

- Identify what already exists, what is missing, and what related behavior may be affected.
- Call out existing routes, modules, actions, schema models, validations, and docs that shape the feature.
- Prefer concrete repo facts over generic product language.
- Avoid proposing abstractions or flows that do not match the current codebase structure.

### 3. Clarify only the non-discoverable decisions

- Ask focused follow-up questions only when the answer materially changes scope, ownership, workflow, permissions, rollout, or UX behavior.
- Prefer targeted tradeoff questions over broad brainstorming.
- If a safe default is reasonable, state the assumption and continue.
- Avoid asking questions that can be answered by reading the repo.

### 4. Plan like a senior PM, not an implementer

- Produce a planning-first response, not code.
- Make the plan decision-complete enough that another engineer or agent can implement without inventing product rules.
- Prefer behavior-level planning over file-by-file to-do lists unless file specificity prevents ambiguity.
- Keep the plan grounded in current repo patterns, role boundaries, and existing workflows.

## Output Contract

Return the plan in chat first. Use short sections and direct language. Include these sections unless the request is too small to justify one of them:

1. `Feature Summary`
2. `Problem / Why This Matters`
3. `Current State In Repo`
4. `Target Outcome`
5. `In Scope`
6. `Out Of Scope`
7. `Risks / Open Questions`
8. `Phased Implementation Plan`
9. `Acceptance Criteria`
10. `Related Code Areas`
11. `Assumptions And Defaults`

## Planning Rules

- Prefer the house style already used in `docs/plan-spec/`.
- Keep output in chat by default.
- Recommend converting the plan into a `docs/plan-spec/active/*.md` file only when the request is implementation-ready, cross-cutting, risky, or likely to be tracked across sessions.
- Distinguish clearly between current behavior, proposed behavior, and unresolved decisions.
- Include dependencies, permissions, data risks, and cross-role effects when relevant.
- For database-affecting features, explicitly protect existing data and avoid destructive assumptions.
- When there are multiple viable approaches, recommend one and explain why briefly.

## Repo-Specific Reminders

- Respect role-based separation across admin, worker, inspector, delivery, and superadmin areas.
- Prefer the repo's existing route, module, server-action, and validation patterns over inventing new architecture.
- Use `docs/plan-spec/README.md` as the planning template reference, not as a requirement to always create a file.
- Treat `src/data/changelog.json` as a shipping concern, not a planning-only requirement.

## Example Triggers

- "Plan a new admin feature before we build it."
- "Write a structured spec and acceptance criteria for this portal workflow."
- "Analyze this feature request and tell me the best way to structure it in the system."
- "Act like a senior PM and break this feature into phases, risks, and scope."
