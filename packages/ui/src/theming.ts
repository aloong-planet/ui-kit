// The rules for the document's root element (theming::REQ-003), in one place: the apply function writes them, and the
// ThemeProvider writes through the apply function (theming::REQ-007). Nothing here loads React
// (package::REQ-001/AC-02).

/** One of the kit's three palettes (theming::REQ-001). */
export type Theme = 'purple' | 'blue' | 'amber'

/** The light/dark preference (theming::REQ-002): `system` follows the system appearance. */
export type Mode = 'system' | 'light' | 'dark'

const themes: readonly string[] = ['purple', 'blue', 'amber'] satisfies Theme[]
const modes: readonly string[] = ['system', 'light', 'dark'] satisfies Mode[]

/** The media query whose match is the system appearance being dark. */
export const darkSchemeQuery = '(prefers-color-scheme: dark)'

/** The mode in force for `mode`: an unknown value is taken as `system`. */
export function knownMode(mode: Mode): Mode {
  return modes.includes(mode) ? mode : 'system'
}

/**
 * Writes `theme` and the effective light/dark of `mode` on the root element, resolving `system` against the
 * system appearance at the moment of the call. An unknown theme is taken as `purple` and an unknown mode as
 * `system`, so a value read from damaged storage still gives a working page.
 */
export function applyTheme(theme: Theme, mode: Mode): void {
  const root = document.documentElement
  const inForce = knownMode(mode)
  const dark = inForce === 'system' ? window.matchMedia(darkSchemeQuery).matches : inForce === 'dark'
  root.setAttribute('data-theme', themes.includes(theme) ? theme : 'purple')
  root.classList.toggle('dark', dark)
}
