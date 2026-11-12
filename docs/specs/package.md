# Package

> Related: [theming](theming.md), [components](components.md)

## Problem Statement

The owner's apps and web pages each hand-write their own components and CSS. The same control looks and
behaves differently from one to the next, and a fix made in one never reaches the others.

## Solution

One npm package, `@aloong-planet/ui`, carries the components and the theme stylesheet. Any app installs it
and compiles the styles with its own Tailwind CSS v4; moving to a newer package version brings it the same
components and themes every other consumer has. The kit belongs to no app in particular. Until an app adopts
it, the kit is developed and checked on its own, in Storybook (see [components](components.md)).

## Functional Requirements

### package::REQ-001 Entry points

The package exposes these entry points, and no others:

| Entry point | What it provides |
|---|---|
| `@aloong-planet/ui` | The React components and the ThemeProvider |
| `@aloong-planet/ui/apply-theme` | The synchronous theme apply function ([theming](theming.md) `theming::REQ-007`) |
| `@aloong-planet/ui/theme.css` | The theme stylesheet: the general tokens for every theme and light/dark, their Tailwind theme mapping, the type and radius scale, and the scrollbars |

- package::REQ-001/AC-01: Each entry point in the table resolves when imported from a consumer project.
- package::REQ-001/AC-02: A bundle that imports only `@aloong-planet/ui/apply-theme` contains no React
  code, so the function can run in an Electron preload script or a page's `<head>` before React loads.

### package::REQ-002 Consumer setup

A consumer styles the kit in two steps, both in its own Tailwind CSS v4 entry stylesheet: it imports
`@aloong-planet/ui/theme.css` after `tailwindcss`, and it registers the package's files as a Tailwind
source so that the class names inside the kit components are compiled.

- package::REQ-002/AC-01: In a consumer that has done both steps, every kit component renders with the kit's
  styles in every theme and light/dark.

## Constraints

### package::CON-001 Package name (direct acceptance)

Applies to: the package. Its name is `@aloong-planet/ui`.

### package::CON-002 React 19 (direct acceptance)

Applies to: every consumer. The package declares `react` and `react-dom` 19 as peer dependencies. Kit
components take `ref` as an ordinary prop, which React 18 does not pass to function components, so a
React 18 app cannot use the kit.

### package::CON-003 Styles are compiled by the consumer's Tailwind CSS v4 (direct acceptance)

Applies to: every consumer. The package ships no precompiled CSS for the components; their styles exist
only once the consumer's Tailwind CSS v4 compiles them (package::REQ-002). The supported browsers are
therefore those of Tailwind CSS v4: Chrome 111 and Safari 16.4 or later, per Tailwind's compatibility
documentation (secondary sources add Firefox 128, which that documentation was not seen to state).

### package::CON-004 Icons come from lucide-react (direct acceptance)

Applies to: every icon inside a kit component. Icons are taken from the `lucide-react` package, which is a
dependency of the kit, so a consumer does not install it itself.

## Failure modes and boundaries

- **A consumer on React 18**: the package manager reports the unmet peer dependency at install time
  (package::CON-002); the kit does not attempt to support React 18 at run time.
- **A consumer that skips registering the package as a Tailwind source**: the components render without
  the kit's styles and nothing reports an error. The two setup steps of package::REQ-002 are stated in the
  package README; Storybook uses the kit exactly as a consumer does ([components](components.md)
  `components::REQ-015/AC-03`), so wrong steps show there first.

## Implementation Decisions

Each decision carries its reason and the alternative it rejected (this repository keeps decisions in its
specs; see `AGENTS.md`).

- **Distributed as an npm package.** One source for every app, and an app syncs by moving to a newer
  version. Rejected: a shadcn registry that copies the source into each app — every copy then evolves on
  its own and each update must be merged by hand, app by app.
- **Styles compiled by the consumer's Tailwind CSS v4** (package::CON-003). The owner's choice; it lets a
  consumer adjust a kit component with its own Tailwind classes. Rejected: precompiled CSS shipped in the
  package, which would have let an app adopt the kit without Tailwind CSS.
- **React 19** (package::CON-002). shadcn/ui's component source is written for React 19 and is used as it
  is. Rejected: React 18, which would mean restoring `forwardRef` in every component that takes a ref, and
  repeating that on every component later taken from shadcn/ui.
- **Icons from the `lucide-react` package** (package::CON-004). shadcn/ui's components import it as they
  are. Rejected: copying each icon's SVG into the code by hand, which would mean rewriting the icon imports
  of every shadcn/ui component.

## Out of Scope

- **The publishing channel and versioning policy**: settled when the first app adopts the kit.
- **Adopting the kit in any app**: for now the kit is developed and checked on its own.
- **A build for consumers without Tailwind CSS v4**: rejected above.
- **Anything for a single app** — a token, an entry point, a variant or an option only one app uses: what
  only one app needs stays in that app ([theming](theming.md), Implementation Decisions).
