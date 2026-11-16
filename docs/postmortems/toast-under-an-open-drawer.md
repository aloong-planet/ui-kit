# A toast raised from an open drawer or confirm dialog was drawn under it

2026-11-16. Found by the independent review of the drawer and the confirm dialog, before they merged; no release
carried it.

## What happened

A toast raised from a button inside an open drawer, the Toaster mounted when the app started, appeared under the
drawer's scrim and panel: the point at the toast's centre hit the drawer's body, and nothing of the toast could be
seen. Screen readers still announced it, since Base UI leaves `aria-live` regions out of what it hides outside a modal.
A confirm dialog covered toasts the same way.

## Root cause

Every floating layer of the kit — the select popup, the tooltip, the toast column, the drawer's and the confirm
dialog's scrims and surfaces — was `z-50` and rendered in a portal at the end of the page, so the one mounted last
stood in front. A select popup or a tooltip mounts when it opens, after anything already on the page; the Toaster
mounts once, when the app starts, before any drawer or dialog the user opens later. Nothing stated an order among the
layers, so each component took the level the others had.

## Why the checks did not catch it

Each component's stories and tests rendered it alone: the toast's with no drawer or dialog, the drawer's and the
dialog's with no Toaster. The defect exists only when two components are combined, and no test combined them.

## Defence

- components::REQ-001/AC-06 states the order of the floating surfaces, front to back: tooltips (`z-70`), toasts
  (`z-60`), then select popups, drawers and confirm dialogs (`z-50`), the one opened last in front.
- `tests/components-toast.test.tsx` raises a toast from inside an open drawer and an open confirm dialog, with the
  Toaster mounted first, and checks the toast is what stands at its own centre, and that a press on it leaves the
  drawer open; `tests/components-tooltip.test.tsx` checks a tooltip stands in front of a toast it overlaps. Each goes
  red with the layer it checks back at `z-50`.
