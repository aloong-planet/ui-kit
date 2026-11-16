// theming::REQ-008 in a consumer of the kit: the type and radius scale the components are drawn with. `Scale` is the
// sheet on which the owner confirms the steps.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'

const meta = {
  title: 'Theming/Scale',
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

// Each step's utility, written out in full so that Tailwind finds and compiles it
const typeSteps = [
  { utility: 'text-xs', use: 'Badges, counts, small segments, small buttons' },
  { utility: 'text-sm', use: 'Buttons, search box, select, tabs, toasts' },
  { utility: 'text-base', use: 'Body text' },
  { utility: 'text-lg', use: 'Drawer and dialog titles' },
]
const radiusSteps = ['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl']

const sample = 'The quick brown fox 敏捷的狐狸 0123456789'

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <table className="border-separate border-spacing-x-4 border-spacing-y-2">
        <tbody>
          {typeSteps.map(({ utility, use }) => (
            <tr key={utility}>
              <td>
                <code className="font-mono text-xs text-muted-foreground">{utility}</code>
              </td>
              <td data-step={utility} className={utility}>
                {sample}
              </td>
              <td className="text-xs text-muted-foreground">{use}</td>
            </tr>
          ))}
          <tr>
            <td>
              <code className="font-mono text-xs text-muted-foreground">font-mono</code>
            </td>
            <td data-step="font-mono" className="font-mono">
              {sample}
            </td>
            <td className="text-xs text-muted-foreground">Code, paths, commands</td>
          </tr>
        </tbody>
      </table>
      <div className="flex gap-4">
        {radiusSteps.map((utility) => (
          <div key={utility} className="flex flex-col items-center gap-1">
            <div data-step={utility} className={`size-16 border border-border-strong bg-card ${utility}`} />
            <code className="font-mono text-xs text-muted-foreground">{utility}</code>
          </div>
        ))}
      </div>
    </div>
  ),
  // theming::REQ-008/AC-02: the page's body text and a monospace element take the stacks and the body text size the
  // requirement lists. theming::REQ-008/AC-03: each step's utility renders the value the requirement's table lists.
  play: async ({ canvasElement }) => {
    const step = (name: string) => {
      const element = canvasElement.querySelector(`[data-step="${name}"]`)
      if (!element) throw new Error(`no sample of ${name}`)
      return getComputedStyle(element)
    }
    const body = getComputedStyle(document.body)
    await expect(body.fontFamily).toBe('-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif')
    await expect(body.fontSize).toBe('13px')
    await expect(step('font-mono').fontFamily).toBe('ui-monospace, Menlo, monospace')
    const sizes = { 'text-xs': '11px', 'text-sm': '12.5px', 'text-base': '13px', 'text-lg': '15px' }
    for (const [name, size] of Object.entries(sizes))
      await expect({ name, size: step(name).fontSize }).toEqual({ name, size })
    const radii = { 'rounded-sm': '5.25px', 'rounded-md': '7px', 'rounded-lg': '8.75px', 'rounded-xl': '12.25px' }
    for (const [name, radius] of Object.entries(radii))
      await expect({ name, radius: step(name).borderTopLeftRadius }).toEqual({ name, radius })
  },
}
