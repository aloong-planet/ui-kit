# Merging

## Merging without the owner's approval

`capabilities.toml` declares `docs-auto-merge`: the agent merges a pull request that changes no executable
content once its CI has passed, without waiting for the owner. Every other pull request waits for the
owner's approval. The conditions, and how the agent establishes each of them, are the delivery rules of
the `implement` skill and are not repeated here.

That reach includes the project's instruction files (`AGENTS.md`, `CLAUDE.md`), every file under `docs/`
(prototypes with their scripts and styles included), and a change of comments alone in a JavaScript,
TypeScript or Python file. Two kinds of file inside it still wait for approval, because the owner asks to
see a pull request that changes either before it merges (the invariant in `AGENTS.md`):

- `AGENTS.md` and `CLAUDE.md`: every session loads them, so a change binds all the work that follows.
- Anything under `docs/prototypes/`, its scripts and styles included.

A pull request that changes one of those files together with other documents waits as a whole.

The owner chose this on 2026-11-12. Its costs:

- The owner sees such a change only after it is in `main`.
- A comment-only change to source merges without approval, although tools and agents read comments.

To end it, set `enabled = false` under `[docs-auto-merge]`.
