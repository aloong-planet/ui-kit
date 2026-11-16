// The Skeleton's stories (stories/components-skeleton.stories.tsx) with the system asking for reduced motion, which
// the browser is told through the Chrome DevTools Protocol, as it would read the setting of a user's system. Each story
// is rendered as Storybook renders it, inside the toolbar's ThemeProvider.
import { composeStories } from '@storybook/react-vite'
import { afterEach, expect, test } from 'vitest'
import { cdp } from 'vitest/browser'
import preview from '../.storybook/preview'
import * as stories from '../stories/components-skeleton.stories'
import { mount, unmount } from './support/mount'

const { Default, Deep } = composeStories(stories, preview)

afterEach(async () => {
  unmount()
  await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: '' }] })
})

// components::REQ-012/AC-01: when the system asks for reduced motion, no block pulses. The blocks are first seen
// pulsing in the same page, so the stillness comes from the setting and not from a pulse that never ran.
test('no block pulses when the system asks for reduced motion', async () => {
  const canvas = mount(
    <>
      <Default />
      <Deep />
    </>,
  )
  const blocks = [...canvas.querySelectorAll<HTMLElement>('[data-block]')]
  expect(blocks.length).toBe(4)
  expect(blocks.map((block) => block.getAnimations().length)).toEqual([1, 1, 1, 1])
  await cdp().send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)
  expect(blocks.map((block) => [block.getAnimations().length, getComputedStyle(block).animationName])).toEqual([
    [0, 'none'],
    [0, 'none'],
    [0, 'none'],
    [0, 'none'],
  ])
})
