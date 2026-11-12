// The synchronous theme apply function (package::REQ-001, theming::REQ-007). It loads no React
// (package::REQ-001/AC-02), so it can run in an Electron preload script or in a script in a page's <head> before
// anything renders.
export { applyTheme, type Mode, type Theme } from './theming'
