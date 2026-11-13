// The ThemeProvider (theming::REQ-006): writes the theme and the mode it is given on the root element, through the
// apply function, and while the mode is `system` follows the system appearance. It stores nothing
// (theming::CON-001): the app owns the preference and passes it in.
import { useLayoutEffect, type ReactNode } from 'react'
import { applyTheme, darkSchemeQuery, knownMode, type Mode, type Theme } from './theming'

export interface ThemeProviderProps {
  theme: Theme
  mode: Mode
  children?: ReactNode
}

/** Keeps the document's root element on `theme` and `mode`. A document has at most one (theming::CON-002). */
export function ThemeProvider({ theme, mode, children }: ThemeProviderProps): ReactNode {
  // A layout effect runs before the browser paints, so the first frame after mounting already shows the props
  useLayoutEffect(() => {
    applyTheme(theme, mode)
    if (knownMode(mode) !== 'system') return
    const system = window.matchMedia(darkSchemeQuery)
    const follow = () => applyTheme(theme, mode)
    system.addEventListener('change', follow)
    return () => system.removeEventListener('change', follow)
  }, [theme, mode])
  return children
}
