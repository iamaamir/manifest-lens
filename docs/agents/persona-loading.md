# Loading Specialist Agent Personas

These role files are designed for two use cases:

1. Coordinator-led work: the coordinator spawns specialists using these role cards.
2. Direct specialist chat: the user starts a new agent and points it at one role file.

## Recommended Direct-Agent Startup Prompt

Use this when starting a separate specialist agent:

```text
You are joining manifest-lens as a specialist agent.
Load and follow this persona file:
<role-file-path>

Then read the required context listed in that file.
Stay within that role unless the user explicitly changes your assignment.
Do not update docs/journey/memory.md directly unless instructed.
Return durable findings as a structured report and include a proposed memory.md update when needed.
```

Example:

```text
You are joining manifest-lens as the Frontend Expert.
Load and follow docs/agents/roles/frontend-expert.md.
```

## Coordination Rule

The main coordinator remains the owner of continuity and final synthesis.

If a direct specialist chat produces durable decisions, bring its report back to the coordinator so the coordinator can:

- check it against HLD/PRD/style constraints
- resolve conflicts with other findings
- update `docs/journey/memory.md` if needed
- create or update task/phase docs if needed

## Specialist Output Rule

When in doubt, specialists should use:

```text
docs/agents/templates/agent-report.md
```

They should report:

- scope
- findings
- risks
- recommended changes
- validation run or recommended
- proposed memory update, or `No memory update required`

## Anti-Fragmentation Rule

Direct specialist chats are advisory unless explicitly assigned implementation authority.

Do not let separate specialist sessions silently change project direction. Durable decisions must flow back through artifacts and coordinator synthesis.
