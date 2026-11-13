// theming::REQ-001, REQ-002, REQ-006, REQ-007 and CON-001: the apply function and the ThemeProvider, as they write
// the document's root element (theming::REQ-003). The system appearance is changed for real, through the browser's
// colour-scheme emulation, so the page's own `prefers-color-scheme` media queries fire as they would on a change in
// the operating system.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { commands } from 'vitest/browser'
import { ThemeProvider } from '../src'
import { applyTheme, type Mode, type Theme } from '../src/apply-theme'

declare module 'vitest/browser' {
  interface BrowserCommands {
    setColorScheme: (scheme: 'light' | 'dark') => Promise<void>
  }
}

const root = document.documentElement

// What the root element shows of the theme and the effective light/dark (theming::REQ-003)
function rootState(): { theme: string | null; dark: boolean } {
  return { theme: root.getAttribute('data-theme'), dark: root.classList.contains('dark') }
}

// Changes the system appearance and returns once the page has seen the change: a media query list created now is
// notified after every one created earlier (the ThemeProvider's among them), so once it has fired, theirs have too.
async function setSystemAppearance(scheme: 'light' | 'dark'): Promise<void> {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  if (query.matches === (scheme === 'dark')) return
  const changed = new Promise((resolve) => query.addEventListener('change', resolve, { once: true }))
  await commands.setColorScheme(scheme)
  await changed
}

// Renders the ThemeProvider into a container of its own, as an app does; `render` again changes its props
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let mounted: Root | undefined

function render(theme: Theme, mode: Mode): void {
  mounted ??= createRoot(document.body.appendChild(document.createElement('div')))
  const app = mounted
  act(() => app.render(<ThemeProvider theme={theme} mode={mode} />))
}

function unmount(): void {
  const app = mounted
  mounted = undefined
  if (app) act(() => app.unmount())
}

beforeEach(async () => {
  await setSystemAppearance('light')
})

afterEach(() => {
  unmount()
  document.body.replaceChildren()
  root.removeAttribute('data-theme')
  root.removeAttribute('class')
})

test.each(['purple', 'blue', 'amber'] as const)('the %s theme is written as the root data-theme', (theme) => {
  applyTheme(theme, 'light')
  expect(rootState()).toEqual({ theme, dark: false })
})

test('with mode system, the root follows a change of the system appearance while the page is open', async () => {
  render('blue', 'system')
  expect(rootState()).toEqual({ theme: 'blue', dark: false })
  await setSystemAppearance('dark')
  expect(rootState()).toEqual({ theme: 'blue', dark: true })
  await setSystemAppearance('light')
  expect(rootState()).toEqual({ theme: 'blue', dark: false })
})

// The system appearance moves toward the locked value and then away from it: a ThemeProvider that followed the system
// would show the system's value after the second move
test.each([
  { mode: 'light', dark: false },
  { mode: 'dark', dark: true },
] as const)(
  'with mode $mode, the root shows it from mount on, whatever the system appearance does',
  async ({ mode, dark }) => {
    const away = dark ? 'light' : 'dark'
    await setSystemAppearance(away)
    render('amber', mode)
    expect(rootState()).toEqual({ theme: 'amber', dark })
    await setSystemAppearance(dark ? 'dark' : 'light')
    expect(rootState()).toEqual({ theme: 'amber', dark })
    await setSystemAppearance(away)
    expect(rootState()).toEqual({ theme: 'amber', dark })
  },
)

test('selecting system again after light resumes following the system appearance from that moment', async () => {
  await setSystemAppearance('dark')
  render('purple', 'light')
  expect(rootState()).toEqual({ theme: 'purple', dark: false })
  render('purple', 'system')
  expect(rootState()).toEqual({ theme: 'purple', dark: true })
  await setSystemAppearance('light')
  expect(rootState()).toEqual({ theme: 'purple', dark: false })
})

test('when either prop changes, the root reflects the new value', () => {
  render('amber', 'dark')
  render('blue', 'dark')
  expect(rootState()).toEqual({ theme: 'blue', dark: true })
  render('blue', 'light')
  expect(rootState()).toEqual({ theme: 'blue', dark: false })
})

test.each([
  { mode: 'light', dark: false },
  { mode: 'dark', dark: true },
] as const)(
  'after the mode leaves system for $mode, a change of the system appearance no longer reaches the root',
  async ({ mode, dark }) => {
    await setSystemAppearance(dark ? 'dark' : 'light')
    render('blue', 'system')
    render('blue', mode)
    await setSystemAppearance(dark ? 'light' : 'dark')
    expect(rootState()).toEqual({ theme: 'blue', dark })
  },
)

test('after the ThemeProvider unmounts, a change of the system appearance no longer reaches the root', async () => {
  render('blue', 'system')
  unmount()
  await setSystemAppearance('dark')
  expect(rootState()).toEqual({ theme: 'blue', dark: false })
})

// An unknown or missing theme or mode, as read from damaged storage or from settings without the key: the types cannot
// rule them out. `dark` is what the root shows for the mode: locked, or `system` when the mode falls back to it.
const unknownValues = [
  { theme: 'teal', mode: 'light', expectedTheme: 'purple', dark: false },
  { theme: undefined, mode: 'dark', expectedTheme: 'purple', dark: true },
  { theme: null, mode: 'light', expectedTheme: 'purple', dark: false },
  { theme: 'blue', mode: 'dim', expectedTheme: 'blue', dark: 'system' },
  { theme: 'blue', mode: undefined, expectedTheme: 'blue', dark: 'system' },
  { theme: 'amber', mode: null, expectedTheme: 'amber', dark: 'system' },
] as const

// The root for one of those values while the system appearance is `system`
const fallbackRoot = (
  { expectedTheme, dark }: (typeof unknownValues)[number],
  system: 'light' | 'dark',
): { theme: string; dark: boolean } => ({ theme: expectedTheme, dark: dark === 'system' ? system === 'dark' : dark })

test.each(unknownValues)(
  'the ThemeProvider given theme $theme and mode $mode leaves the root as for purple / system',
  async (value) => {
    await setSystemAppearance('dark')
    render(value.theme as Theme, value.mode as Mode)
    expect(rootState()).toEqual(fallbackRoot(value, 'dark'))
    // as for `system`, a mode that falls back goes on following the system appearance; a locked one does not
    await setSystemAppearance('light')
    expect(rootState()).toEqual(fallbackRoot(value, 'light'))
    await setSystemAppearance('dark')
    expect(rootState()).toEqual(fallbackRoot(value, 'dark'))
  },
)

test.each(unknownValues)(
  'the apply function given theme $theme and mode $mode does not throw and leaves the root as for purple / system',
  async (value) => {
    await setSystemAppearance('dark')
    expect(() => applyTheme(value.theme as Theme, value.mode as Mode)).not.toThrow()
    expect(rootState()).toEqual(fallbackRoot(value, 'dark'))
  },
)

const themes = ['purple', 'blue', 'amber'] as const
const modes = ['system', 'light', 'dark'] as const

// Every attribute of the root element, so that anything one of the two writes and the other does not shows
function rootAttributes(): Record<string, string | null> {
  return Object.fromEntries(root.getAttributeNames().map((name) => [name, root.getAttribute(name)]))
}

test.each(themes.flatMap((theme) => modes.map((mode) => ({ theme, mode }))))(
  'the apply function and the ThemeProvider leave the same root for theme $theme and mode $mode',
  async ({ theme, mode }) => {
    await setSystemAppearance('dark')
    applyTheme(theme, mode)
    const byFunction = rootAttributes()
    root.removeAttribute('data-theme')
    root.removeAttribute('class')
    render(theme, mode)
    expect(rootAttributes()).toEqual(byFunction)
  },
)

const noStorage =
  "neither the ThemeProvider nor the apply function touches browser storage, cookies or the origin's files"

test(noStorage, async () => {
  // The entrances to them: the getter of each store, so that a method call and a named item (`localStorage.theme`)
  // are both seen; both cookie APIs; and `navigator.storage`, which leads to the origin's private file system
  const spies = [
    ...(['localStorage', 'sessionStorage', 'indexedDB', 'caches', 'cookieStore'] as const).map((store) =>
      vi.spyOn(window, store, 'get'),
    ),
    vi.spyOn(Document.prototype, 'cookie', 'get'),
    vi.spyOn(Document.prototype, 'cookie', 'set'),
    vi.spyOn(Navigator.prototype, 'storage', 'get'),
  ]
  try {
    for (const theme of themes) for (const mode of modes) applyTheme(theme, mode)
    render('blue', 'system')
    await setSystemAppearance('dark')
    render('amber', 'light')
    unmount()
    for (const spy of spies) expect(spy).not.toHaveBeenCalled()
  } finally {
    for (const spy of spies) spy.mockRestore()
  }
})
