// components::REQ-012 on the Skeleton, in a consumer of the kit. The owner confirms the Skeleton's look on these
// stories, switching the theme and light/dark with the toolbar (components::CON-002). Its stillness under reduced
// motion is checked in tests/components-skeleton.test.tsx, which emulates the system asking for it; a play function
// cannot.
import { Skeleton, type SkeletonProps } from '@aloong-planet/ui'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { computed } from './support/computed'

const meta = {
  title: 'Components/Skeleton',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

// The placeholder of a list row as an app draws one while it loads: a title line and a shorter line under it, each
// sized by the caller's classes
function Row({ variant }: Pick<SkeletonProps, 'variant'>) {
  return (
    <div className="flex w-72 flex-col gap-2">
      <Skeleton data-block="title" variant={variant} className="h-3.5 w-48" />
      <Skeleton data-block="line" variant={variant} className="h-3 w-full" />
    </div>
  )
}

// components::REQ-012/AC-02, AC-03 and AC-04 on one variant: each block is hidden from screen readers, lets the
// pointer through, pulses between 55% and full opacity over 1.6s eased in and out, repeating, on the ground given,
// with `rounded-sm` corners (5.25px) and the width and height its classes give it
async function checkBlocks(canvasElement: HTMLElement, ground: string) {
  const sizes = { title: { width: 192, height: 14 }, line: { width: 288, height: 12 } }
  for (const [name, size] of Object.entries(sizes)) {
    const block = canvasElement.querySelector<HTMLElement>(`[data-block="${name}"]`)
    if (!block) throw new Error(`no ${name} block`)
    const style = getComputedStyle(block)
    const rect = block.getBoundingClientRect()
    const [pulse] = block.getAnimations()
    const keyframes = pulse?.effect instanceof KeyframeEffect ? pulse.effect.getKeyframes() : []
    await expect({
      name,
      hidden: block.getAttribute('aria-hidden'),
      pointer: style.pointerEvents,
      animation: [style.animationDuration, style.animationTimingFunction, style.animationIterationCount],
      keyframes: keyframes.map(({ offset, opacity }) => [offset, opacity]),
      ground: style.backgroundColor,
      radius: style.borderTopLeftRadius,
      size: { width: rect.width, height: rect.height },
    }).toEqual({
      name,
      hidden: 'true',
      pointer: 'none',
      animation: ['1.6s', 'ease-in-out', 'infinite'],
      keyframes: [
        [0, '0.55'],
        [0.5, '1'],
        [1, '0.55'],
      ],
      ground,
      radius: '5.25px',
      size,
    })
  }
}

// The default block, in `--border`: a skeleton given no variant
export const Default: Story = {
  render: () => <Row />,
  play: async ({ canvasElement }) => {
    await checkBlocks(canvasElement, computed('color', 'var(--border)'))
  },
}

// The `deep` block, in `--border-strong`
export const Deep: Story = {
  render: () => <Row variant="deep" />,
  play: async ({ canvasElement }) => {
    await checkBlocks(canvasElement, computed('color', 'var(--border-strong)'))
  },
}
