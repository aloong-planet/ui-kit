// `pnpm check:tokens`: checks the token blocks of theme.css against the root contract (theming::REQ-003), and fails
// listing every problem it finds.
// - theming::REQ-004/AC-01: every general token is defined for every theme and for light and dark. `:root` (purple
//   light) and `:root.dark` (purple dark) each declare every token; a theme's light and dark blocks declare the same
//   tokens, so a token that changes with the theme in one cannot fall back to purple in the other.
// - Every token declaration is a listed general token in one of those blocks, so a misspelt or misplaced one, which
//   would leave the real token on its purple value, is reported.
// - theming::REQ-010/AC-06: `scrollbar-width` and `scrollbar-color` appear only inside the Firefox-only block.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parse, type AtRule, type Node, type Rule } from 'postcss'

// The general tokens: the rows of the token table in docs/specs/theming.md (theming::REQ-004)
const tokens = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--primary-strong',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--accent-strong',
  '--destructive',
  '--destructive-foreground',
  '--border',
  '--border-strong',
  '--input',
  '--ring',
  '--success',
  '--success-foreground',
  '--warning',
  '--warning-foreground',
  '--error',
  '--error-foreground',
  '--note',
  '--note-foreground',
  '--risk',
  '--risk-foreground',
  '--tooltip',
  '--tooltip-foreground',
  '--tooltip-warning',
  '--overlay',
  '--shadow-pop',
  '--scrollbar-thumb',
  '--scrollbar-thumb-hover',
]

// purple is the root's own theme; the others override it
const rootBlocks = [':root', ':root.dark']
const themeBlocks = ['blue', 'amber'].map((theme) => [
  `:root[data-theme="${theme}"]`,
  `:root.dark[data-theme="${theme}"]`,
])
const blocks = [...rootBlocks, ...themeBlocks.flat()]
const firefoxOnly = 'not selector(::-webkit-scrollbar)'

const file = fileURLToPath(new URL('../src/theme.css', import.meta.url))
const sheet = parse(readFileSync(file, 'utf8'), { from: file })
const problems: string[] = []
const at = (node: Node) => `theme.css:${node.source?.start?.line ?? '?'}`
const isRule = (node: Node | undefined): node is Rule => node?.type === 'rule'
const isAtRule = (node: Node | undefined): node is AtRule => node?.type === 'atrule'

// The custom properties each block declares; a block written twice counts as one
const declared = new Map(blocks.map((block) => [block, new Set<string>()]))
sheet.walkDecls(/^--/, (decl) => {
  const parent = decl.parent
  if (isAtRule(parent) && parent.name === 'theme') return // the Tailwind mapping
  const block = isRule(parent) && parent.parent?.type === 'root' ? parent.selector : undefined
  const set = block === undefined ? undefined : declared.get(block)
  if (!set) problems.push(`${at(decl)}: ${decl.prop} is declared outside the token blocks (${blocks.join(', ')})`)
  else if (!tokens.includes(decl.prop)) problems.push(`${at(decl)}: ${decl.prop} in ${block} is not a general token`)
  else set.add(decl.prop)
})

for (const block of rootBlocks) {
  const missing = tokens.filter((token) => !declared.get(block)?.has(token))
  if (missing.length > 0) problems.push(`${block} does not declare ${missing.join(', ')}`)
}
for (const [light, dark] of themeBlocks) {
  const inLight = declared.get(light) ?? new Set()
  const inDark = declared.get(dark) ?? new Set()
  if (inLight.size === 0) problems.push(`${light} declares no token`)
  const onlyLight = [...inLight].filter((token) => !inDark.has(token))
  const onlyDark = [...inDark].filter((token) => !inLight.has(token))
  if (onlyLight.length > 0) problems.push(`${dark} does not declare ${onlyLight.join(', ')}, which ${light} declares`)
  if (onlyDark.length > 0) problems.push(`${light} does not declare ${onlyDark.join(', ')}, which ${dark} declares`)
}

sheet.walkDecls(/^scrollbar-(width|color)$/, (decl) => {
  let node: Node | undefined = decl.parent
  while (node && !(isAtRule(node) && node.name === 'supports' && node.params === firefoxOnly)) node = node.parent
  if (!node) problems.push(`${at(decl)}: ${decl.prop} outside the Firefox-only block (@supports ${firefoxOnly})`)
})

if (problems.length > 0) {
  for (const problem of problems) console.error(problem)
  process.exit(1)
}
console.log(
  `theme.css: ${tokens.length} general tokens in ${blocks.length} blocks; no standard scrollbar property outside ` +
    'the Firefox-only block',
)
