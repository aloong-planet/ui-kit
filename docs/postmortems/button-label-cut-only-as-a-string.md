# A button label passed as an element was not cut with an ellipsis

2026-11-13. Found by the independent review of the Button, before it merged; no release carried it.

## What happened

components::REQ-001/AC-05 says a button's label stays on one line and is cut with an ellipsis when the space runs
out. A label passed as an element, as a translation component renders one, ran past the button's edge, and a label
with a value in it (`{count} conversations`) was cut in two separate pieces.

## Root cause

The button was a flex container, whose own text cannot be cut with an ellipsis, so the Button wrapped each string or
number child in a span that cut it. A child of any other shape was not wrapped, and adjacent text children were
wrapped one by one.

## Why the checks did not catch it

The story that tests the rule passed only plain string labels: the shapes in which an app passes a label were not
listed before the test was written, so the test held the one shape the implementation handled.

## Defence

- A text button is a line of inline content that its own box cuts, so the label is cut whatever shape it is passed in;
  no child is wrapped.
- The `LongLabel` story passes a string, an icon and a string, an element, and text with a value in it, and asserts
  for each that one element holds the whole label and cuts it with an ellipsis.
