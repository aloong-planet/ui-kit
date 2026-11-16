# @aloong-planet/ui

React components and themes, built on shadcn/ui and styled by your own Tailwind CSS v4. Requires React 19.

## Setup

Both steps go in your app's Tailwind CSS v4 entry stylesheet:

1. Import the kit's theme stylesheet after Tailwind CSS: `@import "@aloong-planet/ui/theme.css";`.
2. Register the package's files as a Tailwind source, so that the class names inside the kit's components are
   compiled: `@source "../node_modules/@aloong-planet/ui/dist";` (the path is relative to the stylesheet).

```css
@import "tailwindcss";
@import "@aloong-planet/ui/theme.css";
@source "../node_modules/@aloong-planet/ui/dist";
```

Without the second step the components render unstyled, and nothing reports an error.

## Theme and light/dark

```tsx
import { ThemeProvider } from '@aloong-planet/ui'

root.render(
  <ThemeProvider theme={settings.theme} mode={settings.mode}>
    <App />
  </ThemeProvider>,
)
```

- `theme` is `purple` (the default), `blue` or `amber`.
- `mode` is `system`, `light` or `dark`. With `system`, light/dark follows the system appearance, also when it
  changes while the page is open.
- The kit stores nothing. Your app reads the preference from its own settings, stores it, and passes it in. An
  unknown value is taken as `purple` or `system`.
- Use one ThemeProvider per document: every ThemeProvider writes the same root element, where the theme is the
  `data-theme` attribute and light/dark is the class `dark`.

### Before the first frame

A page that renders before the ThemeProvider mounts first shows the root's defaults: purple, and light unless the root
already carries `dark`. To make the first frame show the final theme and light/dark, call the apply function before
anything renders: in an Electron preload script, or in a classic (not `type="module"`) script in the page's `<head>`,
bundled from this:

```ts
import { applyTheme } from '@aloong-planet/ui/apply-theme'

applyTheme(theme, mode)
```

It loads no React, and resolves `system` against the system appearance at the moment of the call. An Electron app
whose content security policy allows only `script-src 'self'` passes the preference from its main process and applies
it in its preload script.

## Toasts

Render the Toaster once, anywhere in your app's tree, with the label screen readers announce for the region the toasts
appear in. Then raise a toast from any code, inside React or outside it:

```tsx
import { toast, Toaster } from '@aloong-planet/ui'

root.render(
  <>
    <App />
    <Toaster aria-label={dict.notifications} />
  </>,
)

toast.success(dict.saved)
toast.error(dict.saveFailed)
```

- A toast leaves after 3200ms. It waits while the pointer is over the toasts, while keyboard focus is on them, and
  while the window is in the background.
- A toast raised before the Toaster has mounted, at startup for instance, is held and appears when the Toaster mounts.
  If no Toaster ever mounts, it is never shown.
- Use one Toaster per document: every Toaster shows every toast raised.

## Tokens

`theme.css` defines the general colour tokens under shadcn/ui's names (`--background`, `--primary`,
`--muted-foreground`, …) for every theme and light/dark, and maps each into Tailwind's theme, so that utilities such
as `bg-primary`, `text-muted-foreground`, `border-border-strong` and `shadow-pop` follow the theme. It also colours the
page itself: the body's background is `--background` and its text `--foreground`. Switching the theme or light/dark
recolours the page at once.

## Type and radius scale

`theme.css` sets the scale the components are drawn with, under the names of Tailwind's own utilities: `font-sans`
and `font-mono`, the type steps `text-xs` (11px), `text-sm` (12.5px), `text-base` (13px, the body text) and `text-lg`
(15px), and the radius steps `rounded-sm` to `rounded-xl`, derived from `--radius`. It also sets the page's body text
in `font-sans` at `text-base`. Your app's own utilities of these names take the kit's values too, so your elements
match the components; Tailwind's other steps (`text-xl` and up; `rounded`, `rounded-xs`, `rounded-2xl` and up) keep
Tailwind's values.

## App tokens

Colours that only your app needs stay in your app. Declare them on the same root element, in your own stylesheet:
a value for the root, a value per theme where the colour changes with the theme, and a value under `dark` for each.

```css
:root { --tag: #ede9fe; }
:root[data-theme="blue"] { --tag: #e0f2fe; }
:root[data-theme="amber"] { --tag: #fef3c7; }
:root.dark { --tag: #3b2f52; }
:root.dark[data-theme="blue"] { --tag: #1e3a4c; }
:root.dark[data-theme="amber"] { --tag: #4a3a1a; }

/* optional, in your Tailwind entry stylesheet: a `bg-tag` utility that follows the theme */
@theme inline reference { --color-tag: var(--tag); }
```

Write a theme's dark value on `:root.dark[data-theme="…"]`: it outranks both `:root.dark` and
`:root[data-theme="…"]`, whatever the order of the rules.

## Scrollbars

`theme.css` draws a slim scrollbar for every scrolling area, in place of the platform's. Do not set the standard
`scrollbar-width` or `scrollbar-color` on an element: Chromium-based browsers then drop the kit's scrollbar for that
element and draw the platform's.
