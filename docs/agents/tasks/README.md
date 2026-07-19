# Agent Task Queue

This directory is an optional file-based task queue for AI team coordination.

Use it when a phase needs ticket-like coordination.

```text
tasks/
  active/   task briefs currently in progress
  blocked/  task briefs waiting on a decision or dependency
  done/     completed task briefs worth preserving
```

Task briefs should follow `docs/agents/templates/task-brief.md`.

Do not use this directory for noisy chat logs. Use it for durable task assignments only.
