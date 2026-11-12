# Theming

> Related: [package](package.md), [components](components.md)

## Problem Statement

Every app that uses the kit needs the same looks — Agent Shed's three themes, each in light and dark — and
needs light/dark either to follow the system appearance or to be locked by the user. Today each app would
have to re-implement the token values, the switching rules and the handling of the first frame on its own.

## Solution

The kit defines the colour tokens for three themes × light/dark under shadcn/ui's token names, so the
components taken from shadcn/ui read them unchanged. The theme and the effective light/dark in force are
written onto the document root — inside React by a ThemeProvider, and before React starts by a synchronous
apply function. The app decides which theme and mode are in force, and stores that choice itself.

## Terms

- **Theme**: one of three palettes — `purple` (the default), `blue` (mist blue) and `amber` (amber brown).
  _Avoid_: colour scheme (in CSS, `prefers-color-scheme` means light/dark).
- **Mode**: the light/dark preference — `system`, `light` or `dark`. `system` is a policy, not a snapshot:
  while it is selected, light/dark follows the system appearance.
- **Effective light/dark**: `light` or `dark`, derived from the mode and the current system appearance. It is
  never stored.
- **Token**: a CSS custom property a component reads a colour or a size from. Components read only tokens.
- **General tokens**: the tokens every consumer gets from `@aloong-planet/ui/theme.css`.
- **Agent Shed layer**: the tokens only Agent Shed uses, in `@aloong-planet/ui/agentshed.css`.

## Functional Requirements

### theming::REQ-001 Three themes

The kit provides the themes `purple`, `blue` and `amber`, each with a light and a dark set of values for the
general tokens. The values are Agent Shed's, taken from `src/renderer/src/theme.css` of
`aloong-planet/agentshed` at commit `14b6d5b` (2026-11-12) and mapped onto the kit's token names by the
table in theming::REQ-004.

- theming::REQ-001/AC-01: For each of the six combinations of theme and effective light/dark, every general
  token resolves to the Agent Shed value its row in theming::REQ-004 names.

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

The general tokens use shadcn/ui's token names for every token the kit's components read. A colour shadcn/ui
has no token for is added the shadcn/ui way, as a `--<name>` / `--<name>-foreground` pair, or as a
`-strong` step of an existing token. Each takes its value from the Agent Shed token in the second column, in
every theme and in light and dark.

| Kit token | Agent Shed source | What it colours |
|---|---|---|
| `--background` | `--bg` | The page; the ground of regular buttons, select triggers and the selected page tab |
| `--foreground` | `--text` | Body text |
| `--card` | `--card` | Cards |
| `--card-foreground` | `--text` | Text on cards |
| `--popover` | `--card` | Floating surfaces: select popups, drawers, dialogs |
| `--popover-foreground` | `--text` | Text on floating surfaces |
| `--primary` | `--accent` | The brand colour: selected text, the primary button's fill |
| `--primary-foreground` | `--card` | Text and icons on a `--primary` fill |
| `--primary-strong` | `--accent-deep` | The deeper brand text: the selected option's label, the selected pill tab |
| `--muted` | `--bg` | Quiet grounds |
| `--muted-foreground` | `--text-2` | Secondary text, placeholders, icons at rest |
| `--accent` | `--accent-soft` | The hover wash, and the wash of a selected segment, pill tab or badge |
| `--accent-foreground` | `--accent` | Text on the `--accent` wash when selected |
| `--accent-strong` | `--accent-soft-deep` | The selected-row wash, one step deeper than hover |
| `--destructive` | `--danger-bg` | The danger button's fill |
| `--destructive-foreground` | `--danger-fg` | Text on it |
| `--border` | `--line` | Dividers, card borders, skeleton blocks |
| `--border-strong` | `--line-strong` | Borders of controls and floating surfaces |
| `--input` | `--line-strong` | Borders of text fields |
| `--ring` | `--accent` | The keyboard focus ring and a focused field's border |
| `--success` / `--success-foreground` | `--ok-bg` / `--ok-fg` | Success toasts and badges |
| `--warning` / `--warning-foreground` | `--warn-bg` / `--warn-fg` | Warning badges |
| `--error` / `--error-foreground` | `--err-bg` / `--err-fg` | Error toasts |
| `--note` / `--note-foreground` | `--note-bg` / `--note-fg` | Note badges |
| `--risk` / `--risk-foreground` | `--risk-border` / `--risk-fg` | The dashed border and the text of a risk badge |
| `--tooltip` / `--tooltip-foreground` | `--tip-bg` / `--tip-fg` | Tooltips, dark in every theme and in light and dark |
| `--tooltip-warning` | `--tip-warn` | A warning line inside a tooltip |
| `--overlay` | `rgba(0, 0, 0, 0.35)`, the scrim colour Agent Shed writes inline | The scrim behind drawers and dialogs, the same in light and dark |
| `--shadow-pop` | `--shadow-pop` | The shadow of every floating surface |

`@aloong-planet/ui/theme.css` also maps each general token into Tailwind's theme, so that a consumer can use
it in utility classes (`bg-primary`, `text-muted-foreground`, `border-border-strong`).

- theming::REQ-004/AC-01: Every row of the table is defined for every theme and for light and dark.
- theming::REQ-004/AC-02: In a consumer, the utility classes of every general token (background, text and
  border colour) compile and render that token.

### theming::REQ-005 Agent Shed layer

`@aloong-planet/ui/agentshed.css` defines the colours only Agent Shed uses, under descriptive names. Each takes
its value from the Agent Shed token in the second column. They differ between light and dark and, except
`--markdown-h3`, do not change with the theme; `--markdown-h3` has a value per theme like the general tokens.

| Kit token | Agent Shed source | What it colours |
|---|---|---|
| `--side-claude` / `--side-claude-foreground` | `--cl-bg` / `--cl-fg` | The Claude Code side badge |
| `--side-codex` / `--side-codex-foreground` | `--cx-bg` / `--cx-fg` | The Codex side badge |
| `--side-grok` / `--side-grok-foreground` | `--gk-bg` / `--gk-fg` | The Grok side badge |
| `--side-antigravity` / `--side-antigravity-foreground` | `--ag-bg` / `--ag-fg` | The Antigravity side badge |
| `--provider-anthropic` | `--p-anthropic` | Anthropic's provider colour |
| `--provider-openai` | `--p-openai` | OpenAI's provider colour |
| `--provider-google` | `--p-google` | Google's provider colour |
| `--provider-xai` | `--p-xai` | xAI's provider colour |
| `--provider-other` | `--p-other` | Any other provider |
| `--usage-cache-read` | `--tc-rd` | The cache-read part of the token composition bar |
| `--usage-input` | `--tc-in` | The uncached-input part |
| `--usage-output` | `--tc-ou` | The output part |
| `--markdown-h3` | `--md-h3` | The third-level heading of rendered markdown |
| `--scrollbar-thumb` / `--scrollbar-thumb-hover` | `--scroll-thumb` / `--scroll-thumb-hover` | The scrollbar thumb at rest and under the pointer |

`@aloong-planet/ui/agentshed.css` maps these into Tailwind's theme the same way `theme.css` does
(`bg-side-claude`, `text-provider-openai`). No kit component reads them; Agent Shed composes its own
elements from them.

- theming::REQ-005/AC-01: With `@aloong-planet/ui/agentshed.css` imported, every row of the table is defined
  for light and dark (and, for `--markdown-h3`, for every theme), and its utility classes compile.

### theming::REQ-008 Type and radius scale

`@aloong-planet/ui/theme.css` sets the type and radius scale the components are drawn with, distilled from
Agent Shed into one scale: the sans-serif stack `-apple-system, 'PingFang SC', 'Microsoft YaHei',
sans-serif`, the monospace stack `ui-monospace, Menlo, monospace`, body text at 13px, and the radius
scale derived from shadcn/ui's `--radius`.

> Pending: `@aloong-planet/ui/theme.css` does not yet define the type steps and the radius steps. Their values
> are the ones the owner confirms on the Storybook stories ([components](components.md)
> `components::CON-002`), and are written into this requirement then.

- theming::REQ-008/AC-01: Kit components set their font family, font sizes and radii only from this scale.

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
- **Electron locks light/dark through `nativeTheme.themeSource`**: the system appearance the renderer sees
  follows that setting, so with mode `system` the kit follows the app's lock rather than the operating
  system's.

## Implementation Decisions

Each decision carries its reason and the alternative it rejected (this repository keeps decisions in its
specs; see `AGENTS.md`).

- **Light/dark is a class on the root element.** A web page cannot override `prefers-color-scheme`, so
  locking light or dark in a browser needs a class; it is also the dark variant shadcn/ui's components
  are written against. Rejected: media queries alone, as in Agent Shed, which can lock only inside Electron.
- **shadcn/ui's token names.** Components taken from shadcn/ui read them unchanged. Rejected: Agent Shed's
  names, which would mean rewriting every shadcn/ui component's references — and Agent Shed's `--accent`
  (the brand colour) means what shadcn/ui calls `--primary`, while shadcn/ui's `--accent` is the hover wash.
- **The app stores the preference.** Each app already has its own settings store (Agent Shed keeps its
  preferences in a file owned by the main process), and keys owned by the app cannot collide between apps
  or windows. Rejected: the kit storing it in browser storage, or the kit doing both.
- **One synchronous apply function behind both the ThemeProvider and the pre-render scripts.** The rules
  for the root element then exist once, so a change to them cannot miss an app's first-frame script.
  Rejected: each app writing its own first-frame script. An inline `<head>` script is not the route for
  Electron apps whose content security policy allows only `script-src 'self'`, as Agent Shed's packaged
  build does; they pass the preference from the main process and apply it in the preload script.
- **Agent Shed's own colours are in the kit, as a separate layer.** The owner's choice; the separate entry
  keeps them out of every other app. Rejected: leaving them in Agent Shed; putting them among the general
  tokens.
- **The Agent Shed layer's tokens have descriptive names.** The owner's choice; a name says what it colours
  to someone who does not know Agent Shed. Rejected: Agent Shed's own abbreviations (`--cl-bg`, `--p-xai`,
  `--tc-rd`), which would have left Agent Shed's references to them unchanged on adoption.

## Out of Scope

- **Storing the preference**: the app's job (theming::CON-001).
- **Themes beyond the three, and high-contrast variants.**
- **shadcn/ui's chart (`--chart-*`) and sidebar (`--sidebar-*`) tokens**: the first release has no chart or
  sidebar component.
