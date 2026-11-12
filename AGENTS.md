# ui-kit — project conventions

Cross-skill project facts are declared in `capabilities.toml` at the repository root.

## Invariants

- No `docs/CONTEXT.md` and no `docs/adr/`: terms and architectural decisions go into the specs under
  `docs/specs/` (see `docs/agents/docs-layout.md`).
- No interface prototypes under `docs/prototypes/`: a component's look is confirmed by the owner on its
  Storybook stories before the component counts as done; `/prototype` is for logic prototypes only (see
  `docs/agents/docs-layout.md`).
- A pull request that changes `AGENTS.md`, `CLAUDE.md` or anything under `docs/prototypes/` waits for the
  owner's approval before it merges, even when it changes no executable content (see `docs/ops/merging.md`).

## Agent skills

### Issue tracker

Tickets are GitHub Issues on `aloong-planet/ui-kit`. See `docs/agents/issue-tracker.md`.

### Documentation layout

No glossary and no ADRs; specs hold behaviour, terms and decisions. See `docs/agents/docs-layout.md`.
