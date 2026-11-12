# Issue tracker: GitHub

Tickets in this repository are GitHub Issues on `aloong-planet/ui-kit`.

**The conventions for every `gh` operation live in the `/github-ops` skill's issues.md** — command shapes,
when to pass `-R`, heredocs for multi-line bodies and query recipes are all there; **this file does not
repeat them**, so the two cannot drift.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

`gh issue view <n> --comments` (add `-R aloong-planet/ui-kit` when not inside a clone of this repository).

## Which label marks a ticket an agent may take

`ready-for-agent`.

Tickets cut by `/to-tickets` carry this label by default — by construction they can be picked up by an
unattended agent. If this repository's tracker already uses a different string (such as `agent-ready`),
change this line to the one in use; skills follow it and will not create a duplicate label.
