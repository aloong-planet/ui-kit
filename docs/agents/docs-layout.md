# Documentation layout

Where this repository's documents live, which of them can be relied on, and which cannot.

## No glossary and no ADRs

This repository keeps no glossary (`docs/CONTEXT.md`) and no ADR directory (`docs/adr/`), and does not use
`/domain-modeling`. A UI kit has no business domain to model, and the few terms that need pinning down —
the shadcn token names, theme (purple / blue / amber) versus mode (system / light / dark) — fit in the
specs. Terms and architectural decisions therefore live in the spec they belong to, each decision with its
reason and the alternative it rejected. Where a skill says to record a term in `CONTEXT.md` or a decision
in an ADR, record it in that spec instead. (Owner's choice, 2026-11-12.)

## No interface prototypes

Interface prototypes are not made under `docs/prototypes/`: a component's look is confirmed by the owner on
its Storybook stories, with the real component, and the component does not count as done before that;
screenshots attached to the delivery fix what was confirmed. The components start from shadcn/ui's source,
so restyling them is cheap, whereas an HTML prototype would imitate every component once and then be
redone on the real one. `/prototype` is still used for logic prototypes (state models). (Owner's choice,
2026-11-12.)

## Conclusions and process are two different things

**Conclusions** — answer "what is right now", and any skill may rely on them:

| Location | Question it answers | Maintained by |
|---|---|---|
| `docs/specs/<slug>.md` | The feature's current behaviour, the boundaries set, what is explicitly out of scope, the terms it uses and the decisions behind it | `/to-spec` |
| `docs/prototypes/` | Logic prototypes: design references for state models | `/prototype` |
| `docs/postmortems/` | The causal chain of an incident | `/implement` |
| `docs/ops/` | This project's runbooks (the actual values for signing, releasing and the like) | Defined per project |

**Process** — answers "how it was done at the time":

| Location | Contents |
|---|---|
| `docs/.workings/<slug>/` | Local tickets, the Requirements alignment record, the feature checklist, and the delivery note of each delivery |

**`docs/.workings/` stays out of the repository (the repository's `.gitignore` ignores the whole
directory); its contents are kept, not deleted, but no skill may treat them as a reliable source.** Which
checkout to write into when working in a worktree is set by the "施工记录存储" section of the global
instructions. Read it only to answer "why was this done that way at the time", never to infer the present
state. When it conflicts with a conclusion document, the conclusion document wins, **and the process
record need not be corrected** — it is meant to stay as it was at the time. It is a hidden directory: it
takes no part in publishing the documentation and is not matched by globs such as `docs/**/*.md`.

## Read these first when exploring

Before changing code or proposing a plan, read the specs in `docs/specs/` that cover the area being
changed, including the terms and decisions they record. When no spec covers it yet, carry on silently.

## Use the specs' words

Whenever an output mentions a concept a spec defines (issue titles, proposals, assumptions, test names),
**it must use the word that spec defines**, and must not drift to a synonym the spec says to avoid.

A concept you need that no spec defines is a signal: either you are inventing a way of speaking this
project does not use (reconsider), or a term is genuinely missing (add it to the spec it belongs to).

## Name any conflict with a recorded decision

If an output contradicts a decision recorded in a spec, **it must say so by name, never override it
silently**:

> _Contradicts the decision in `docs/specs/<slug>.md` to … — but worth reopening, because…_
