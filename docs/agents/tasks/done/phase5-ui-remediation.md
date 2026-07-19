# Task Brief — Phase 5 UI Remediation

## Context

Phase 5 behavior was completed and validated, but the user rejected the resulting UI quality.

User feedback:

- UI looks horrible and too basic.
- The textarea/app shell appears unstyled and awkward.
- Source highlighting appears buggy, with dotted outlines/boxes scattered through source punctuation and whitespace.
- External agents should be set aside for frontend/UI work.
- Use an internal Frontend Engineer specialist for this remediation.

North star remains:

> Hover your manifest. Understand every field.

## Role

Internal Frontend Engineer specialist.

Do not use OpenCode/external agents for this task.

If the runtime supports model choice, user preference is `gpt-5.4-mini` for this frontend remediation. If the tool does not expose model selection, proceed with the available internal frontend specialist and note that limitation.

## Must Read

1. `docs/journey/memory.md`
2. `docs/PRD.md`
3. `docs/journey/phase5.md`
4. `docs/reviews/phase5-completion-report.md`
5. `docs/architecture/coding-style.md`
6. `packages/ui-components/src/index.ts`
7. `packages/host-web/src/index.ts`
8. `apps/web/index.html`
9. `apps/web/src/main.ts`

## Product Scope

This is a visual/UX remediation pass only.

Keep existing Phase 5 product behavior:

- paste Analyze flow;
- file picker;
- paste/drop handling;
- local analysis only;
- preserved source;
- explanation panel;
- hover preview;
- click/tap pin;
- keyboard navigation;
- unknown fallback;
- partial-invalid calm status;
- no-network privacy behavior.

Do not add diagnostics, fixes, health scores, reports, audits, compatibility matrices, AI explanations, workers, non-web hosts, or backend behavior.

## Visual Direction

Design register: product UI, design serves understanding.

Scene sentence:

> A developer opens this local tool beside their editor during code review and wants a calm, precise, readable manifest map, not a flashy marketing page.

Design target:

- polished local developer tool;
- calm but crafted;
- source-first and explanation-first;
- confident spacing and hierarchy;
- not raw browser-default controls;
- not generic SaaS cards everywhere;
- no glassmorphism, no gradient text, no side-stripe accent cards.

Suggested style:

- restrained light theme with tinted neutrals using OKLCH colors;
- one blue/indigo accent used sparingly;
- app shell max width with sensible page padding;
- compact header with product promise and privacy note;
- proper loading/input panel with textarea, buttons, file picker affordance, status;
- inspector shell with rounded border, subtle background, strong source/explanation separation;
- code pane monospace with readable line height and no distracting dotted outlines around punctuation;
- active/pinned/hovered highlights should feel like source annotations, not broken focus rings;
- explanation pane should have readable typography and clear breadcrumb/title/summary/detail hierarchy.

## Known UI Bug / Risk

The current source rendering splits semantic ranges into many fragments. Existing accessibility fixes added unique IDs and representative IDs, but the visual layer currently makes too many fragments look individually outlined/focusable.

Fix the visual bug without breaking behavior:

- Do not show dotted outlines around every source fragment by default.
- Only show visible focus for the source region and/or the active semantic group.
- Hover/active/pinned states should visually connect to the semantic node without overwhelming punctuation/whitespace.
- Keep DOM IDs unique and `aria-activedescendant` valid.
- Keep source DOM stable after snapshot load.
- Never use raw source `innerHTML`.

## Accessibility / Modern Web Guidance

- Native controls over fake controls.
- Visible labels or accessible names for controls.
- No positive `tabindex`.
- Keyboard source navigation remains reachable.
- Focus styles must be visible but not noisy.
- Do not overuse landmarks/regions.
- Avoid unnecessary modals.
- Preserve source text and line wrapping/scrolling readability.

## Allowed Write Scope

- `apps/web/index.html`
- `apps/web/src/**`
- `packages/ui-components/src/**`
- `packages/host-web/src/**` only if needed for app-shell affordance/status wiring
- tests in changed packages
- package metadata only if absolutely required

Do not edit:

- parser/domain/core behavior;
- contracts unless absolutely necessary;
- `docs/journey/memory.md` directly unless coordinator asks;
- external-agent docs/templates.

## Acceptance Criteria

- [ ] UI no longer looks like raw browser defaults.
- [ ] Paste/file/status controls are visually clear and usable.
- [ ] Source/explanation split view is polished and readable.
- [ ] Source highlighting no longer shows noisy dotted boxes around punctuation/whitespace by default.
- [ ] Hover, pin, keyboard focus, and active states remain understandable.
- [ ] Keyboard navigation still works through a reachable focus target.
- [ ] Existing Phase 5 behavior and tests remain intact.
- [ ] No product scope creep.
- [ ] No raw source `innerHTML`.
- [ ] Validation passes.

## Validation

Run:

```sh
npm run typecheck
npm run test
npm run build
npm run build --workspace=@mvviewer/web
git diff --check
```

Also run static checks:

```sh
grep -R "as never\|as any" packages apps/web/src || true
grep -R "innerHTML\|outerHTML\|insertAdjacentHTML" packages/ui-components/src/index.ts packages/host-web/src/index.ts apps/web/src apps/web/index.html || true
grep -R "diagnostic\|fix\|health\|score\|report\|audit\|AI-generated\|remote" packages/ui-components/src packages/host-web/src apps/web/src apps/web/index.html || true
```

## Report Back

Return:

- design changes made;
- files changed;
- validation results;
- screenshots/manual notes if possible;
- risks/follow-ups;
- proposed `docs/journey/memory.md` update.
