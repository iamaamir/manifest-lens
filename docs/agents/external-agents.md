# External Agent Execution Policy

This project uses a coordinator-led workflow.

The coordinator must not directly implement product code, write test cases, or perform low-level coding tasks. The coordinator orchestrates, plans, delegates, reviews, and updates durable docs/memory.

## Current Zed / ACP Reality

Zed supports external ACP agents through `agent_servers` in settings. For example, an OpenCode server can be launched with:

```sh
opencode acp
```

However, from inside a running Zed agent thread, there does not currently appear to be a tool-callable mechanism for the parent agent to say:

```text
Spawn/use the configured external ACP agent named opencode for this subtask, wait for its result, and return that result to the parent agent.
```

So configured Zed ACP agents may be available to the user in Zed, but they are not currently available to this coordinator as a direct subtask tool.

## Immediate External Agent Workaround

When the coordinator is running in Zed, use OpenCode through the shell:

```sh
opencode run --pure "<task prompt>"
```

Do not hardcode an OpenCode model by default. Use the local OpenCode default unless the user requests a specific model/capacity for the task.

The user often uses **Big Pickle** for OpenCode, so the coordinator may offer it as an option for larger or riskier tasks. Only add it when requested or explicitly selected:

```sh
opencode run --pure --model big-pickle "<task prompt>"
```

Otherwise prefer:

```sh
opencode run --pure "<task prompt>"
```

This gives real external-agent execution, but it is not the same as using Zed's configured ACP agent thread.

Limitations of the workaround:

- no native Zed ACP session visibility
- no structured ACP continuation from the parent agent
- no Zed ACP cancellation/timeout UI for the delegated task
- no direct parent-agent result plumbing beyond stdout/files

## Prompt Envelope for Immediate Use

Use compact repo-native onboarding instead of pasting long instructions. Prefer prompts that point to:

```text
docs/agents/external-quickstart.md
docs/agents/templates/external-self-review.md
```

Use a strong prompt envelope:

```text
You are an external specialist agent for manifest-lens.
Read docs/agents/external-quickstart.md first.
Read-only unless explicitly authorized.
Read the referenced task brief/docs before acting.
Stay within the assigned scope.
Complete docs/agents/templates/external-self-review.md before returning.
Return:
1. Findings
2. Evidence
3. Suggested next actions
4. Validation run, or why none was run
5. Self-review checklist result
6. Whether durable memory/docs updates are proposed
```

For implementation tasks, add:

```text
You are authorized to edit only the files listed in the write scope.
Do not modify unrelated files.
Run the requested validation commands.
Complete the external self-review checklist.
Return a structured implementation report.
```

## Delegation Philosophy

Phase guides and task briefs should be explicit enough that either the user or an external implementation agent can pick them up without needing chat history.

Use external agents where they are strongest:

- low-effort, well-scoped coding tasks
- unit-test writing
- fixture expansion
- targeted fixes
- mechanical refactors with clear boundaries
- validation runs with structured reports

The coordinator preserves control by:

- creating clear task briefs
- assigning narrow write scopes
- requiring validation output
- sending implementation through code review/QA
- updating durable memory/docs only after synthesis
- committing only after quality gates pass

This keeps implementation throughput high while preserving architecture and product quality.

## Token, Capacity, and Quality Strategy

External agents launched through `opencode run --pure` are effectively fresh synchronous runs unless an explicit OpenCode session is continued. They do not preserve a parent-managed continuation session from Zed, so the coordinator should reduce repeated context loading by using durable repo artifacts.

If the current coordinator itself is running inside OpenCode, prefer OpenCode-native internal agents/subagents or task mechanisms instead of shelling out to `opencode run`. Avoid recursive OpenCode → shell OpenCode delegation unless explicitly needed.

Best practices:

- Use `docs/agents/external-quickstart.md` as the compact onboarding file.
- Put detailed scope, known traps, write scope, and acceptance criteria in task briefs.
- For narrow fix-up tasks, tell the external agent to read only the quickstart, the prompt/task brief, and the files being changed.
- Avoid asking external agents to reread the full HLD/PRD unless the task requires product or architecture reinterpretation.
- Require the self-review checklist before accepting a report.
- Prefer one external implementation agent at a time on a working tree unless write scopes are disjoint and isolated by branch/worktree.
- Use internal Zed sub-agents for parallel read-only Staff/Code/QA review after implementation.
- Match model capacity to task risk using OpenCode `--model`, `--agent`, and `--variant` when available.

The expected pattern is:

```text
small task brief + known traps
→ one external implementation/fix run
→ coordinator validation
→ parallel internal read-only review
→ one narrow external fix run only if needed
→ memory update and commit
```

### OpenCode model/capacity policy

Use the local OpenCode default model unless the user requests a specific model or capacity. Ask before adding a model flag for non-trivial work if the choice matters.

Suggested tiers:

| Task type | Suggested OpenCode capacity |
|---|---|
| tiny docs/mechanical cleanup | local OpenCode default, usually no model flag |
| normal implementation/test-writing | local OpenCode default, or ask whether to use Big Pickle |
| review-fix tasks after blockers | ask whether to use Big Pickle and/or a higher variant if supported |
| architecture-sensitive or complex debugging | ask whether to use Big Pickle, a high/max variant, or a configured deep-thinking OpenCode agent |

Examples, depending on local OpenCode configuration and user choice:

```sh
opencode run --pure "<normal implementation prompt>"
opencode run --pure --model big-pickle "<normal implementation prompt after user selects Big Pickle>"
opencode run --pure --model big-pickle --variant high "<review blocker fix prompt after user selects higher capacity>"
opencode run --pure --agent deep-thinker "<complex architecture/debugging prompt after user selects configured agent>"
```

Do not assume every provider/model supports every variant. If a requested variant fails, fall back to the local OpenCode default or ask the user how to proceed when model choice matters.

## Two-Layer Workflow

### Layer 1 — Immediate external agent

Use direct shell execution when the task is small or review-only:

```sh
opencode run --pure "<prompt envelope + task>"
```

The coordinator then reads stdout, synthesizes findings, and updates memory/docs if needed.

### Layer 2 — Formalized project workflow

For non-trivial work:

1. Coordinator creates a task brief in `docs/agents/tasks/active/`.
2. Coordinator runs OpenCode against that brief using `opencode run --pure`; add `--model`, `--agent`, or `--variant` only when the user selected a specific model/capacity or the task brief explicitly requires it.
3. External agent writes a report to `docs/agents/tasks/done/` or returns stdout.
4. Coordinator reviews/synthesizes.
5. Coordinator triggers code review/QA as needed.
6. Coordinator updates `docs/journey/memory.md`.
7. Coordinator commits if branch policy/user instruction allows.

This gives most of the value of external implementation agents with minimal infrastructure.

## Preferred External Implementation Agents

For implementation, test-writing, and low-level code modification tasks, prefer external coding agents such as `opencode`.

Expected use cases:

- low-effort implementation tasks with clear acceptance criteria
- implementing package code from a phase guide or task brief
- writing or updating unit tests
- applying targeted fixes
- running validation and reporting results
- producing structured implementation reports

## Coordinator Boundary

The coordinator may:

- write and update planning docs
- write and update memory docs
- create task briefs
- spawn or instruct specialist/external agents
- synthesize reports
- run read-only inspection commands
- run validation commands after implementation agents complete work
- commit changes when branch policy/user instruction allows

The coordinator must not:

- directly implement product code
- directly write tests
- directly perform low-level refactors
- use Lavish to create reports or UI artifacts
- bypass specialist/external agents for coding work just because it is faster

Exception:

- The user may explicitly authorize a targeted coordinator edit, but this should be rare and recorded in `docs/journey/memory.md` if it changes workflow expectations.

## External Agent Task Contract

External coding agents should usually work from phase guides and task briefs, not chat history.

Task briefs should include:

- role/persona
- active phase
- exact files/write scope
- in-scope/out-of-scope work
- package boundary rules
- known traps / common failure modes
- validation commands
- expected report format
- self-review checklist requirement
- proposed memory update requirements

Use:

```text
docs/agents/external-quickstart.md
docs/agents/templates/task-brief.md
docs/agents/templates/agent-report.md
docs/agents/templates/external-self-review.md
```

## Report Requirements

External implementation agents must return:

- summary
- files changed
- validation commands/results
- self-review checklist result
- risks/follow-ups
- proposed `docs/journey/memory.md` update

The coordinator then synthesizes, requests review/QA, updates memory, and commits if appropriate.

## Future ACP Follow-up

If Zed exposes a tool-callable parent-agent API for configured ACP agents later, update this policy to replace or supplement `opencode run --pure` with native ACP delegation.

Until then, do not claim native parent-agent-to-ACP delegation is available from inside this coordinator thread.
