# A control in the confirm dialog's body lost part of its focus ring

2026-11-16. Found by the independent review of the confirm dialog, before it merged; no release carried it.

## What happened

components::REQ-001/AC-01 says keyboard focus shows a 2px outline 2px outside the element. A button the caller put in
the confirm dialog's body, at the body's edge, showed only the right side of its ring when focused from the keyboard.

## Root cause

The dialog's body scrolls when its content is taller than the room left, and a scrolling element clips whatever its
children draw outside its padding box. The body had no padding, so the ring of a control at its edge, which reaches 4px
outside the control, was cut on the left, top and bottom. The drawer's body did not cut it, only because it has 10px of
padding for its own look.

## Why the checks did not catch it

The spec sends anything more than text into the body the caller passes, but the stories and tests of the dialog put
only paragraphs and a link in the middle of a sentence there, and never focused a control in the body from the
keyboard. The focus-ring tests checked the dialog's own buttons, which do not stand in a scrolling element.

## Defence

- The body has 4px of padding taken back by as much negative margin, so the ring stays inside it and the text stands
  where it did.
- `tests/components-confirm-dialog.test.tsx` puts a kit Button at the edge of the body, reaches it with Shift+Tab, and
  checks the ring's reach on all four sides lies inside the body; it goes red without the padding.
