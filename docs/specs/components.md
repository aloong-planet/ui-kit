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

> Pending: of these components only the button is built. Each other one's first sizes (padding, heights, font
> sizes, weights, radii) are taken from the matching element of the Agent Shed app (`aloong-planet/agentshed`,
> commit `14b6d5b`, `src/renderer/src/theme.css` unless named otherwise) and then confirmed by the owner in
> Storybook (components::CON-002): search box `.sbar input`, with
> the icon placement of `.sh`; select `.lang-trigger`, `.lang-pop`, `.lang-opt`, `.lang-sep`; segmented
> control `.seg.seg-field` (size `sm` `.seg`); card `.card` (`selectable` `.theme-card`, `dashed`
> `.settings-foot`); badge `.pill` (`count` `.cnt-b`); tooltip `TIP_LOOK` in `FloatingBox.tsx`; drawer
> `.file-drawer`; confirm dialog `.reader.dlg`; toast `.toasts`, `.toast`; skeleton `.sk-ph`; tabs `.tab`
> (`pill` `.ptab`).

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

One form: a text field with a leading search icon.

- components::REQ-003/AC-01: The search icon sits inside the field at the leading edge, and typed text starts
  after it.
- components::REQ-003/AC-02: Focusing the field turns its border `--ring`, with no outline.
- components::REQ-003/AC-03: The field has a `--card` ground, a 1px `--input` border and the placeholder the
  caller passes, and no clear button.
- components::REQ-003/AC-04: The field is 28px tall, as tall as a `default` button.

### components::REQ-004 Select

One form: a trigger and a popup of options. A select always has a selected option; it has no state without one.

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
  the space available, with its left edge on the trigger's; an option longer than that is cut with an ellipsis
  (components::REQ-001/AC-05).
- components::REQ-004/AC-08: A click outside the open popup also acts on the element it lands on, as it would with
  the popup closed.
- components::REQ-004/AC-09: A select used without a selected value fails the type check.

### components::REQ-005 Segmented control

Segments side by side in one bordered container, one of them selected.

| Size | Use | Box |
|---|---|---|
| `default` | Settings and forms | 28px tall, as tall as a `default` button |
| `sm` | Inline in toolbars and headers | 22px tall, as tall as an `sm` button |

- components::REQ-005/AC-01: The selected segment shows the wash, `--accent-foreground` text and a heavier
  weight; the others show `--muted-foreground` text, and `--foreground` text on the `--background` ground
  under the pointer.
- components::REQ-005/AC-02: It is announced as a group of mutually exclusive options under the label the
  caller passes (components::CON-001), and arrow keys move between its segments.
- components::REQ-005/AC-03: Selecting a segment deselects the one selected before; the container's 1px
  `--border-strong` border clips the segments at its rounded corners.
- components::REQ-005/AC-04: Each size renders the height its row gives.
- components::REQ-005/AC-05: Activating the selected segment again leaves it selected.
- components::REQ-005/AC-06: A segmented control used without a selected value fails the type check.

### components::REQ-006 Card

| Variant | Look |
|---|---|
| `default` | `--card` ground, 1px `--border` border |
| `selectable` | As `default`; under the pointer, a `--primary` border and the wash; when selected, also a 1px `--primary` ring and its label in `--primary` |
| `dashed` | `--background` ground, 1px dashed `--border-strong` border, `--muted-foreground` text — for empty states and notes |

- components::REQ-006/AC-01: Each variant renders as its row describes.
- components::REQ-006/AC-02: A `selectable` card is a button that reports whether it is pressed, and takes
  keyboard focus.

### components::REQ-007 Badge

A small label in one shape, in these variants:

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
| `count` | A rounded number in the wash, `--primary` text |

- components::REQ-007/AC-01: Each variant renders as its row describes.
- components::REQ-007/AC-02: A badge can carry a leading icon before its text.
- components::REQ-007/AC-03: A caller's own classes override a badge's ground, border and text colours, so
  an app can colour a badge with its app tokens ([theming](theming.md) `theming::REQ-009`).

### components::REQ-008 Tooltip

One form: `--tooltip` ground, `--tooltip-foreground` text, no border, and the text the caller passes, which
may include a line in `--tooltip-warning`.

- components::REQ-008/AC-01: It opens when its trigger is hovered or receives keyboard focus, and closes when
  neither holds.
- components::REQ-008/AC-02: It sits 6px from its trigger on the side the caller chooses, below by default,
  and moves to the opposite side when there is not room.
- components::REQ-008/AC-03: Its text is the trigger's description for screen readers; the tooltip itself
  takes no focus and lets the pointer pass through it.
- components::REQ-008/AC-04: It shows the `--tooltip` ground, `--tooltip-foreground` text and no border; a
  line the caller marks as a warning shows in `--tooltip-warning`.

### components::REQ-009 Drawer

A panel along the right edge of the window, the full window height, `min(720px, 80vw)` wide, with a header
holding its title in `--primary` and an icon-only close button at its top-right corner, over a scrim in
`--overlay`.

- components::REQ-009/AC-01: Esc, a click on the scrim, and the close button each close it.
- components::REQ-009/AC-02: While open, keyboard focus moves into it and stays inside it, the page behind
  it does not scroll, and it is announced as a dialog under its title; on closing, focus returns to the
  element that opened it.
- components::REQ-009/AC-03: The close button carries the accessible name the caller passes
  (components::CON-001).
- components::REQ-009/AC-04: The panel runs along the right edge of the window for its full height,
  `min(720px, 80vw)` wide, over a scrim in `--overlay`; its header shows the title in `--primary` and the
  close button at its top-right corner.

### components::REQ-010 Confirm dialog

A box centred near the top of the window over a scrim in `--overlay`, with a title, a body the caller
passes, and its buttons at the bottom right — cancel first, then the confirming action.

- components::REQ-010/AC-01: The cancel button is a `default` button; the confirming action is a `danger`
  button when the caller marks the action destructive, and a `primary` button otherwise.
- components::REQ-010/AC-02: Esc and the cancel button cancel; a click on the scrim does nothing, so the
  choice is always made by a button.
- components::REQ-010/AC-03: On opening, keyboard focus moves to the cancel button and stays inside the
  dialog, and the dialog is announced under its title; on closing, focus returns to the element that opened it.
- components::REQ-010/AC-04: Activating the confirming action runs the caller's action and closes the dialog.
- components::REQ-010/AC-05: The box sits centred near the top of the window over a scrim in `--overlay`,
  showing its title, the caller's body, and its buttons at the bottom right with cancel first.

### components::REQ-011 Toast

Toasts appear at the bottom centre of the window, 18px above its bottom edge, stacked in a column 8px apart
with the newest at the bottom. Any code in the app can raise one.

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

### components::REQ-012 Skeleton

A placeholder block in `--border` (`deep`: `--border-strong`) that pulses between 55% and full opacity over
1.6s, eased in and out, repeating.

- components::REQ-012/AC-01: When the system asks for reduced motion, the block does not pulse.
- components::REQ-012/AC-02: The block is hidden from screen readers and does not react to the pointer.
- components::REQ-012/AC-03: The block pulses between 55% and full opacity over 1.6s, eased in and out,
  repeating, in `--border`, or `--border-strong` for `deep`.

### components::REQ-013 Tabs

| Variant | Use | Look |
|---|---|---|
| `page` | Switching the sections of a page | Folder tabs above a 1px `--border` rule; the selected tab takes the `--background` ground and `--primary` text in a heavier weight and joins the panel below it; the others show `--muted-foreground` text, `--foreground` under the pointer |
| `pill` | Switching between categories of a list | Separate pill buttons on a `--card` ground with a 1px `--border-strong` border and `--muted-foreground` text; the selected one shows the wash, `--primary-strong` text and a `--primary` border; a tab can show a count after its label in a lighter tone |

- components::REQ-013/AC-01: Each variant renders as its row describes.
- components::REQ-013/AC-02: The tabs are announced as a tab list, and arrow keys move between tabs.

### components::REQ-014 Floating surfaces follow their anchor

Applies to the select popup and the tooltip.

- components::REQ-014/AC-01: When anything outside an open select popup or tooltip scrolls, it closes; a
  scroll inside the popup does not close it.
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
segmented control, the placeholder of a search box, the accessible name of a search box or a select (an
`aria-label`, or an `aria-labelledby` pointing at a label on the page) — is a required prop, so a missing one fails
the type check. The app passes it from its own dictionary.

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

## Failure modes and boundaries

- **A label longer than its control**: it stays on one line and is cut with an ellipsis, while running text
  wraps (components::REQ-001/AC-05).
- **An icon-only button, a drawer, a segmented control, a search box or a select without its text**: the type
  check fails (components::CON-001); nothing renders a fallback text.
- **A select or a segmented control without a selected value**: the type check fails; neither has a state without a
  selection (components::REQ-004/AC-09, components::REQ-005/AC-06).
- **The selected segment activated again**: it stays selected (components::REQ-005/AC-05).
- **A click outside an open select popup**: the popup closes and the click acts on what it lands on
  (components::REQ-004/AC-05, components::REQ-004/AC-08).
- **A `link` button given a size**: the type check fails (components::REQ-002/AC-04).
- **A select whose options do not fit the window**: the popup scrolls inside its own height
  (components::REQ-004/AC-02).

## Implementation Decisions

Each decision carries its reason and the alternative it rejected (this repository keeps decisions in its
specs; see `AGENTS.md`).

- **One standard form per kind of component, with variants only where the purpose differs.** A second way of
  drawing the same thing for the same purpose gives apps a choice that means nothing and lets their looks
  drift apart. Rejected: several forms of a component for the same purpose.
- **A filled `primary` button.** Apps need a prominent main action; its text takes the card colour, which
  reads on the brand colour in every theme. Rejected: outlined buttons only.
- **Every control as tall as the button of its size.** Icon-only and text buttons, search boxes, select triggers and
  segmented controls sit side by side in toolbars, forms and on rows, and line up only when they are equally tall:
  28px beside a `default` button, 22px beside an `sm` one. Rejected: a 32px `icon` button, which stands above the 28px
  text buttons beside it, and fields, triggers and segmented controls of 29 to 35px.
- **The segmented control is a radio group.** It is one choice among mutually exclusive options that is never
  empty, which is what a radio group announces and keeps. Rejected: Base UI's toggle group, on which shadcn/ui's
  `toggle-group` is built, which announces its segments as pressed toggle buttons and empties the selection when the
  pressed one is activated again.
- **The select is not modal.** An outside scroll closes it (components::REQ-014/AC-01), so the page stays scrollable
  while it is open, and a click outside acts as it would with the popup closed. Rejected: Base UI's modal select,
  which locks the page's scroll and blocks outside clicks while it is open.
- **A select and a segmented control always have a selected option.** Both show the current value of a setting.
  Rejected: a placeholder for a select with nothing selected.
- **The select popup is at least as wide as its trigger, on the trigger's left edge.** Options keep their full
  labels where there is room, and the popup reads as opening from the trigger. Rejected: a popup exactly as wide as
  the trigger, which cuts every longer option, and one on the trigger's right edge, which suits only a trigger at the
  right of its row.
- **A `link` button takes no size.** It is text inside a sentence, and a box of its own would push it off the line
  of the text around it. Rejected: sizes on a link, and a size accepted and ignored, which gives the caller no sign.
- **Base UI's behaviour for keyboard, focus and screen readers.** Base UI provides Esc handling, focus
  containment, dialog semantics and announced toasts. Rejected: a plainer behaviour without them, which
  would mean writing code to switch Base UI's off.
- **The confirm dialog ignores clicks on the scrim.** A confirm dialog is closed by a choice, so a stray
  click beside it cannot dismiss the question. Rejected: cancelling on a scrim click.
- **Starting from the Mira style.** It is shadcn/ui's style for dense interfaces and the closest to the kit's
  scale (its default button is 28px tall with 12px text, against the kit's controls of about 28–30px with
  12.5px text). Rejected: Nova (32px, 14px text) and Vega (36px, 14px text), both further from it.
- **The toast is shadcn/ui's `toast`, on Base UI.** Rejected: shadcn/ui's `sonner`, which depends on
  `next-themes` and would compete with the kit's ThemeProvider for the root element.
- **The drawer is shadcn/ui's `sheet`**, a panel from the side of the window. Rejected: shadcn/ui's `drawer`,
  which slides up from the bottom.
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
