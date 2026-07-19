# External Agent Execution Policy

This project uses a coordinator-led workflow.

The coordinator must not directly implement product code, write test cases, or perform low-level coding tasks. The coordinator orchestrates, plans, delegates, reviews, and updates durable docs/memory.

## Preferred External Implementation Agents

For implementation, test-writing, and low-level code modification tasks, prefer external coding agents such as `opencode` once they are configured for this repository.

Expected use cases:

- implementing package code
- writing or updating tests
- applying targeted fixes
- running validation and reporting results
- producing structured implementation reports

## Agent Client Protocol / ACP

ACP is the preferred direction for external agent spawning and coordination if available in the environment.

Current status:

- ACP integration is not yet configured in this repository.
- ACP documentation was requested but not verified in this session because network fetch permission was denied.
- Do not claim ACP support is available until it is explicitly verified and documented.

Before using ACP, document:

- installed client/CLI
- how to list available external agents
- how to spawn an external implementation agent
- how to pass task briefs
- how to collect reports/results
- how write scopes are enforced
- how validation output is returned
- how coordinator resumes after external work

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

External coding agents should receive task briefs that include:

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
