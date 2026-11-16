// Renders a story for an interaction test (tests/components-*.test.tsx) into the page, as React renders an app, and
// removes it after the test: a test file that mounts with it calls `unmount` after each test.
import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
let mounted: { root: Root; container: HTMLElement } | undefined

export function mount(story: ReactElement): HTMLElement {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  act(() => root.render(story))
  mounted = { root, container }
  return container
}

export function unmount(): void {
  act(() => mounted?.root.unmount())
  mounted?.container.remove()
  mounted = undefined
}
