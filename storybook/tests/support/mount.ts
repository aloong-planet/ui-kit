// Renders a story for an interaction test (tests/components-*.test.tsx) into the page, as React renders an app, and
// removes it after the test: a test file that mounts with it calls `unmount` after each test. `rerender` renders it
// again with other props.
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

// Renders `story` again in place of the one mounted, as an app's next render passes new props
export function rerender(story: ReactElement): void {
  if (!mounted) throw new Error('nothing mounted')
  const { root } = mounted
  act(() => root.render(story))
}

export function unmount(): void {
  act(() => mounted?.root.unmount())
  mounted?.container.remove()
  mounted = undefined
}
