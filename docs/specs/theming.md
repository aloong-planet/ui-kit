# Theming

> Related: [package](package.md), [components](components.md)

## Problem Statement

Every app that uses the kit needs the same looks — three themes, each in light and dark — and needs
light/dark either to follow the system appearance or to be locked by the user. Without the kit, each app
re-implements the token values, the switching rules and the handling of the first frame on its own.

## Solution

The kit defines the colour tokens for three themes × light/dark under shadcn/ui's token names, so the
components taken from shadcn/ui read them unchanged. The theme and the effective light/dark in force are
written onto the document root — inside React by a ThemeProvider, and before React starts by a synchronous
apply function. The app decides which theme and mode are in force, and stores that choice itself. An app
that needs colours of its own defines them on the same contract, in the app.

## Terms

- **Theme**: one of three palettes — `purple` (the default), `blue` (mist blue) and `amber` (amber brown).
  _Avoid_: colour scheme (in CSS, `prefers-color-scheme` means light/dark).
- **Mode**: the light/dark preference — `system`, `light` or `dark`. `system` is a policy, not a snapshot:
  while it is selected, light/dark follows the system appearance.
- **Effective light/dark**: `light` or `dark`, derived from the mode and the current system appearance. It is
  never stored.
- **Token**: a CSS custom property a component reads a colour or a size from. Components read only tokens.
- **General tokens**: the tokens every consumer gets from `@aloong-planet/ui/theme.css`.
- **App token**: a token an app defines for its own elements on the root contract (theming::REQ-009). The kit
  defines none.

## Functional Requirements

### theming::REQ-001 Three themes (direct acceptance)

The kit provides the themes `purple`, `blue` and `amber`, each with a light and a dark set of values for the
general tokens; `purple` is the default.

### theming::REQ-002 Mode

- theming::REQ-002/AC-01: With mode `system`, the effective light/dark follows the system appearance,
  including a change of the system appearance while the page is open, without a reload.
- theming::REQ-002/AC-02: With mode `light` or `dark`, the effective light/dark is that value whatever the
  system appearance, and a later change of the system appearance has no effect.
- theming::REQ-002/AC-03: Selecting `system` again after `light` or `dark` resumes following the system
  appearance from that moment.

### theming::REQ-003 Document root contract

The theme and the effective light/dark are written on the document's root element: the attribute
`data-theme` holds the theme, and the class `dark` is present exactly when the effective light/dark is
dark. The general tokens are defined for the root element as purple light, and overridden per
`data-theme` value and under `dark`.

- theming::REQ-003/AC-01: A root element without `data-theme` gets the purple values.
- theming::REQ-003/AC-02: With `dark` on the root element, every general token takes the dark value of the
  theme in force.
- theming::REQ-003/AC-03: Changing `data-theme` or `dark` recolours everything on the page at once, with no
  transition.

### theming::REQ-004 General tokens

The general tokens use shadcn/ui's token names for every token the kit reads. A colour shadcn/ui has no
token for is added the shadcn/ui way, as a `--<name>` / `--<name>-foreground` pair, or as a `-strong` step of
an existing token.

| Kit token | What it colours | First value from |
|---|---|---|
| `--background` | The page; the ground of regular buttons, select triggers and the selected page tab | `--bg` |
| `--foreground` | Body text | `--text` |
| `--card` | Cards | `--card` |
| `--card-foreground` | Text on cards | `--text` |
| `--popover` | Floating surfaces: select popups, drawers, dialogs | `--card` |
| `--popover-foreground` | Text on floating surfaces | `--text` |
| `--primary` | The brand colour: selected text, the primary button's fill | `--accent` |
| `--primary-foreground` | Text and icons on a `--primary` fill | `--card` |
| `--primary-strong` | The deeper brand text: the selected option's label, the selected pill tab | `--accent-deep` |
| `--muted` | Quiet grounds | `--bg` |
| `--muted-foreground` | Secondary text, placeholders, icons at rest | `--text-2` |
| `--accent` | The hover wash, and the wash of a selected segment, pill tab or badge | `--accent-soft` |
| `--accent-foreground` | Text on the `--accent` wash when selected | `--accent` |
| `--accent-strong` | The selected-row wash, one step deeper than hover | `--accent-soft-deep` |
| `--destructive` | The danger button's fill | `--danger-bg` |
| `--destructive-foreground` | Text on it | `--danger-fg` |
| `--border` | Dividers, card borders, skeleton blocks | `--line` |
| `--border-strong` | Borders of controls and floating surfaces | `--line-strong` |
| `--input` | Borders of text fields | `--line-strong` |
| `--ring` | The keyboard focus ring and a focused field's border | `--accent` |
| `--success` / `--success-foreground` | Success toasts and badges | `--ok-bg` / `--ok-fg` |
| `--warning` / `--warning-foreground` | Warning badges | `--warn-bg` / `--warn-fg` |
| `--error` / `--error-foreground` | Error toasts | `--err-bg` / `--err-fg` |
| `--note` / `--note-foreground` | Note badges | `--note-bg` / `--note-fg` |
| `--risk` / `--risk-foreground` | The dashed border and the text of a risk badge | `--risk-border` / `--risk-fg` |
| `--tooltip` / `--tooltip-foreground` | Tooltips, dark in every theme and in light and dark | `--tip-bg` / `--tip-fg` |
| `--tooltip-warning` | A warning line inside a tooltip | `--tip-warn` |
| `--overlay` | The scrim behind drawers and dialogs, the same in light and dark | `rgba(0, 0, 0, 0.35)` |
| `--shadow-pop` | The shadow of every floating surface | `--shadow-pop` |
| `--scrollbar-thumb` / `--scrollbar-thumb-hover` | The scrollbar thumb at rest and under the pointer, the same in every theme | theming::REQ-010/AC-04, theming::REQ-010/AC-05 |

> Pending: `@aloong-planet/ui/theme.css` does not yet define the token values. Their first values are copied
> from `src/renderer/src/theme.css` of the Agent Shed app (`aloong-planet/agentshed`, commit `14b6d5b`):
> each kit token takes, in every theme and in light and dark, the value of the source token in its row's
> last column. That column is removed together with this note.

`@aloong-planet/ui/theme.css` also maps each general token into Tailwind's theme, so that a consumer can use
it in utility classes (`bg-primary`, `text-muted-foreground`, `border-border-strong`).

- theming::REQ-004/AC-01: Every row of the table is defined for every theme and for light and dark.
- theming::REQ-004/AC-02: In a consumer, the utility classes of every general token (background, text and
  border colour) compile and render that token.

### theming::REQ-006 ThemeProvider

The ThemeProvider takes the theme and the mode as required props and writes them on the root element by
theming::REQ-003. It stores nothing (theming::CON-001).

- theming::REQ-006/AC-01: On mount, the root element reflects the props.
- theming::REQ-006/AC-02: When either prop changes, the root element reflects the new value.
- theming::REQ-006/AC-03: While the mode is `system`, a change of the system appearance updates `dark` on
  the root element; once the mode is `light` or `dark`, or the ThemeProvider unmounts, it no longer reacts
  to the system appearance.
- theming::REQ-006/AC-04: Given an unknown theme or mode, the ThemeProvider leaves the root element as it
  would for `purple` / `system`.

### theming::REQ-007 Synchronous apply function

`@aloong-planet/ui/apply-theme` exports a function that takes a theme and a mode and writes them on the root
element by theming::REQ-003, synchronously, resolving `system` against the system appearance at the moment
of the call. The ThemeProvider writes the root element through the same function, so the rules exist once.
It loads no React ([package](package.md) `package::REQ-001/AC-02`).

- theming::REQ-007/AC-01: Called before the first render — from an Electron preload script, or from a
  script in a page's `<head>` — it makes the first painted frame show the final theme and light/dark.
- theming::REQ-007/AC-02: For the same theme and mode, the function and the ThemeProvider leave the root
  element in the same state.
- theming::REQ-007/AC-03: Given an unknown theme or mode, the apply function leaves the root element as it
  would for `purple` / `system`, and does not throw.

### theming::REQ-008 Type and radius scale

`@aloong-planet/ui/theme.css` sets the one type and radius scale the components are drawn with: the
sans-serif stack `-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif`, the monospace stack
`ui-monospace, Menlo, monospace`, body text at 13px, and the radius scale derived from shadcn/ui's
`--radius`.

> Pending: `@aloong-planet/ui/theme.css` does not yet define the type steps and the radius steps. Their first
> values are the sizes the Agent Shed app uses most (at commit `14b6d5b`), and their final values are the
> ones the owner confirms on the Storybook stories ([components](components.md) `components::CON-002`),
> written into this requirement then.

- theming::REQ-008/AC-01: Kit components set their font family, font sizes and radii only from this scale.
- theming::REQ-008/AC-02: The scale's sans-serif and monospace stacks and its body text size are the ones
  this requirement lists.

### theming::REQ-009 App tokens

An app defines a token for its own elements on the same contract as the general tokens: a value for the root
element, a value per `data-theme` value where it changes with the theme, and a value under `dark` where it
changes with light/dark. It may map the token into Tailwind's theme the way `@aloong-planet/ui/theme.css`
does. The kit defines no app token.

- theming::REQ-009/AC-01: An app token declared this way changes with the theme and with light/dark exactly
  as the general tokens do, whether the root element was written by the ThemeProvider or by the apply
  function.

### theming::REQ-010 Scrollbars

`@aloong-planet/ui/theme.css` draws the scrollbar of every scrolling area on a page that imports it,
vertical and horizontal, in place of the platform's.

- theming::REQ-010/AC-01: The scrollbar is 6px wide (6px tall for a horizontal one), and its thumb has
  rounded ends (a 3px radius).
- theming::REQ-010/AC-02: There is no track: beside the thumb, and in the corner where a vertical and a
  horizontal scrollbar meet, the surface beneath shows through.
- theming::REQ-010/AC-03: The thumb shows whenever the area's content overflows, also while nothing
  scrolls; an area whose content fits shows no scrollbar.
- theming::REQ-010/AC-04: The thumb, `--scrollbar-thumb`, is a neutral grey that follows the effective
  light/dark and not the theme: in light, black at 25% opacity; in dark, white at 22%.
- theming::REQ-010/AC-05: Under the pointer the thumb darkens to `--scrollbar-thumb-hover`: in light, black at
  40%; in dark, white at 36%.
- theming::REQ-010/AC-06: The stylesheet sets neither the standard `scrollbar-width` nor `scrollbar-color` on
  any element that Chromium-based browsers style, since either makes them drop the drawn scrollbar.
- theming::REQ-010/AC-07: A browser without WebKit's scrollbar pseudo-elements (Firefox) draws its own thin
  scrollbar in the `--scrollbar-thumb` colour, at the width it chooses and with no hover shade.

## Constraints

### theming::CON-001 The kit stores nothing (direct acceptance)

Applies to: the ThemeProvider and the apply function. Neither reads nor writes any storage — browser
storage, cookies, files or settings. The app reads the preference, stores it, and passes it in.

### theming::CON-002 One ThemeProvider per document (direct acceptance)

Applies to: every consumer. A document has at most one ThemeProvider, since every ThemeProvider writes the
same root element.

## Failure modes and boundaries

- **An invalid theme or mode** (for example a value read from damaged storage): an unknown theme is treated
  as `purple` and an unknown mode as `system`, with no error, and the page renders normally
  (theming::REQ-006/AC-04, theming::REQ-007/AC-03).
- **The app renders before applying the theme**: the first frame shows the root defaults (purple, and
  light/dark from whatever the root carries), and the page changes once the ThemeProvider mounts. The kit
  cannot prevent this; calling the apply function before the first render does (theming::REQ-007).
- **Several windows**: each window's document has its own root element. When the preference changes in
  one window, the app passes the new value to the ThemeProvider of every other window; the kit does not
  synchronise windows.
- **An Electron app locks light/dark through `nativeTheme.themeSource`**: the system appearance the renderer
  sees follows that setting, so with mode `system` the kit follows the app's lock rather than the operating
  system's.
- **macOS's overlay scrollbars and its "Show scroll bars" setting**: neither changes the scrollbar the kit
  draws, which shows on overflow as theming::REQ-010/AC-03 says, with a mouse or a trackpad alike.
- **An element that sets the standard `scrollbar-width` or `scrollbar-color`**: Chromium-based browsers then
  ignore the kit's scrollbar rules for that element and draw the platform's scrollbar; the kit's stylesheet
  never does this (theming::REQ-010/AC-06), but an app's own CSS can.
- **A browser without WebKit's scrollbar pseudo-elements** (Firefox): see theming::REQ-010/AC-07.

## Implementation Decisions

Each decision carries its reason and the alternative it rejected (this repository keeps decisions in its
specs; see `AGENTS.md`).

- **Light/dark is a class on the root element.** A web page cannot override `prefers-color-scheme`, so
  locking light or dark in a browser needs a class; it is also the dark variant shadcn/ui's components
  are written against. Rejected: media queries alone, which can lock light or dark only inside Electron,
  through `nativeTheme`.
- **shadcn/ui's token names.** Components taken from shadcn/ui read them unchanged. Rejected: names of the
  kit's own, which would mean rewriting every shadcn/ui component's references.
- **The app stores the preference.** Each app already has its own settings store (an Electron app typically
  keeps its settings in a file owned by its main process), and keys owned by an app cannot collide with
  another app's or window's. Rejected: the kit storing it in browser storage, or the kit doing both.
- **One synchronous apply function behind both the ThemeProvider and the pre-render scripts.** The rules
  for the root element then exist once, so a change to them cannot miss an app's first-frame script.
  Rejected: each app writing its own first-frame script. An inline `<head>` script is not the route for an
  Electron app whose content security policy allows only `script-src 'self'`; such an app passes the
  preference from its main process and applies it in its preload script.
- **An app's own colours live in the app** (theming::REQ-009). The kit is shared by every app, and an app's
  domain colours — the badges of its own categories, the colours of its own data — mean nothing to the
  others. Rejected: a stylesheet in the kit holding one app's colours.
- **The kit draws the scrollbars** (theming::REQ-010). The owner's choice: every page that uses the kit gets
  the same slim scrollbar instead of the platform's, whose width, track and visibility vary by platform and
  by system setting. Rejected: leaving scrollbars to each app.

## Out of Scope

- **Themes beyond the three, and high-contrast variants.**
- **shadcn/ui's chart (`--chart-*`) and sidebar (`--sidebar-*`) tokens**: the first release has no chart or
  sidebar component.
- **Colours for content the kit does not render**, such as headings of rendered markdown.
- **A thumb that shows only while scrolling**, as macOS's overlay scrollbars do: a drawn scrollbar cannot
  hide on its own, and showing it on scroll would take a script on every scrolling area.
- **Native form controls in dark** (the platform's own pickers and inputs): the kit declares no
  `color-scheme`.
