# Components

> Related: [theming](theming.md), [package](package.md)

## Problem Statement

The owner's apps share one look but no components. Each app writes its own controls, and the same kind of
control ends up written several ways even within one app — with focus rings on only a few of them, several
different floating shadows, and dialogs that ignore Esc and keep no keyboard focus. An app that wanted the
look would copy those inconsistencies along with it.

## Solution

The kit's first release provides twelve kinds of component — button, search box, select, segmented control,
card, badge, tooltip, drawer, confirm dialog, toast, skeleton and tabs — each in one standard form. A
variant exists only where the purpose really differs, and focus rings, floating shadows and radii come from
one set. Keyboard, focus and screen-reader behaviour is Base UI's; the kit sets a few parameters of its own:
where a toast appears and how long it stays, the scrim, where a tooltip sits. Every component is shown in
Storybook in every variant, size and state, in every theme and light/dark, and the owner confirms its look
there.

## Terms

- **Variant**: a form of a component the caller chooses for a different purpose (a danger button, a pill
  tab). Another way of drawing the same thing for the same purpose is not a variant.
- **Wash**: the pale `--accent` ground of a hovered or selected item ([theming](theming.md) `theming::REQ-004`).
- **Floating surface**: a select popup, a tooltip, a toast, a drawer or a dialog.

## Functional Requirements

### components::REQ-001 Shared states

Applies to every interactive component in this spec.

- components::REQ-001/AC-01: Keyboard focus shows a 2px `--ring` outline. It sits 2px outside the element,
  except inside a container that clips its children (the segmented control), where it sits 2px inside.
  Pointer focus shows no outline. The search box shows its focus on its border instead, whether the keyboard or the
  pointer focused it (components::REQ-003/AC-02).
- components::REQ-001/AC-02: A disabled control shows its muted look, the control at 45% opacity, does not react
  to hover, and cannot be activated by pointer or keyboard.
- components::REQ-001/AC-03: Select popups, drawers and dialogs use the `--popover` ground and a 1px
  `--border-strong` border; tooltips and toasts take their own grounds (components::REQ-008,
  components::REQ-011). Every floating surface casts the `--shadow-pop` shadow.
- components::REQ-001/AC-04: No component animates a colour change, so switching the theme or light/dark
  recolours every component at once ([theming](theming.md) `theming::REQ-003/AC-03`).
- components::REQ-001/AC-05: The labels of buttons, select triggers and options, segments, tabs and badges
  stay on one line and are cut with an ellipsis when the space runs out; the text of toasts, tooltips,
  dialogs and drawers wraps.
- components::REQ-001/AC-06: The floating surfaces stand in one order, front to back: a tooltip; the toasts; then
  select popups, drawers and confirm dialogs with their scrims, the one opened last in front. A toast raised while a
  drawer or a confirm dialog is open shows over it, and a press on the toast leaves the drawer or the dialog open.

### components::REQ-002 Button

The standard form: `--background` ground, 1px `--border-strong` border, `--foreground` text; under the
pointer, a `--primary` border and the wash.

| Variant | Look |
|---|---|
| `default` | The standard form above |
| `primary` | `--primary` fill, `--primary-foreground` text — for an app's prominent main action |
| `danger` | `--destructive` fill and border, `--destructive-foreground` text |
| `ghost` | No ground or border, `--muted-foreground` text; under the pointer, the wash and `--primary` text |
| `link` | Inline text in the font of the text around it, underlined in `--border-strong`; under the pointer, `--foreground` text and an underline in the text colour |

The sizes apply to every variant but `link`, which takes no size. An icon-only size is as tall as the text size it
pairs with, so buttons of one row line up.

| Size | Use | Box |
|---|---|---|
| `default` | Buttons in forms, dialogs and toolbars | 28px tall, `text-sm`, `rounded-md`; an icon before the label is 14px, 5px from it |
| `sm` | Actions on a list row | 22px tall, `text-xs`, `rounded-md`; an icon before the label is 12px, 4px from it |
| `icon` | An icon-only button | 28 × 28px, `rounded-md`, a 16px icon |
| `icon-sm` | A small icon-only button on a row or inside a note | 22 × 22px, `rounded-sm`, a 14px icon |

- components::REQ-002/AC-01: Each variant renders as its row describes, at rest and under the pointer.
- components::REQ-002/AC-02: Each size renders the box its row describes, with steps of the scale
  ([theming](theming.md) `theming::REQ-008`); the two icon sizes are square.
- components::REQ-002/AC-03: An icon-only button carries the accessible name the caller passes
  (components::CON-001); its icon is hidden from screen readers.
- components::REQ-002/AC-04: A `link` given a size fails the type check.

### components::REQ-003 Search box

One form: a text field with a leading search icon, in `text-sm` with `rounded-md` corners. The icon is 13px, 9px
from the field's leading edge and centred on its height; typed text starts 28px from that edge.

- components::REQ-003/AC-01: The search icon sits inside the field at the leading edge, and typed text starts
  after it.
- components::REQ-003/AC-02: Focusing the field turns its border `--ring`, with no outline.
- components::REQ-003/AC-03: The field has a `--card` ground, a 1px `--input` border and the placeholder the
  caller passes, and no clear button.
- components::REQ-003/AC-04: The field is 28px tall, as tall as a `default` button.

### components::REQ-004 Select

One form: a trigger and a popup of options. A select always has a selected option; it has no state without one.
The trigger shows its label in `text-sm` semibold, with `rounded-md` corners and a 14px chevron in
`--muted-foreground`. The popup has `rounded-lg` corners and 4px of padding around its options, which are 32px
tall, in `text-sm` semibold, with `rounded-md` corners and a 14px check.

- components::REQ-004/AC-01: The trigger shows the selected option's label in a `--background` ground with a
  1px `--border-strong` border; under the pointer and while open, a `--primary` border and the wash; its
  chevron turns 180° while open.
- components::REQ-004/AC-02: The popup opens 6px from the trigger, below it, or above it when there is not
  room below; when its options do not fit, they scroll inside it.
- components::REQ-004/AC-03: An option under the pointer or the keyboard highlight shows the wash; the
  selected option shows its label in `--primary-strong` and a check icon in `--primary`, and every option
  keeps room for the check so labels stay aligned.
- components::REQ-004/AC-04: Options can be split into groups by a 1px `--border` divider.
- components::REQ-004/AC-05: Arrow keys move the highlight, Enter selects, and Esc closes the popup and
  returns focus to the trigger; a click outside closes it.
- components::REQ-004/AC-06: The trigger is 28px tall, as tall as a `default` button.
- components::REQ-004/AC-07: The popup is at least as wide as the trigger, and as wide as its longest option within
  the room from the trigger's left edge to the window's right edge, with its left edge on the trigger's wherever the
  trigger stands; an option longer than that room is cut with an ellipsis (components::REQ-001/AC-05).
- components::REQ-004/AC-08: A click outside the open popup also acts on the element it lands on, as it would with
  the popup closed.
- components::REQ-004/AC-09: A select used without a selected value fails the type check.

### components::REQ-005 Segmented control

Segments side by side in one bordered container with `rounded-md` corners, one of them selected.

| Size | Use | Box |
|---|---|---|
| `default` | Settings and forms | 28px tall, as tall as a `default` button, `text-sm` |
| `sm` | Inline in toolbars and headers | 22px tall, as tall as an `sm` button, `text-xs` |

- components::REQ-005/AC-01: The selected segment shows the wash, `--accent-foreground` text and a heavier
  weight; the others show `--muted-foreground` text, and `--foreground` text on the `--background` ground
  under the pointer.
- components::REQ-005/AC-02: It is announced as a group of mutually exclusive options under the label the
  caller passes (components::CON-001), and arrow keys move between its segments.
- components::REQ-005/AC-03: Selecting a segment deselects the one selected before; the container's 1px
  `--border-strong` border clips the segments at its rounded corners, and a 1px `--border-strong` line parts
  neighbouring segments, so a selected and a hovered segment side by side read as two.
- components::REQ-005/AC-04: Each size renders the height and text size its row gives.
- components::REQ-005/AC-05: Activating the selected segment again leaves it selected.
- components::REQ-005/AC-06: A segmented control used without a selected value fails the type check.

### components::REQ-006 Card

A card is made of parts, each optional, stacked in this order: a header, holding a title, a description under the
title, and an action at the header's top-right corner beside them; the content; and a footer, its items in a row. The
parts stand apart from each other and from the card's top and bottom edges by the spacing of its size, and the
header, the content and the footer keep that spacing from the side edges. A header the caller gives `border-b`, or a
footer given `border-t`, keeps the spacing between that border and its own text; a border given with any other class
gets none. The card's text is in `text-sm`, with `rounded-lg` corners; the title is in `text-sm` semibold, the
description in `text-xs` and `--muted-foreground`.

| Size | Spacing |
|---|---|
| `default` | 14px |
| `sm` | 10px |

| Variant | Look |
|---|---|
| `default` | `--card` ground, 1px `--border` border, `--card-foreground` text |
| `selectable` | As `default`, as a button; under the pointer, a `--primary` border and the wash; when selected, also a 1px `--primary` ring and its title in `--primary` |
| `dashed` | `--background` ground, 1px dashed `--border-strong` border, `--muted-foreground` text — for empty states and notes |

A card is `default` unless the caller names another variant. A `selectable` card starts unpressed unless the
caller passes whether it is pressed.

- components::REQ-006/AC-01: Each variant renders as its row describes.
- components::REQ-006/AC-02: A `selectable` card is a button that reports whether it is pressed, and takes
  keyboard focus.
- components::REQ-006/AC-03: Each size spaces the parts apart, and from the card's edges, by its row's spacing.
- components::REQ-006/AC-04: The header shows the title, the description under it, and the action at its top-right
  corner; the title is in `text-sm` semibold, the description in `text-xs` and `--muted-foreground`.
- components::REQ-006/AC-05: An image placed directly in a card spans the card's full width; as the card's first
  child it runs to the card's top edge, and as its last child to its bottom edge, its corners following the card's.

### components::REQ-007 Badge

A small label in one shape: 18px tall whether or not its variant shows a border, in `text-xs` with `rounded-sm`
corners and 6px between its sides and its text. A leading icon is 10px, 3px before the text. It is `neutral` unless
the caller names another of these variants:

| Variant | Look |
|---|---|
| `neutral` | 1px `--border-strong` border, `--muted-foreground` text |
| `dashed` | 1px dashed `--border-strong` border, `--muted-foreground` text |
| `muted` | `--border` ground, `--muted-foreground` text |
| `primary` | The wash, `--primary` text, heavier weight |
| `primary-outline` | 1px `--primary` border, `--primary` text |
| `success` | `--success` ground, `--success-foreground` text |
| `warning` | `--warning` ground, `--warning-foreground` text |
| `note` | `--note` ground, `--note-foreground` text |
| `risk` | 1px dashed `--risk` border, `--risk-foreground` text |
| `count` | A rounded number in the wash, `--primary` text in bold: fully rounded ends, at least as wide as it is tall |

- components::REQ-007/AC-01: Each variant renders as its row describes.
- components::REQ-007/AC-02: A badge can carry a leading icon before its text.
- components::REQ-007/AC-03: A caller's own classes override a badge's ground, border and text colours, so
  an app can colour a badge with its app tokens ([theming](theming.md) `theming::REQ-009`).
- components::REQ-007/AC-04: Every variant is 18px tall, in `text-xs`, with 6px between its sides and its text and
  `rounded-sm` corners, except `count`, whose ends are fully rounded; a leading icon is 10px, 3px before the text.

### components::REQ-008 Tooltip

One form: `--tooltip` ground, `--tooltip-foreground` text, no border, and the text the caller passes, followed by a
warning line in `--tooltip-warning` when the caller passes one apart from the text. Its text is `text-sm`, with
`rounded-lg` corners and 6px of padding above and below and 10px beside, and wraps within 440px; the warning line
stands 4px below the text.

- components::REQ-008/AC-01: It opens when its trigger is hovered or receives keyboard focus, and closes when
  neither holds or when its trigger is clicked.
- components::REQ-008/AC-02: It sits 6px from its trigger on the side the caller chooses, below by default,
  and moves to the opposite side when there is not room.
- components::REQ-008/AC-03: Its text is the trigger's description for screen readers; the tooltip itself
  takes no focus, and the pointer can move onto it without it closing.
- components::REQ-008/AC-04: It shows the `--tooltip` ground, `--tooltip-foreground` text and no border; a
  warning line the caller passes shows after the text, in `--tooltip-warning`.
- components::REQ-008/AC-05: It opens as soon as the pointer is over its trigger, with no delay.
- components::REQ-008/AC-06: Once a click on its trigger has closed it, it stays closed while the pointer stays on
  the trigger, and opens again when the pointer leaves the trigger and comes back.

### components::REQ-009 Drawer

A panel along the right edge of the window, the full window height, `min(720px, 80vw)` wide, with a header
holding its title in `--primary` and an icon-only close button at its top-right corner, over a scrim in
`--overlay`. Below the header, its body holds the content the caller passes. The app opens it and closes it: it
shows while the app says it is open, and reports each way of closing it to the app.

The panel has a 1px `--border-strong` border on its left edge. Its header has 16px of padding above, 12px below and
18px at its left, keeps 48px at its right clear for the close button, and is ruled off from the body by a 1px
`--border` line; the title is `text-lg` bold. The close button is an `icon` button 12px from the panel's top and right
edges. The body has 10px of padding.

- components::REQ-009/AC-01: Esc, a click on the scrim, and the close button each close it.
- components::REQ-009/AC-02: While open, keyboard focus moves into it and stays inside it, the page behind
  it does not scroll, and it is announced as a dialog under its title; on closing, focus returns to the
  element that had focus when it opened.
- components::REQ-009/AC-03: The close button carries the accessible name the caller passes
  (components::CON-001).
- components::REQ-009/AC-04: The panel runs along the right edge of the window for its full height,
  `min(720px, 80vw)` wide, over a scrim in `--overlay`; its header shows the title in `--primary` and the
  close button at its top-right corner.
- components::REQ-009/AC-05: Content taller than the panel scrolls inside the body, while the header and its close
  button stay in view.

### components::REQ-010 Confirm dialog

A box `min(520px, 88vw)` wide, centred near the top of the window over a scrim in `--overlay`, with a title, a body
the caller passes, and its buttons at the bottom right — cancel first, then the confirming action. The app opens it and
closes it, as it does the drawer, and is told separately when the confirming action is chosen.

The box's top is 7% of the window's height below the window's top, and it is at most 82% of the window's height tall.
It has `rounded-xl` corners and 22px of padding above and below and 26px beside. The title is `text-lg` bold; the body
is `text-sm` in `--muted-foreground` with a line height of 1.7, 12px below the title and 14px above the buttons, which
stand 8px apart.

- components::REQ-010/AC-01: The cancel button is a `default` button; the confirming action is a `danger`
  button when the caller marks the action destructive, and a `primary` button otherwise.
- components::REQ-010/AC-02: Esc and the cancel button cancel; a click on the scrim does nothing, so the
  choice is always made by a button.
- components::REQ-010/AC-03: On opening, keyboard focus moves to the cancel button and stays inside the
  dialog, and the dialog is announced under its title; on closing, focus returns to the element that had focus when
  it opened.
- components::REQ-010/AC-04: Activating the confirming action runs the caller's action once and closes the dialog.
- components::REQ-010/AC-05: The box, `min(520px, 88vw)` wide, sits centred near the top of the window over a scrim
  in `--overlay`, showing its title, the caller's body, and its buttons at the bottom right with cancel first.
- components::REQ-010/AC-06: The body is announced as the dialog's description.
- components::REQ-010/AC-07: The box never runs past the window: a body taller than the room left scrolls inside the
  box, while the title and the buttons stay in view.
- components::REQ-010/AC-08: Opened from inside an open drawer, the dialog sits over a scrim of its own, which dims
  the drawer as well as the page.
- components::REQ-010/AC-09: While it is open over an open drawer, Esc closes only the dialog, and the drawer stays
  open.

### components::REQ-011 Toast

Toasts appear at the bottom centre of the window, 18px above its bottom edge, stacked in a column 8px apart
with the newest at the bottom. Any code in the app can raise one, of a variant and with its text. An app shows them
through one Toaster (components::CON-005), which carries the label screen readers announce for the region the toasts
appear in. A toast takes keyboard focus, so it shows the keyboard focus ring of components::REQ-001/AC-01. Its text
is `text-sm`, with `rounded-lg` corners and 10px of padding above and below and 16px beside, and wraps within 440px.
Each toast is drawn in front of the older ones above it, so its shadow falls on them and theirs not on it.

| Variant | Look |
|---|---|
| `success` | `--success` ground, `--success-foreground` text and 1px border |
| `error` | `--error` ground, `--error-foreground` text and 1px border |

- components::REQ-011/AC-01: With no pointer over it and the window in the foreground, a toast disappears
  3200ms after it appears.
- components::REQ-011/AC-02: A toast has no close button.
- components::REQ-011/AC-03: Screen readers announce a toast when it appears.
- components::REQ-011/AC-04: Toasts appear at the bottom centre of the window, 18px above its bottom edge,
  stacked in a column 8px apart with the newest at the bottom.
- components::REQ-011/AC-05: Each variant renders as its row describes.
- components::REQ-011/AC-06: Code outside any React component can raise a toast.
- components::REQ-011/AC-07: A toast can be swiped away, down or to the right, with the pointer.
- components::REQ-011/AC-08: Every toast raised stays in the column until it disappears: however many are raised,
  none is hidden to make room for another.
- components::REQ-011/AC-09: A toast raised while no Toaster is mounted is held, and appears when a Toaster mounts;
  it disappears 3200ms after it appears (components::REQ-011/AC-01).
- components::REQ-011/AC-10: From the toasts' region, which F6 moves the keyboard to, Tab moves to the newest toast and
  on to each older one in turn.

### components::REQ-012 Skeleton

A placeholder block in `--border` (`deep`, when the caller asks for it: `--border-strong`), with `rounded-sm` corners
and the size the caller's classes give it, that pulses between 55% and full opacity over 1.6s, eased in and out,
repeating.

- components::REQ-012/AC-01: When the system asks for reduced motion, the block does not pulse.
- components::REQ-012/AC-02: The block is hidden from screen readers and does not react to the pointer.
- components::REQ-012/AC-03: The block pulses between 55% and full opacity over 1.6s, eased in and out,
  repeating, in `--border`, or `--border-strong` for `deep`.
- components::REQ-012/AC-04: The block has `rounded-sm` corners and the width and height the caller's classes give
  it.

### components::REQ-013 Tabs

A row of tabs over their panels: each tab the caller passes carries its label and its panel, and the selected tab's
panel shows below the row. Tabs always have a selected tab. Tabs are `page` unless the caller names `pill`.

| Variant | Use | Look |
|---|---|---|
| `page` | Switching the sections of a page | Folder tabs above a 1px `--border` rule; the selected tab takes the `--background` ground, a 1px `--border` border on its top and sides, and `--primary` text in a heavier weight, and joins the panel below it; the others show `--muted-foreground` text, `--foreground` under the pointer |
| `pill` | Switching between categories of a list | Separate pill buttons on a `--card` ground with a 1px `--border-strong` border and `--muted-foreground` text, `--foreground` under the pointer; the selected one shows the wash, `--primary-strong` text and a `--primary` border |

A tab of either variant can show a count after its label, in a lighter tone, 4px after the label. A `page` tab is
28px tall, as tall as a `default` button, in `text-sm`, with 13px between its sides and its label and `rounded-md`
top corners; the tabs stand 2px apart, and the panel starts directly under the rule. A `pill` tab is 22px tall, as
tall as an `sm` button, in `text-xs` semibold, with 10px between its sides and its label and `rounded-md` corners;
the tabs stand 4px apart, and the panel starts 8px under the row. The panel has no ground and no padding of its own.

- components::REQ-013/AC-01: Each variant renders as its row describes.
- components::REQ-013/AC-02: The tab row is announced as a tab list under the label the caller passes
  (components::CON-001), and the arrow keys move between the tabs, selecting each enabled tab they reach.
- components::REQ-013/AC-03: The selected tab's panel shows below the row, announced as a tab panel under its tab's
  label; no other tab's panel shows.
- components::REQ-013/AC-04: A single tab can be disabled (components::REQ-001/AC-02); the arrow keys still reach it,
  without selecting it.
- components::REQ-013/AC-05: Tabs used without a selected value, or with a value that is none of their tabs, fail
  the type check.
- components::REQ-013/AC-06: Each variant renders the height, text size and spacing the paragraph above gives it.

### components::REQ-014 Floating surfaces follow their anchor

Applies to the select popup and the tooltip.

- components::REQ-014/AC-01: When anything outside an open select popup or tooltip scrolls, it closes; a
  scroll inside the popup does not close it. A scroll that comes within 150ms of a window resize belongs to the
  resize, since the browser fires one when a resize shortens a scrolled area, and leaves an open select popup open
  (components::REQ-014/AC-02). The scroll the browser makes to bring a tooltip's trigger into view as it takes
  keyboard focus, at once or smoothly, belongs to the focus and leaves the tooltip open.
- components::REQ-014/AC-02: When the window is resized, an open tooltip closes and an open select popup
  moves to stay beside its trigger.

### components::REQ-015 Storybook

- components::REQ-015/AC-01: Every component has stories showing every variant, size and state this spec
  names.
- components::REQ-015/AC-02: The Storybook toolbar switches the theme (`purple`, `blue`, `amber`) and the
  mode (`system`, `light`, `dark`), and every story follows the switch.
- components::REQ-015/AC-03: Storybook uses the kit exactly as a consumer does ([package](package.md)
  `package::REQ-002`).

## Constraints

### components::CON-001 No text built into the components (direct acceptance)

Applies to: every component in this spec. A component writes no text of its own: every visible or announced
text it needs — the accessible name of an icon-only button, the drawer's close button, the label of a
segmented control, the placeholder of a search box, the accessible name of a search box, a select or a tab row (an
`aria-label`, or an `aria-labelledby` pointing at a label on the page), the text of a tooltip, the label of the
Toaster's region, the text of a toast, the content of a `selectable` card, which names the button it is — is
required, as a prop or as the argument of the call that raises a toast, so a missing one fails the type check. The
app passes it from its own dictionary.

### components::CON-002 The owner confirms every component's look in Storybook (direct acceptance)

Applies to: every component in this spec. A component counts as done only once the owner has confirmed its
look on its Storybook stories (the invariant in `AGENTS.md`); the screenshots attached to that delivery
record what was confirmed.

### components::CON-003 Built from shadcn/ui's Mira style on Base UI (direct acceptance)

Applies to: every component in this spec. Each starts from shadcn/ui's source for its counterpart in the
Mira style on the Base UI base, and is restyled from there to this spec and the kit's scale
([theming](theming.md) `theming::REQ-008`).

| Kit component | shadcn/ui counterpart |
|---|---|
| Button | `button` |
| Search box | `input-group` |
| Select | `select` |
| Segmented control | `toggle-group`, with the behaviour of Base UI's radio group (`RadioGroup`, `Radio`) |
| Card | `card` |
| Badge | `badge` |
| Tooltip | `tooltip` |
| Drawer | `sheet` |
| Confirm dialog | `alert-dialog` |
| Toast | `toast` |
| Skeleton | `skeleton` |
| Tabs | `tabs` |

### components::CON-004 Components read only tokens (direct acceptance)

Applies to: every component in this spec. Every colour a component shows comes from a general token
([theming](theming.md) `theming::REQ-004`); no component writes a colour value or branches on the theme or
on light/dark.

### components::CON-005 One Toaster per document (direct acceptance)

Applies to: every consumer. A document has at most one Toaster, since every Toaster shows every toast raised.

## Failure modes and boundaries

- **A label longer than its control**: it stays on one line and is cut with an ellipsis, while running text
  wraps (components::REQ-001/AC-05).
- **An icon-only button, a drawer, a confirm dialog, a segmented control, a search box, a select, tabs, a `selectable`
  card, a tooltip, a Toaster or a toast without their text**: the type check fails (components::CON-001); nothing
  renders a fallback text.
- **A caller that wants more in a drawer or a confirm dialog** — a description under the drawer's title, an action
  beside it, buttons pinned under the drawer's body, a third button in the dialog: the drawer's header holds only its
  title and close button, it has no footer, and the dialog has only its two buttons. Anything else goes in the body
  the caller passes, and scrolls with it (components::REQ-009/AC-05, REQ-010/AC-07).
- **A long unbroken word in a drawer or a confirm dialog** (a path, a URL): it breaks onto the next line instead of
  running past the panel or the box (components::REQ-001/AC-05).
- **The element that had focus when a drawer or a confirm dialog opened is gone when it closes** (the confirmed action
  removed it): a confirm dialog opened from inside an open drawer moves focus into the drawer; otherwise focus is left
  on the page, for the app to move on to where its work flow continues.
- **A confirm dialog opened from inside an open drawer**: it dims the drawer under its own scrim, and Esc closes the
  dialog alone (components::REQ-010/AC-08, AC-09).
- **An open drawer or confirm dialog removed from the page** (the app leaves the view that holds it while it is
  open): the page behind it scrolls again, and focus returns as it does on closing.
- **A select, a segmented control or tabs without a selected value**: the type check fails; none has a state without
  a selection (components::REQ-004/AC-09, components::REQ-005/AC-06, components::REQ-013/AC-05).
- **Something interactive inside a `selectable` card**, such as a button in its action: not supported. The card is a
  button itself, and a control inside a button cannot be used reliably by pointer, keyboard or screen reader; a card
  that needs an action of its own is a `default` card.
- **A selected tab the app disables**, alone or with every other tab: it stays selected and its panel shows, also
  once the tabs are enabled again, and the tabs report no change; the selection changes only when the user picks a tab
  or the app passes a value, whether the app holds the selection or leaves it to the tabs (components::REQ-013).
- **`page` tabs on a surface other than the page's ground**, such as inside a card: the selected tab keeps its
  `--background` ground, which joins a panel on the page's `--background` but not one on a `--card` ground; the tabs
  are drawn for the page (components::REQ-013).
- **The selected segment activated again**: it stays selected (components::REQ-005/AC-05).
- **A click outside an open select popup**: the popup closes and the click acts on what it lands on
  (components::REQ-004/AC-05, components::REQ-004/AC-08).
- **A `link` button given a size**: the type check fails (components::REQ-002/AC-04).
- **A select whose options do not fit the window**: the popup scrolls inside its own height
  (components::REQ-004/AC-02).
- **Keyboard focus leaving a tooltip's trigger while the pointer rests on the trigger or on the tooltip**: the tooltip
  stays open until the pointer has left both (components::REQ-008/AC-01, components::REQ-008/AC-03).
- **A tooltip's trigger inside a container whose rules select its children**, such as Tailwind's `space-x-*`,
  `divide-*` and `last:`: the tooltip adds no element to that container, so those rules see the caller's elements
  alone.
- **A consumer that wants an arrow on a tooltip**: the kit's tooltip draws none and takes no option for one, and Base
  UI's `Tooltip.Arrow` cannot be added through it; such a consumer builds that tooltip on Base UI itself.
- **A toast raised before any Toaster is mounted** — at startup, or by code that runs before React has rendered the
  Toaster: it is held and appears when a Toaster mounts (components::REQ-011/AC-09). If no Toaster ever mounts, the
  toasts held are never shown, and nothing reports it.
- **More toasts than the window holds**: the column is at most as tall as the window, keeping 18px above its top toast
  as below its bottom one, and scrolls once the toasts overflow it, starting at the newest (components::REQ-011/AC-08).
  The wheel over the toasts scrolls it, while beside them the pointer still reaches the page beneath; Tab after F6
  scrolls each toast into view as it takes the focus, 18px inside the column. A toast that arrives while the column is
  scrolled up from the newest leaves the toasts in view where they stand; when a toast leaves, the older toasts above
  it move down into its place, as in a column that fits the window.

## Implementation Decisions

Each decision carries its reason and the alternative it rejected (this repository keeps decisions in its
specs; see `AGENTS.md`).

- **One standard form per kind of component, with variants only where the purpose differs.** A second way of
  drawing the same thing for the same purpose gives apps a choice that means nothing and lets their looks
  drift apart. Rejected: several forms of a component for the same purpose.
- **A filled `primary` button.** Apps need a prominent main action; its text takes the card colour, which
  reads on the brand colour in every theme. Rejected: outlined buttons only.
- **Every control as tall as the button of its size.** Icon-only and text buttons, search boxes, select triggers,
  segmented controls and tabs sit side by side in toolbars, forms and on rows, and line up only when they are equally
  tall: 28px beside a `default` button (a `page` tab), 22px beside an `sm` one (a `pill` tab). Rejected: a 32px `icon`
  button, which stands above the 28px text buttons beside it, and fields, triggers, segmented controls and tabs of 29
  to 35px.
- **The segmented control is a radio group.** It is one choice among mutually exclusive options that is never
  empty, which is what a radio group announces and keeps. Rejected: Base UI's toggle group, on which shadcn/ui's
  `toggle-group` is built, which announces its segments as pressed toggle buttons and empties the selection when the
  pressed one is activated again.
- **The select is not modal.** An outside scroll closes it (components::REQ-014/AC-01), so the page stays scrollable
  while it is open, and a click outside acts as it would with the popup closed. Rejected: Base UI's modal select,
  which locks the page's scroll and blocks outside clicks while it is open.
- **A select, a segmented control and tabs always have a selected option.** The select and the segmented control show
  the current value of a setting, and tabs always show the panel of one tab. Rejected: a placeholder for a select with
  nothing selected, and tabs that fall back to their first tab when given no value, which hides a value the app
  forgot to pass.
- **The tabs render their panels.** Each tab is linked to the panel it shows, so a screen reader announces which
  content a tab controls, and the selected `page` tab joins its panel. The owner's choice. Rejected: a row of tabs
  only, the app switching the content below it, which leaves the tabs unlinked to what they switch.
- **The selection follows the arrow keys in the tabs**, as in the segmented control: their panels show at once,
  which is when the WAI-ARIA tabs pattern recommends it. The owner's choice. Rejected: Base UI's default, where the
  arrow keys move the focus only and Enter or Space selects.
- **A selected tab the app disables stays selected.** A selection is the user's act or the app's: in the WAI-ARIA
  tabs pattern a tab is selected when the user activates it, and a disabled tab is one that cannot be activated, not
  one whose panel goes away; tabs the app holds and tabs that hold their own selection follow the same rule. Rejected:
  Base UI's fallback for tabs that hold their own selection, which moves it to the first enabled tab, or to none when
  no tab is enabled, and handing the selection to the first enabled tab whoever holds it, which would report a change
  to an app that holds the selection when no one made one.
- **A badge is a plain label.** It has no pointer or keyboard behaviour of its own and shows no hover or focus
  state, so it is a `<span>` without shadcn/ui's `render` prop and its link looks; a clickable tag would be a
  component of its own, with states this spec does not define for badges. Rejected: a badge that can render as a
  link.
- **The card keeps shadcn/ui's parts and sizes**: a header with a title, a description and an action, the content
  and a footer, at two spacings. An app gets a ready layout for what a card holds. The owner's choice. Rejected: one
  container, the app laying out its content.
- **Each component without a named variant takes its base form**: a `default` card, a `neutral` badge, the plain
  skeleton and `page` tabs; the other variants are opt-in. A status colour is chosen on purpose; GitHub Primer's
  Label likewise defaults to its `default` variant, drawn with no ground and the default text and border colours, and
  Atlassian's Lozenge to its `default` appearance, which its `neutral` maps to. Base UI's components have no
  variants of their own, so none conflicts. Rejected: requiring a variant on every use.
- **The select popup is at least as wide as its trigger, on the trigger's left edge.** Options keep their full
  labels where there is room, and the popup reads as opening from the trigger. Rejected: a popup exactly as wide as
  the trigger, which cuts every longer option, and one on the trigger's right edge, which suits only a trigger at the
  right of its row.
- **A `link` button takes no size.** It is text inside a sentence, and a box of its own would push it off the line
  of the text around it. Rejected: sizes on a link, and a size accepted and ignored, which gives the caller no sign.
- **Base UI's behaviour for keyboard, focus and screen readers.** Base UI provides Esc handling, focus
  containment, dialog semantics and announced toasts; Esc also closes an open tooltip. Rejected: a plainer behaviour
  without them, which would mean writing code to switch Base UI's off.
- **The confirm dialog ignores clicks on the scrim.** A confirm dialog is closed by a choice, so a stray
  click beside it cannot dismiss the question. Rejected: cancelling on a scrim click.
- **Starting from the Mira style.** It is shadcn/ui's style for dense interfaces and the closest to the kit's
  scale (its default button is 28px tall with 12px text, against the kit's `default` controls, 28px tall with
  12.5px text). Rejected: Nova (32px, 14px text) and Vega (36px, 14px text), both further from it.
- **The tooltip opens with no delay, and a click on its trigger closes it.** The owner's choice. It shows as soon as
  the pointer reaches its trigger, as shadcn/ui's tooltip does; once the trigger is clicked, the click's own result
  takes over from the hint, which is Base UI's default (`closeOnClick`), kept by shadcn/ui's tooltip. Rejected: Base
  UI's 600ms delay, and a tooltip that stays open on a click.
- **The pointer can move onto an open tooltip without it closing** (components::REQ-008/AC-03). WCAG 2.1 SC 1.4.13
  (AA) asks that content shown on hover can be reached by the pointer without disappearing, and it is Base UI's
  default (`disableHoverablePopup` false, Base UI 1.9.0); while open, a tooltip therefore takes the pointer over the
  area it covers. Rejected: a tooltip the pointer passes through, which disappears when the pointer moves onto it.
- **The tooltip has no arrow, and neither the tooltip nor a toast moves as it appears or leaves.** The kit's floating
  surfaces share one form, and the select popup has neither; shadcn/ui's motion classes come from `tw-animate-css`,
  which the kit does not depend on. Base UI ships the arrow as a separate, optional part (`Tooltip.Arrow`). Rejected:
  shadcn/ui's arrow and its fade and zoom, and an option for an arrow, for which no general need has been shown.
- **One warning line, passed apart from the tooltip's text.** The caller never styles a line itself, and a tooltip
  stays a short description rather than a layout of its own. Rejected: several lines, any of them markable as a
  warning.
- **The toast is shadcn/ui's `toast`, on Base UI.** Rejected: shadcn/ui's `sonner`, which depends on
  `next-themes` and would compete with the kit's ThemeProvider for the root element.
- **Toasts are raised by a call and shown by one Toaster.** An app renders a Toaster once (components::CON-005),
  anywhere in its tree, and any code, inside or outside React, raises a toast through the kit's `toast` call, one per
  variant; Base UI's toasts need a provider and a region in the app's React tree. Rejected: shadcn/ui's Toaster that
  wraps the app's tree, which makes the app restructure its root; and the kit mounting a React root of its own on the
  first toast, beside the app's, which would still need a setup call for the region's label.
- **A toast raised before a Toaster mounts is held until one does** (components::REQ-011/AC-09). Raising a toast
  before React has rendered the Toaster is an ordinary path in an app, at startup or from module code. Rejected:
  Base UI's dropping it, which loses the message with nothing to report it.
- **A toast can be swiped away.** The owner's choice: with no close button, a swipe is the only way to clear a toast
  early, and it is Base UI's. Rejected: toasts that leave only on their timer.
- **No cap on the toasts shown.** The owner's choice: every toast's message stays readable for its 3200ms. Rejected:
  Base UI's cap of three, which hides the oldest toast for good when a fourth arrives.
- **More toasts than the window holds scroll in the column** (Failure modes and boundaries). Every message stays
  reachable by the pointer and the keyboard, and none is hidden for another (components::REQ-011/AC-08). Rejected: a
  queue that holds toasts back until there is room, which would bring back a cap on the toasts shown; and toasts
  standing above the window's top edge, which neither the pointer nor the keyboard reaches.
- **The drawer is shadcn/ui's `sheet`**, a panel from the side of the window. Rejected: shadcn/ui's `drawer`,
  which slides up from the bottom.
- **The drawer and the confirm dialog are each one component whose props carry what the kit guarantees.** The kit
  draws the drawer's header — its title and its close button — and the confirm dialog's title, buttons and scrim, so
  the type check requires every text they show (components::CON-001) and the kit holds the order and variants of the
  buttons and the focus on cancel; the drawer's body is the content the caller passes. The drawer takes its title,
  the close button's accessible name and its content; the confirm dialog takes its title, its body, the labels of its
  two buttons, and whether the action is destructive. Rejected: shadcn/ui's compound parts (a header, a footer, a
  title, a cancel and an action part), with which each caller would assemble these, so that neither the type check
  nor the kit could hold them; and slots for more in the header or the footer, which can be added later without
  breaking a caller, while a slot once shipped cannot be removed without breaking one.
- **The app opens and closes them.** Each shows while the app's `open` is set and reports every way of closing
  through `onOpenChange(false)`: Esc, a scrim click and the close button for the drawer, Esc and cancel for the
  confirm dialog. The confirming action is reported through `onConfirm`, called once, before the dialog reports
  closing. A drawer or a confirm dialog is opened by the app's own logic — an action on a row, a menu item, a
  shortcut — and one controlled pair, as in Base UI's dialogs and the kit's Select, covers every one of them; focus
  returns to whatever had it when it opened, as the WAI-ARIA dialog pattern asks. Rejected: a trigger part beside
  the controlled props, which gives two ways of opening the same thing.
- **When the element that opened a drawer or a confirm dialog is gone, the kit moves focus only where it knows the
  work flow continues.** The WAI-ARIA APG modal dialog pattern sends focus, when the invoking element no longer exists,
  to "another element that provides logical work flow", which only the app knows; the kit knows one case, a confirm
  dialog opened from inside an open drawer, where the work goes on in the drawer, and otherwise leaves focus on the
  page. Rejected: Base UI's fallback, the element that had focus before some earlier dialog or popup opened, which can
  lie behind the open drawer or have nothing to do with the dialog; and a prop naming where focus returns, which can be
  added later without breaking a caller once an app needs it.
- **The confirm dialog is at most 520px wide**, `min(520px, 88vw)`: the width of Ant Design's Modal, chosen by the
  owner (「Ant Design's 520px」, 2026-11-16) as a confirm dialog's width from an established design system. Rejected:
  a 720px box, a width made for reading documents; and shadcn/ui's 384px.
- **The caller marks the confirming action destructive, rather than choosing its button.** The caller says what the
  action is and the kit picks the `danger` or the `primary` button. Rejected: a prop naming the button's variant,
  which would admit looks this spec does not give a confirming action.
- **Content taller than the window scrolls inside the drawer's body and the dialog's body.** The drawer's close
  button and the dialog's buttons stay within reach however long the content is, and a pointer answers the dialog
  only with its buttons (components::REQ-010/AC-02). Rejected: scrolling the whole panel or box, which scrolls them
  out of view.
- **A confirm dialog opened inside a drawer draws its own scrim.** Base UI leaves out the scrim of a dialog opened
  inside another one; the kit draws it, so the question always sits over a scrim and looks the same wherever the app
  renders it. Rejected: Base UI's default, under which the drawer behind the question stays undimmed when the app
  renders the dialog inside the drawer, and is dimmed when the app renders it outside.
- **Neither the drawer nor the confirm dialog moves as it opens or closes**: both appear and disappear at once. The
  kit's floating surfaces share one form, and the select popup does not move; shadcn/ui's motion classes come from
  `tw-animate-css`, which the kit does not depend on. Rejected: shadcn/ui's slide and fade of the panel, and the fade
  and zoom of the dialog.
- **The floating surfaces stand in a fixed order** (components::REQ-001/AC-06): tooltips in front, then toasts, then
  select popups, drawers and confirm dialogs, among which the one opened last is in front. A toast reports what the
  user has just done, often from inside a drawer or a dialog, and the Toaster mounts before them; a tooltip is
  short-lived and anchored to what the pointer or focus is on, so it stays readable over a toast. MUI's and Chakra UI's
  z-index scales order them the same way (MUI: drawer 1200, modal 1300, snackbar 1400, tooltip 1500; Chakra UI:
  overlay 1300, modal 1400, popover 1500, toast 1700, tooltip 1800). Rejected: one level for every surface, under which
  a toast raised from an open drawer or dialog is drawn under it; and raising only the toasts, which puts a toast over
  a tooltip.
- **One floating shadow, `--shadow-pop`, for every floating surface.** Rejected: a shadow per kind of
  surface, which gives the same depth several looks.

## Out of Scope

- **Components beyond the twelve**: menus, filter chips, app navigation rails, charts and sidebars.
- **More than one tooltip form**, such as a light tooltip or a CSS-only tooltip on chart bars.
- **A loading state on buttons, a clear button in the search box, and a placeholder in a select with nothing
  selected**: not part of the first release's look.
- **Right-to-left languages**: no app that uses the kit has one; the components are not checked mirrored.
  Supporting them later means reopening this decision and checking every component mirrored.
- **Showing a cut label in full on hover**: a caller that needs it wraps the control in a tooltip.
