# Components

> Related: [theming](theming.md), [package](package.md)

## Problem Statement

Agent Shed already has a look of its own, but no component library: the same kind of control is written
several times over — seven button styles, six segmented controls, two search boxes, two drawers, two forms of
tabs — with focus rings on only a few of them, five different floating shadows, and dialogs that ignore Esc
and keep no keyboard focus. Another app that wanted the same look would have to copy those inconsistencies
along with it.

## Solution

The kit's first release provides the twelve kinds of component Agent Shed already has a look for, each in one
standard form: button, search box, select, segmented control, card, badge, tooltip, drawer, confirm dialog,
toast, skeleton and tabs. Each keeps Agent Shed's look, keeps a variant only where Agent Shed uses that kind
for a really different purpose, and draws its inconsistencies — focus rings, floating shadows, radii — from
one set. Their behaviour for keyboard, focus and screen readers is Base UI's, and the parameters Agent Shed
set explicitly — where a toast appears and how long it stays, the scrim, where a tooltip sits — are kept.
Every component is shown in Storybook in every variant, size and state, in every theme and light/dark, and
the owner confirms its look there.

## Terms

- **Variant**: a form of a component chosen by the caller for a different purpose (a danger button, a pill
  tab). Agent Shed's other ways of writing the same thing are not variants; they fold into the standard form.
- **Wash**: the pale `--accent` ground of a hovered or selected item ([theming](theming.md) `theming::REQ-004`).
- **Floating surface**: a select popup, a tooltip, a toast, a drawer or a dialog.

## Functional Requirements

### components::REQ-001 Shared states

Applies to every interactive component in this spec.

- components::REQ-001/AC-01: Keyboard focus shows a 2px `--ring` outline. It sits 2px outside the element,
  except inside a container that clips its children (the segmented control), where it sits 2px inside.
  Pointer focus shows no outline.
- components::REQ-001/AC-02: A disabled control shows its muted look, does not react to hover, and cannot be
  activated by pointer or keyboard.
- components::REQ-001/AC-03: Select popups, drawers and dialogs use the `--popover` ground and a 1px
  `--border-strong` border; tooltips and toasts take their own grounds (components::REQ-008,
  components::REQ-011). Every floating surface casts the `--shadow-pop` shadow.
- components::REQ-001/AC-04: No component animates a colour change, so switching the theme or light/dark
  recolours every component at once ([theming](theming.md) `theming::REQ-003/AC-03`).

### components::REQ-002 Button

The standard form is Agent Shed's regular button: `--background` ground, 1px `--border-strong` border,
`--foreground` text; under the pointer, a `--primary` border and the wash.

| Variant | Look | Agent Shed source |
|---|---|---|
| `default` | The standard form above | `.cfg-btn` |
| `primary` | `--primary` fill, `--primary-foreground` text | none: added for apps that need a prominent main action |
| `danger` | `--destructive` fill and border, `--destructive-foreground` text | `.cfg-btn.danger` |
| `ghost` | No ground or border, `--muted-foreground` text; under the pointer, the wash and `--primary` text | `.sback` |
| `link` | Inline text underlined in `--border-strong`; under the pointer, `--foreground` text and an underline in the text colour | `.stat-link` |

| Size | Use | Agent Shed source |
|---|---|---|
| `default` | Buttons in forms, dialogs and toolbars | `.cfg-btn` |
| `sm` | Actions on a list row | `.ins` |
| `icon` | An icon-only button | `.drawer-close` |
| `icon-sm` | A small icon-only button on a row or inside a note | `.sact` |

- components::REQ-002/AC-01: Each variant renders as its row describes, at rest and under the pointer.
- components::REQ-002/AC-02: Each size renders at its step of the scale; the two icon sizes are square.
- components::REQ-002/AC-03: An icon-only button carries the accessible name the caller passes
  (components::CON-001); its icon is hidden from screen readers.

### components::REQ-003 Search box

One form: a text field with a leading search icon, a `--card` ground, a 1px `--input` border, and the
placeholder the caller passes. When focused, its border turns `--ring` and it shows no outline. It has no
clear button.

- components::REQ-003/AC-01: The search icon sits inside the field at the leading edge, and typed text starts
  after it.
- components::REQ-003/AC-02: Focusing the field turns its border `--ring`.

### components::REQ-004 Select

One form, after Agent Shed's language select.

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

### components::REQ-005 Segmented control

One form, after Agent Shed's settings control: segments side by side in a container with a 1px
`--border-strong` border that clips them; one segment is selected at a time.

| Size | Use | Agent Shed source |
|---|---|---|
| `default` | Settings and forms | `.seg.seg-field` |
| `sm` | Inline in toolbars and headers | `.seg` |

- components::REQ-005/AC-01: The selected segment shows the wash, `--accent-foreground` text and a heavier
  weight; the others show `--muted-foreground` text, and `--foreground` text on the `--background` ground
  under the pointer.
- components::REQ-005/AC-02: It is announced as a group of mutually exclusive options under the label the
  caller passes (components::CON-001), and arrow keys move between its segments.

### components::REQ-006 Card

| Variant | Look | Agent Shed source |
|---|---|---|
| `default` | `--card` ground, 1px `--border` border | `.card` |
| `selectable` | As `default`; under the pointer, a `--primary` border and the wash; when selected, also a 1px `--primary` ring and its label in `--primary` | `.theme-card`, `.tot-c` |
| `dashed` | `--background` ground, 1px dashed `--border-strong` border, `--muted-foreground` text — for empty states and notes | `.none`, `.stale-note`, `.settings-foot` |

- components::REQ-006/AC-01: Each variant renders as its row describes.
- components::REQ-006/AC-02: A `selectable` card is a button that reports whether it is pressed, and takes
  keyboard focus.

### components::REQ-007 Badge

A small label in one shape (Agent Shed's `.pill`), in these variants:

| Variant | Look | Agent Shed source |
|---|---|---|
| `neutral` | 1px `--border-strong` border, `--muted-foreground` text | `.pill.off`, `.pill.fork` |
| `dashed` | 1px dashed `--border-strong` border, `--muted-foreground` text | `.pill.ln` |
| `muted` | `--border` ground, `--muted-foreground` text | `.pill.glb` |
| `primary` | The wash, `--primary` text, heavier weight | `.pill.prj`, `.files .tag` |
| `primary-outline` | 1px `--primary` border, `--primary` text | `.pill.plg` |
| `success` | `--success` ground, `--success-foreground` text | `.pill.on` |
| `warning` | `--warning` ground, `--warning-foreground` text | `.pill.warn` |
| `note` | `--note` ground, `--note-foreground` text | `.pill.shadow` |
| `risk` | 1px dashed `--risk` border, `--risk-foreground` text | `.pill.forkq` |
| `count` | A rounded number in the wash, `--primary` text | `.cnt-b` |

- components::REQ-007/AC-01: Each variant renders as its row describes.
- components::REQ-007/AC-02: A badge can carry a leading icon before its text.

Agent Shed's side badges (Claude Code, Codex, Grok, Antigravity) are not badge variants: Agent Shed composes
them from a badge and the Agent Shed layer's colours ([theming](theming.md) `theming::REQ-005`).

### components::REQ-008 Tooltip

One form, after Agent Shed's dark tooltip: `--tooltip` ground, `--tooltip-foreground` text, no border, and
the text the caller passes, which may include a line in `--tooltip-warning`.

- components::REQ-008/AC-01: It opens when its trigger is hovered or receives keyboard focus, and closes when
  neither holds.
- components::REQ-008/AC-02: It sits 6px from its trigger on the side the caller chooses, below by default,
  and moves to the opposite side when there is not room.
- components::REQ-008/AC-03: Its text is the trigger's description for screen readers; the tooltip itself
  takes no focus and lets the pointer pass through it.

### components::REQ-009 Drawer

One form, after Agent Shed's file drawer: a panel along the right edge of the window, the full window
height, `min(720px, 80vw)` wide, with a header holding its title in `--primary` and an icon-only close
button at its top-right corner, over a scrim in `--overlay`.

- components::REQ-009/AC-01: Esc, a click on the scrim, and the close button each close it.
- components::REQ-009/AC-02: While open, keyboard focus moves into it and stays inside it, the page behind
  it does not scroll, and it is announced as a dialog under its title; on closing, focus returns to the
  element that opened it.
- components::REQ-009/AC-03: The close button carries the accessible name the caller passes
  (components::CON-001).

### components::REQ-010 Confirm dialog

One form, after Agent Shed's uninstall confirmation: a box centred near the top of the window over a scrim in
`--overlay`, with a title, a body the caller passes, and its buttons at the bottom right — cancel first, then
the confirming action.

- components::REQ-010/AC-01: The cancel button is a `default` button; the confirming action is a `danger`
  button when the caller marks the action destructive, and a `primary` button otherwise.
- components::REQ-010/AC-02: Esc and the cancel button cancel; a click on the scrim does nothing, so the
  choice is always made by a button.
- components::REQ-010/AC-03: On opening, keyboard focus moves to the cancel button and stays inside the
  dialog, and the dialog is announced under its title; on closing, focus returns to the element that opened it.
- components::REQ-010/AC-04: Activating the confirming action runs the caller's action and closes the dialog.

### components::REQ-011 Toast

Toasts appear at the bottom centre of the window, 18px above its bottom edge, stacked in a column 8px apart
with the newest at the bottom. Any code in the app can raise one.

| Variant | Look | Agent Shed source |
|---|---|---|
| `success` | `--success` ground, `--success-foreground` text and 1px border | `.toast.ok` |
| `error` | `--error` ground, `--error-foreground` text and 1px border | `.toast.err` |

- components::REQ-011/AC-01: With no pointer over it and the window in the foreground, a toast disappears
  3200ms after it appears.
- components::REQ-011/AC-02: A toast has no close button.
- components::REQ-011/AC-03: Screen readers announce a toast when it appears.

### components::REQ-012 Skeleton

A placeholder block in `--border` (`deep`: `--border-strong`) that pulses between 55% and full opacity over
1.6s, eased in and out, repeating.

- components::REQ-012/AC-01: When the system asks for reduced motion, the block does not pulse.
- components::REQ-012/AC-02: The block is hidden from screen readers and does not react to the pointer.

### components::REQ-013 Tabs

| Variant | Use | Look | Agent Shed source |
|---|---|---|---|
| `page` | Switching the sections of a page | Folder tabs above a 1px `--border` rule; the selected tab takes the `--background` ground and `--primary` text in a heavier weight and joins the panel below it; the others show `--muted-foreground` text, `--foreground` under the pointer | `.tab` |
| `pill` | Switching between categories of a list | Separate pill buttons on a `--card` ground with a 1px `--border-strong` border and `--muted-foreground` text; the selected one shows the wash, `--primary-strong` text and a `--primary` border; a tab can show a count after its label in a lighter tone | `.ptab` |

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
segmented control — is a required prop, so a missing one fails the type check. The app passes it from its
own dictionary.

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
| Segmented control | `toggle-group` |
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

- **A label longer than its control**: the labels of buttons, select triggers and options, segments, tabs and
  badges stay on one line and are cut with an ellipsis when the space runs out; the text of toasts,
  tooltips, dialogs and drawers wraps.
- **An icon-only button, a drawer or a segmented control without its text**: the type check fails
  (components::CON-001); nothing renders a fallback text.
- **A select whose options do not fit the window**: the popup scrolls inside its own height
  (components::REQ-004/AC-02).

## Implementation Decisions

Each decision carries its reason and the alternative it rejected (this repository keeps decisions in its
specs; see `AGENTS.md`).

- **One standard form per kind of component, with variants only where the purpose differs.** Most of Agent
  Shed's duplicates differ only by when they were written. Rejected: a variant for every way Agent Shed
  writes a component, which would carry those inconsistencies into every other app.
- **A filled `primary` button that Agent Shed does not have.** Other apps need a prominent main action; its
  text takes the card colour, as on Agent Shed's update dot. Rejected: only Agent Shed's outlined buttons.
- **Base UI's behaviour for keyboard, focus and screen readers, with Agent Shed's explicit parameters.** Agent
  Shed's dialogs and drawers lack Esc handling, focus containment and dialog semantics, and its toasts are
  not announced; Base UI provides them. Rejected: reproducing Agent Shed's current behaviour, which would
  mean writing code to switch Base UI's behaviour off.
- **The confirm dialog ignores clicks on the scrim.** A confirm dialog is closed by a choice, so a stray
  click beside it cannot dismiss the question. Rejected: Agent Shed's behaviour, where a click on the scrim
  cancels.
- **Starting from the Mira style.** It is shadcn/ui's style for dense interfaces and the closest to Agent
  Shed's size (its default button is 28px tall with 12px text, against Agent Shed's 28–30px controls with
  12.5px text). Rejected: Nova (32px, 14px text) and Vega (36px, 14px text), both further from Agent Shed.
- **The toast is shadcn/ui's `toast`, on Base UI.** Rejected: shadcn/ui's `sonner`, which depends on
  `next-themes` and would compete with the kit's ThemeProvider for the root element.
- **The drawer is shadcn/ui's `sheet`**, a panel from the side of the window. Rejected: shadcn/ui's `drawer`,
  which slides up from the bottom.
- **One floating shadow, `--shadow-pop`, for every floating surface.** Agent Shed has five shadows and a
  dialog with none. Rejected: carrying them over per surface.

## Out of Scope

- **Components beyond the twelve**: menus (such as Agent Shed's install-to popover), filter chips, the app
  rail, charts and sidebars.
- **A light tooltip and a CSS-only chart tooltip**: Agent Shed's other tooltip forms fold into the one
  tooltip.
- **A loading state on buttons, and a clear button in the search box**: Agent Shed has neither.
- **Right-to-left languages**: no app that uses the kit has one; the components are not checked mirrored.
  Supporting them later means reopening this decision and checking every component mirrored.
- **Showing a cut label in full on hover**: a caller that needs it wraps the control in a tooltip.
