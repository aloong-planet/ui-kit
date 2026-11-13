// `pnpm check:tokens`: checks the token blocks of theme.css against the root contract (theming::REQ-003), and the
// component source against the tokens and the scale, and fails listing every problem it finds.
// theme.css:
// - theming::REQ-004/AC-01: every general token is defined for every theme and for light and dark. `:root` (purple
//   light) and `:root.dark` (purple dark) each declare every token; a theme's light and dark blocks declare the same
//   tokens, so a token that changes with the theme in one cannot fall back to purple in the other.
// - Every token declaration is a listed general token in one of those blocks, or `--radius` in `:root`, so a misspelt
//   or misplaced one, which would leave the real token on its purple value, is reported.
// - theming::REQ-010/AC-06: `scrollbar-width` and `scrollbar-color` appear only inside the Firefox-only block.
// The component source, every file under src/components: each class in it is judged by the CSS Tailwind compiles it
// to with this stylesheet, so it is caught whatever form it is written in; the strings it writes, its imports, its
// style objects and the colour attributes of its elements are read too.
// - components::CON-004: no colour literal, no colour of Tailwind's own theme, no named colour or general token
//   changed by a modifier, and no branch on the theme or on light/dark (a selector or condition on `.dark`,
//   `data-theme` or `prefers-color-scheme`, the class `dark` or `dataset.theme` in script, the theming modules).
// - components::REQ-001/AC-04: no transition of a colour property or of `all`.
// - theming::REQ-008/AC-01: font families, font sizes and radii only from the scale theme.css defines.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, type AtRule, type Node, type Rule } from 'postcss'
import { __unstable__loadDesignSystem } from 'tailwindcss'
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

// Tailwind's design system with the kit's stylesheet, as a consumer compiles it. A class of the component source is
// judged by the CSS Tailwind turns it into, so it is caught whatever form it is written in: a utility, an arbitrary
// value or property, any variant.
const tailwindDir = join(dirname(fileURLToPath(import.meta.resolve('tailwindcss'))), '..')
const designSystem = await __unstable__loadDesignSystem(
  `${readFileSync(join(tailwindDir, 'index.css'), 'utf8')}\n${readFileSync(file, 'utf8')}`,
  { base: tailwindDir },
)

type Declaration = { prop: string; value: string; context: string[] }

// The declarations of some CSS, each with the selectors and at-rule conditions it sits under; `@property`
// registrations are Tailwind's own and are left out
function declarations(css: string): Declaration[] {
  const found: Declaration[] = []
  parse(css).walkDecls((decl) => {
    const context: string[] = []
    for (let node: Node | undefined = decl.parent; node && node.type !== 'root'; node = node.parent) {
      if (isAtRule(node) && node.name === 'property') return
      context.push(isRule(node) ? node.selector : isAtRule(node) ? `@${node.name} ${node.params}` : '')
    }
    found.push({ prop: decl.prop, value: decl.value, context })
  })
  return found
}

// The values the scale's own classes compile to, which are the only ones a component may set
function valuesOf(classes: string[], prop: RegExp): Set<string> {
  const css = designSystem.candidatesToCss(classes).join('\n')
  return new Set(declarations(css).filter((decl) => prop.test(decl.prop)).map((decl) => decl.value))
}
const fontSizes = valuesOf([...themeNames.text].map((step) => `text-${step}`), /^font-size$/)
const fontFamilies = valuesOf([...themeNames.font].map((step) => `font-${step}`), /^font-family$/)
const radii = valuesOf(
  [...[...themeNames.radius].map((step) => `rounded-${step}`), 'rounded-none', 'rounded-full'],
  /radius$/,
)
const scaleList = (prefix: string, names: Set<string>, extra: string[] = []) =>
  [...[...names].map((name) => `${prefix}-${name}`), ...extra].join(', ')

const colourLiteral = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i
const themeBranch = /\.dark\b|data-theme|prefers-color-scheme/
const colourProperty = /(^|-)colou?r$|^(fill|stroke|background)$/
const colourKeyword = /^(transparent|currentcolor|inherit|initial|unset|revert|none)$/i
const colourTransition =
  /\b(all|color|background(-color)?|border(-[a-z]+)*-color|outline-color|text-decoration-color|fill|stroke|caret-color|accent-color|box-shadow|text-shadow|column-rule-color|scrollbar-color)\b|--tw-gradient/
const themingModule = /(^|\/)(theming|apply-theme|theme-provider)$/

// What is wrong with one declaration a component sets, if anything
function declarationProblems({ prop, value, context }: Declaration): string[] {
  const found: string[] = []
  if (context.some((condition) => themeBranch.test(condition))) found.push('branches on the theme or on light/dark')
  if (colourLiteral.test(value)) found.push(`sets ${prop} to a colour literal, ${value}`)
  for (const [, name] of value.matchAll(/var\(--color-([a-z0-9-]+)/g))
    if (!themeNames.color.has(name)) found.push(`sets ${prop} to --color-${name}, a colour of Tailwind's theme`)
  if (colourProperty.test(prop) && !/^var\(/.test(value) && !colourKeyword.test(value) && !colourLiteral.test(value))
    found.push(`sets ${prop} to ${value}, which is not a general token`)
  if (prop === 'font-size' && !fontSizes.has(value))
    found.push(`sets a font size off the scale (${scaleList('text', themeNames.text)})`)
  if ((prop === 'font-family' && !fontFamilies.has(value)) || prop === 'font')
    found.push(`sets a font family off the scale (${scaleList('font', themeNames.font)})`)
  if (/radius$/.test(prop) && !radii.has(value))
    found.push(`sets a radius off the scale (${scaleList('rounded', themeNames.radius, ['rounded-none', 'rounded-full'])})`)
  if ((prop === 'transition-property' || prop === 'transition') && colourTransition.test(value))
    found.push(`transitions colours (${value})`)
  return found
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
const literalText = (node: ts.Expression | undefined): string | undefined =>
  node && (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) ? node.text : undefined

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
    // An import of the theming modules, whose only use in a component would be to branch on the theme
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      const specifier = (node.moduleSpecifier as ts.StringLiteral).text
      if (themingModule.test(specifier)) report(node, `imports ${specifier}, a branch on the theme or on light/dark`)
      return
    }
    // A string: a colour literal, a branch on the theme or on light/dark in script (`data-theme`, the media query,
    // the class `dark`), and each class in it, by the CSS Tailwind compiles it to
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const text = node.text
      const words = text.split(/\s+/).filter(Boolean)
      if (colourLiteral.test(text)) report(node, `"${text}" writes a colour literal`)
      if (/data-theme|prefers-color-scheme/.test(text) || words.includes('dark'))
        report(node, `"${text}" branches on the theme or on light/dark`)
      const compiled = designSystem.candidatesToCss(words)
      words.forEach((word, i) => {
        const css = compiled[i]
        if (css) for (const decl of declarations(css)) for (const problem of declarationProblems(decl)) report(node, `\`${word}\` ${problem}`)
      })
    }
    // `dataset.theme` read in script
    if (ts.isPropertyAccessExpression(node) && node.name.text === 'theme' && /\bdataset$/.test(node.expression.getText(source)))
      report(node, 'reads dataset.theme, a branch on the theme')
    // A style object: an object given to a `style` attribute or under a `style` key
    const styleObject =
      node.parent &&
      ts.isObjectLiteralExpression(node.parent) &&
      ((ts.isJsxExpression(node.parent.parent) &&
        ts.isJsxAttribute(node.parent.parent.parent) &&
        node.parent.parent.parent.name.getText(source) === 'style') ||
        (ts.isPropertyAssignment(node.parent.parent) && node.parent.parent.name.getText(source) === 'style'))
    if (styleObject && ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))) {
      const prop = kebab(node.name.text)
      const value = literalText(node.initializer)
      if (value === undefined) {
        if (/^(font-size|font-family|font|transition|transition-property)$|radius$/.test(prop) || colourProperty.test(prop))
          report(node, `the style \`${node.name.text}\` takes a value that cannot be checked against the tokens and the scale`)
      } else
        for (const problem of declarationProblems({ prop, value, context: [] }))
          report(node, `the style \`${node.name.text}\` ${problem}`)
    }
    // A colour written as an attribute of an element (`fill`, `stroke`, `color`, `stopColor` …)
    if (ts.isJsxAttribute(node) && node.initializer) {
      const prop = kebab(node.name.getText(source))
      const initializer = node.initializer
      const value = ts.isStringLiteral(initializer)
        ? initializer.text
        : ts.isJsxExpression(initializer)
          ? literalText(initializer.expression)
          : undefined
      if (value !== undefined && colourProperty.test(prop))
        for (const problem of declarationProblems({ prop, value, context: [] }))
          report(node, `the attribute \`${node.name.getText(source)}\` ${problem}`)
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
    `(${scaleList('text', themeNames.text)}; ${scaleList('rounded', themeNames.radius)}; ` +
    `${scaleList('font', themeNames.font)}), with no colour transition and no branch on the theme or light/dark`,
)
