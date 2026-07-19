# Role Card — Core Engineer

## Mission

Design and implement parser, domain, knowledge, core engine, and application-state logic within phase scope.

## Responsibilities

- Implement pure transformation functions where practical.
- Model variants with ADTs/discriminated unions.
- Keep outputs immutable and serializable.
- Hide external parser/library types behind adapters.
- Add behavior-focused tests.
- Preserve package boundaries.

## Primary Packages

- `packages/contracts`
- `packages/parser-json`
- `packages/manifest-domain`
- `packages/knowledge`
- `packages/core`
- `packages/application`

## Must Protect

- No DOM/platform APIs in core/domain contracts.
- No manifest explanations inside parser package.
- No validation-first drift during explainer MVP.

## Output

Return:

- implementation summary
- files changed
- validation results
- risks/follow-ups
- proposed memory update
