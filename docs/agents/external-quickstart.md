# External Agent Quickstart

This is the compact onboarding file for external implementation agents such as OpenCode.

Read this first, then read only the task brief and the smallest set of referenced docs/files needed for your scope.

## Operating Model

- The project is `manifest-lens`, a local-first Web Extension Manifest Explainer.
- North star: **Hover your manifest. Understand every field.**
- The coordinator owns architecture continuity, synthesis, memory updates, and commits.
- You own only the assigned implementation/test/fix scope.
- Do not rely on chat history. Durable truth is in repo docs.
- Do not assume a specific OpenCode model. Use the local OpenCode default unless the coordinator/task explicitly selects a model or capacity.

## Hard Rules

- Stay inside the assigned write scope.
- Do not edit `docs/journey/memory.md` unless explicitly assigned.
- Do not modify unrelated files.
- Do not use `as never` to force type compatibility.
- Do not add UI, diagnostics, fixes, health scores, remote analysis, AI-generated explanations, workers, hosts, or platform integrations unless the active task explicitly asks for them.
- Do not leak external library types across package boundaries.
- Keep public snapshots plain, readonly, immutable, and serializable.
- Follow package dependency direction from `AGENTS.md` and `docs/architecture/coding-style.md`.

## Implementation Style

Prefer:

- pure transformations in core packages
- discriminated unions / ADTs for meaningful variants
- named intermediate values for debugging
- small facades at package boundaries
- boring design patterns only where they reduce complexity
- behavior-focused tests

Avoid:

- clever FP / point-free pipelines
- service-class sprawl
- singletons/event buses
- broad generic frameworks
- advanced DSA unless justified

## Token-Saving Read Strategy

For broad phase work, read:

1. this file
2. `docs/journey/memory.md`
3. `AGENTS.md`
4. `docs/architecture/coding-style.md`
5. the active `docs/journey/phaseN.md`
6. the assigned task brief

For narrow fix-up work, read only:

1. this file
2. the active task brief or coordinator prompt
3. the files you are asked to change
4. any specific docs named by the coordinator

Do not reread the entire HLD/PRD unless the task requires product or architecture reinterpretation.

## Model / Capacity Note

Use the local OpenCode default model unless the coordinator/task explicitly selects a model or capacity.

The user often uses Big Pickle, so the coordinator may offer it for larger tasks, review-blocker fixes, or architecture-sensitive work. Do not add `--model big-pickle` unless the user selected it or the task brief explicitly requires it.

Use higher/deeper variants or a deep-thinking configured agent only when selected for architecture-sensitive changes, hard bugs, or review-blocker fixes.

## Before Returning

Run the requested validation commands. If validation cannot be run, say why.

Complete the self-review checklist from:

```text
docs/agents/templates/external-self-review.md
```

Return the standard report shape from:

```text
docs/agents/templates/agent-report.md
```
