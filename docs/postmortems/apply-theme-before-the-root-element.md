# The apply function threw in an Electron preload script

2026-11-13. Found by the independent review of the theming runtime, before it merged; no release carried it.

## What happened

theming::REQ-007/AC-01 names two places where the apply function runs before the first render: an Electron preload
script, and a script in a page's `<head>`. The function read `document.documentElement` and wrote to it at once. In a
preload script the document has no root element yet, so the call threw a `TypeError`, nothing was written, and the
first frame showed purple light. The same happens in any script that runs as the document is created, such as a
Chromium init script.

## Root cause

The function took the root element for granted. A `<head>` script always finds it. A preload script runs as soon as
the document is created, before the parser has inserted `<html>`, so it does not.

## Why the checks did not catch it

The acceptance criterion names two routes, but the test planned for it drove only the `<head>` route; nothing ran
the function at the moment the document is created. The type checker could not help either: the DOM types declare
`document.documentElement` as never null.

## Defence

- When there is no root element yet, the function resolves the mode at the call and writes the root element as soon
  as the parser creates it, before the page runs a script of its own (theming::REQ-007).
- A consumer test runs the function from a Chromium init script, which runs at the same point as a preload script. It
  asserts that the script found no root element, and that the page's first script already sees the final theme and
  light/dark.
- An acceptance criterion that names several routes or environments needs a test for each, or a recorded gap.
