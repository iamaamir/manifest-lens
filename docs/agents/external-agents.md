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

For now, use OpenCode through the shell:

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

Use a strong prompt envelope:

```text
You are an external specialist agent for mvviewer.
Read-only unless explicitly authorized.
Read the referenced docs before acting.
Stay within the assigned scope.
Return:
1. Findings
2. Evidence
3. Suggested next actions
4. Validation run, or why none was run
5. Whether durable memory/docs updates are proposed
```

For implementation tasks, add:

```text
You are authorized to edit only the files listed in the write scope.
Do not modify unrelated files.
Run the requested validation commands.
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
2. Coordinator runs OpenCode against that brief using `opencode run --pure`.
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
- validation commands
- expected report format
- proposed memory update requirements

Use:

```text
docs/agents/templates/task-brief.md
docs/agents/templates/agent-report.md
```

## Report Requirements

External implementation agents must return:

- summary
- files changed
- validation commands/results
- risks/follow-ups
- proposed `docs/journey/memory.md` update

The coordinator then synthesizes, requests review/QA, updates memory, and commits if appropriate.

## Future ACP Follow-up

If Zed exposes a tool-callable parent-agent API for configured ACP agents later, update this policy to replace or supplement `opencode run --pure` with native ACP delegation.

Until then, do not claim native parent-agent-to-ACP delegation is available from inside this coordinator thread.
