// `pnpm check:tokens`: checks the token blocks of theme.css against the root contract (theming::REQ-003), and the
// component source against the tokens and the scale, and fails listing every problem it finds.
// theme.css:
// - theming::REQ-004/AC-01: every general token is defined for every theme and for light and dark. `:root` (purple
//   light) and `:root.dark` (purple dark) each declare every token; a theme's light and dark blocks declare the same
//   tokens, so a token that changes with the theme in one cannot fall back to purple in the other.
// - Every token declaration is a listed general token in one of those blocks, or `--radius` in `:root`, so a misspelt
//   or misplaced one, which would leave the real token on its purple value, is reported.
// - theming::REQ-010/AC-06: `scrollbar-width` and `scrollbar-color` appear only inside the Firefox-only block.
// The component source, every file under src/components (its class names, the other strings it writes, its imports
// and the object literals it passes as styles):
// - components::CON-004: no colour literal (a hex colour, a colour function, a colour of Tailwind's palette, an
//   arbitrary colour value, a general token with an opacity modifier, a colour property written as a style), and no
//   branch on the theme or on light/dark (the `dark:` variant, `data-theme`, `prefers-color-scheme`, the theming
//   modules).
// - components::REQ-001/AC-04: no colour transition (`transition`, `transition-all`, `transition-colors`,
//   `transition-shadow`, a colour property or `all` in an arbitrary or a style transition).
// - theming::REQ-008/AC-01: font families, font sizes and radii only from the scale theme.css defines.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, type AtRule, type Node, type Rule } from 'postcss'
import ts from 'typescript'

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

// The base of the radius steps (theming::REQ-008), declared once in `:root`
const scaleBase = '--radius'

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
// What the `@theme` blocks define: the colour each general token maps to, and the steps of the scale
const themeNames = { color: new Set<string>(), text: new Set<string>(), radius: new Set<string>(), font: new Set<string>() }
sheet.walkDecls(/^--/, (decl) => {
  const parent = decl.parent
  if (isAtRule(parent) && parent.name === 'theme') {
    const match = /^--(color|text|radius|font)-([a-z0-9-]+?)(--.*)?$/.exec(decl.prop)
    if (match && !match[3]) themeNames[match[1] as keyof typeof themeNames].add(match[2])
    return
  }
  const block = isRule(parent) && parent.parent?.type === 'root' ? parent.selector : undefined
  const set = block === undefined ? undefined : declared.get(block)
  if (decl.prop === scaleBase) {
    if (block !== ':root') problems.push(`${at(decl)}: ${scaleBase} is declared outside :root`)
    return
  }
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
let rootDeclaresBase = false
sheet.walkRules(':root', (rule) => rule.walkDecls(scaleBase, () => void (rootDeclaresBase = true)))
if (!rootDeclaresBase) problems.push(`:root does not declare ${scaleBase}`)

sheet.walkDecls(/^scrollbar-(width|color)$/, (decl) => {
  let node: Node | undefined = decl.parent
  while (node && !(isAtRule(node) && node.name === 'supports' && node.params === firefoxOnly)) node = node.parent
  if (!node) problems.push(`${at(decl)}: ${decl.prop} outside the Firefox-only block (@supports ${firefoxOnly})`)
})

// ---- The component source ----

const colourPrefix =
  /^(bg|text|border(?:-[xytrblse])?|outline|ring|ring-offset|inset-ring|decoration|divide|fill|stroke|accent|caret|shadow|inset-shadow|drop-shadow|placeholder|from|via|to)-(.+)$/
const palette =
  /^(?:(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe)-\d{2,3}|black|white)$/
const tailwindTextSizes = new Set(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'])
const fontWeights = new Set(['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'])
const tailwindFonts = new Set(['sans', 'serif', 'mono'])
const radiusSide = '(?:-(?:t|r|b|l|s|e|tl|tr|br|bl|ss|se|es|ee))?'
const radiusUtility = new RegExp(`^rounded${radiusSide}(?:-(.+))?$`)
const colourProperty =
  /\b(all|color|background(-color)?|border(-[a-z]+)?-color|border|outline(-color)?|text-decoration(-color)?|fill|stroke|caret-color|accent-color|box-shadow|shadow)\b/
const colourTransitions = new Set(['transition', 'transition-all', 'transition-colors', 'transition-shadow'])
const colourLiteral = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i
const themeBranchString = /data-theme|prefers-color-scheme/
const themingModule = /(^|\/)(theming|apply-theme|theme-provider)$/
const styleScaleProperties = /^(fontSize|font-size|fontFamily|font-family|font|borderRadius|border(-[a-z]+)?-radius|border[A-Z][a-zA-Z]*Radius)$/
const styleTransitionProperties = /^(transition|transitionProperty|transition-property)$/
const styleColourProperties =
  /^(color|background|backgroundColor|background-color|border(-[a-z]+)?-color|border[A-Z][a-zA-Z]*Color|borderColor|outline|outlineColor|outline-color|fill|stroke|boxShadow|box-shadow|textDecorationColor|text-decoration-color|caretColor|caret-color|accentColor|accent-color)$/

// Splits a class at its top-level colons into its variants and its utility
function splitClass(name: string): { variants: string[]; utility: string } {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < name.length; i++) {
    const c = name[i]
    if (c === '[' || c === '(') depth++
    else if (c === ']' || c === ')') depth--
    else if (c === ':' && depth === 0) {
      parts.push(name.slice(start, i))
      start = i + 1
    }
  }
  const utility = name.slice(start).replace(/^!|!$/g, '').replace(/^-/, '')
  return { variants: parts, utility }
}

// Splits a utility's value at a top-level slash into the value and its modifier
function splitModifier(value: string): { base: string; modifier?: string } {
  let depth = 0
  for (let i = 0; i < value.length; i++) {
    const c = value[i]
    if (c === '[' || c === '(') depth++
    else if (c === ']' || c === ')') depth--
    else if (c === '/' && depth === 0) return { base: value.slice(0, i), modifier: value.slice(i + 1) }
  }
  return { base: value }
}

const isArbitrary = (value: string) => value.startsWith('[') || value.startsWith('(')
const isLength = (value: string) => /^[[(](length:)?-?\d+(\.\d+)?(px|rem|em)?[\])]$/.test(value)

// What is wrong with one class of the component source, if anything
function classProblems(name: string): string[] {
  const found: string[] = []
  const { variants, utility } = splitClass(name)
  if (variants.some((variant) => variant === 'dark' || /\.dark\b|theme/.test(variant)))
    found.push(`\`${name}\` branches on the theme or on light/dark`)

  if (colourTransitions.has(utility)) found.push(`\`${name}\` transitions colours`)
  const transition = /^transition-([[(].*)$/.exec(utility)
  if (transition && colourProperty.test(transition[1])) found.push(`\`${name}\` transitions colours`)

  const radius = radiusUtility.exec(utility)
  if (radius) {
    const step = radius[1]
    if (step === undefined || !(themeNames.radius.has(step) || step === 'none' || step === 'full'))
      found.push(`\`${name}\` is a radius off the scale (${[...themeNames.radius].join(', ')}, none, full)`)
  }

  const font = /^font-(.+)$/.exec(utility)
  if (font) {
    const value = font[1]
    const weight = /^[[(]\d+[\])]$/.test(value) || fontWeights.has(value)
    if (!weight && (isArbitrary(value) || (tailwindFonts.has(value) && !themeNames.font.has(value))))
      found.push(`\`${name}\` is a font family off the scale (${[...themeNames.font].join(', ')})`)
  }

  const colour = colourPrefix.exec(utility)
  if (colour) {
    const [, prefix, value] = colour
    if (isArbitrary(value)) {
      if (prefix === 'text' && !colourLiteral.test(value) && !/^[[(](color:|var\()/.test(value))
        found.push(`\`${name}\` is a font size off the scale (${[...themeNames.text].join(', ')})`)
      else if (!(isLength(value) && prefix !== 'text' && prefix !== 'bg'))
        found.push(`\`${name}\` is a colour that is not a general token`)
    } else {
      const { base, modifier } = splitModifier(value)
      if (themeNames.color.has(base)) {
        if (modifier !== undefined) found.push(`\`${name}\` changes a general token's colour with a modifier`)
      } else if (palette.test(base)) found.push(`\`${name}\` is a colour of Tailwind's palette, not a general token`)
      else if (prefix === 'text' && tailwindTextSizes.has(base) && !themeNames.text.has(base))
        found.push(`\`${name}\` is a font size off the scale (${[...themeNames.text].join(', ')})`)
    }
  }
  return found
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

const componentsDir = fileURLToPath(new URL('../src/components', import.meta.url))
const componentFiles = sourceFiles(componentsDir)
for (const path of componentFiles) {
  const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const where = (node: ts.Node) =>
    `${path.slice(path.indexOf('src/components'))}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`
  const report = (node: ts.Node, problem: string) => problems.push(`${where(node)}: ${problem}`)

  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      const specifier = (node.moduleSpecifier as ts.StringLiteral).text
      if (themingModule.test(specifier)) report(node, `imports ${specifier}, a branch on the theme or on light/dark`)
      return
    }
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const text = node.text
      if (colourLiteral.test(text)) report(node, `"${text}" writes a colour literal`)
      if (themeBranchString.test(text)) report(node, `"${text}" branches on the theme or on light/dark`)
      for (const name of text.split(/\s+/).filter(Boolean)) for (const problem of classProblems(name)) report(node, problem)
    }
    // A property of a style object: an object given to a `style` attribute or under a `style` key
    const styleObject =
      node.parent &&
      ts.isObjectLiteralExpression(node.parent) &&
      ((ts.isJsxExpression(node.parent.parent) &&
        ts.isJsxAttribute(node.parent.parent.parent) &&
        node.parent.parent.parent.name.getText(source) === 'style') ||
        (ts.isPropertyAssignment(node.parent.parent) && node.parent.parent.name.getText(source) === 'style'))
    if (styleObject && ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) {
      const key = node.name.text
      const value = ts.isStringLiteralLike(node.initializer) ? node.initializer.text : undefined
      if (styleScaleProperties.test(key)) report(node, `the style \`${key}\` sets a font or a radius off the scale`)
      if (styleTransitionProperties.test(key) && (value === undefined || colourProperty.test(value)))
        report(node, `the style \`${key}\` may transition colours`)
      if (styleColourProperties.test(key) && !(value !== undefined && /^var\(--[a-z-]+\)$/.test(value)))
        report(node, `the style \`${key}\` writes a colour that is not a general token`)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem)
  process.exit(1)
}
console.log(
  `theme.css: ${tokens.length} general tokens in ${blocks.length} blocks; no standard scrollbar property outside ` +
    'the Firefox-only block',
)
console.log(
  `src/components: ${componentFiles.length} file(s) use only general tokens and the scale ` +
    `(text-${[...themeNames.text].join('/')}, rounded-${[...themeNames.radius].join('/')}, ` +
    `font-${[...themeNames.font].join('/')}), with no colour transition and no theme branch`,
)
