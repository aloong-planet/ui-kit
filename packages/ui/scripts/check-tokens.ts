// `pnpm check:tokens`: checks the token blocks of theme.css against the root contract (theming::REQ-003) and their
// Tailwind mapping, and the component source against the tokens and the scale, and fails listing every problem it
// finds. The general tokens are read from the token table of theming::REQ-004 in docs/specs/theming.md.
// theme.css:
// - theming::REQ-004/AC-01: every general token is defined for every theme and for light and dark. `:root` (purple
//   light) and `:root.dark` (purple dark) each declare every token; a theme's light and dark blocks declare the same
//   tokens, so a token that changes with the theme in one cannot fall back to purple in the other.
// - Every token declaration is a general token of the table in one of those blocks, or `--radius` in `:root`, so a
//   misspelt or misplaced one, which would leave the real token on its purple value, is reported.
// - theming::REQ-004/AC-02: every general token has its entry in Tailwind's theme, set to the token itself
//   (`--color-<name>`, or `--shadow-pop` for the shadow), so its utilities compile to it.
// - theming::REQ-010/AC-06: `scrollbar-width` and `scrollbar-color` appear only inside the Firefox-only block.
// The component source, every file under src/components: each class in it is judged by the CSS Tailwind compiles it
// to with this stylesheet, so it is caught whatever form it is written in; the strings it writes, its imports, its
// style objects and the colour attributes of its elements are read too.
// - components::CON-004: in any declaration, no colour literal, no named or system colour, no colour of Tailwind's own
//   theme, no general token changed by a modifier, and no variable but a general token, one of Tailwind's own or, in a
//   width or a height, one of the lengths Base UI sets on a popup's positioner (a colour property set to anything else
//   is reported too); and no branch on the theme or on light/dark (a selector or condition on `.dark`, `data-theme` or
//   `prefers-color-scheme`, the class `dark` or `dataset.theme` in script, the theming modules).
// - components::REQ-001/AC-04: no transition of a colour property or of `all`.
// - theming::REQ-008/AC-01: font families, font sizes and radii only from the scale theme.css defines.
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, type AtRule, type Node, type Rule } from 'postcss'
import { __unstable__loadDesignSystem } from 'tailwindcss'
import ts from 'typescript'

// The general tokens: the Kit token column of the token table under theming::REQ-004 in docs/specs/theming.md, one
// or more tokens to a row. The check reads the spec itself, so a row added to the table is checked like the others.
const specFile = fileURLToPath(new URL('../../../docs/specs/theming.md', import.meta.url))
const tokens = tableTokens(readFileSync(specFile, 'utf8').split(/\r?\n/))

// A table the check cannot read as the token table stops it at once: read any other way, it would check fewer tokens
// than the spec lists, and pass
function stopAt(line: number, problem: string): never {
  console.error(`docs/specs/theming.md:${line}: ${problem}`)
  process.exit(1)
}

function tableTokens(lines: string[]): string[] {
  const heading = lines.findIndex((line) => line.startsWith('### theming::REQ-004 '))
  if (heading === -1) stopAt(1, 'cannot find the token table: no heading "### theming::REQ-004 …"')
  const next = lines.findIndex((line, i) => i > heading && /^#{1,3} /.test(line))
  const end = next === -1 ? lines.length : next
  let first = heading + 1
  while (first < end && !lines[first].startsWith('|')) first++
  if (first === end) stopAt(heading + 1, 'cannot find the token table under this heading')
  let last = first
  while (last < end && lines[last].startsWith('|')) last++
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((cell) => cell.trim())
  const column = cells(lines[first]).indexOf('Kit token')
  if (column === -1) stopAt(first + 1, 'the token table has no "Kit token" column')
  if (first + 1 === last || !cells(lines[first + 1]).every((cell) => /^:?-+:?$/.test(cell)))
    stopAt(first + 2, 'the token table has no delimiter row under its header')
  const found: string[] = []
  for (let i = first + 2; i < last; i++) {
    const cell = cells(lines[i])[column] ?? ''
    if (!/^`--[a-z0-9-]+`( \/ `--[a-z0-9-]+`)*$/.test(cell))
      stopAt(i + 1, `the Kit token cell "${cell}" is not one or more \`--name\` joined by " / "`)
    for (const [, token] of cell.matchAll(/`(--[a-z0-9-]+)`/g)) {
      if (found.includes(token)) stopAt(i + 1, `${token} is in the token table twice`)
      found.push(token)
    }
  }
  if (found.length === 0) stopAt(first + 1, 'the token table has no rows')
  return found
}

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
// The colour and shadow entries of the `@theme` blocks, each with every place it is set
const mapping = new Map<string, { value: string; node: Node }[]>()
sheet.walkDecls(/^--/, (decl) => {
  const parent = decl.parent
  if (isAtRule(parent) && parent.name === 'theme') {
    const match = /^--(color|text|radius|font)-([a-z0-9-]+?)(--.*)?$/.exec(decl.prop)
    if (match && !match[3]) themeNames[match[1] as keyof typeof themeNames].add(match[2])
    if (/^--(color|shadow)-/.test(decl.prop))
      mapping.set(decl.prop, [...(mapping.get(decl.prop) ?? []), { value: decl.value, node: decl }])
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
// theming::REQ-004/AC-02: each general token has its entry in Tailwind's theme, set to the token itself, so that its
// utilities compile to it: `--color-<name>` for a colour, and the shadow token under its own name
for (const token of tokens) {
  const entry = token.startsWith('--shadow-') ? token : `--color-${token.slice('--'.length)}`
  const entries = mapping.get(entry) ?? []
  if (entries.length === 0) problems.push(`${token} has no entry in Tailwind's theme (${entry}: var(${token}) in @theme)`)
  for (const { value, node } of entries)
    if (value.replace(/\s+/g, '') !== `var(${token})`) problems.push(`${at(node)}: ${entry} is ${value}, not var(${token})`)
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
const radii = valuesOf([...themeNames.radius].map((step) => `rounded-${step}`), /radius$/)
const scaleList = (prefix: string, names: Set<string>) => [...names].map((name) => `${prefix}-${name}`).join(', ')
// The variables of Tailwind's theme, the kit's `@theme` blocks among them, each with its value
const themeValues = new Map([...designSystem.theme.entries()].map(([name, { value }]) => [name, value]))

const colourLiteral = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i
// The colours CSS names (CSS Color 4: the named colours, the system colours and the deprecated system colours).
// `transparent` and `currentcolor` name no colour of the page's own and are allowed.
const namedColours = new Set(
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood
  cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray
  darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
  darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue
  firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew
  hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray
  lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue
  mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred
  midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple
  rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue
  slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow
  yellowgreen
  accentcolor accentcolortext activetext buttonborder buttonface buttontext canvas canvastext field fieldtext graytext
  highlight highlighttext linktext mark marktext selecteditem selecteditemtext visitedtext
  activeborder activecaption appworkspace background buttonhighlight buttonshadow captiontext inactiveborder
  inactivecaption inactivecaptiontext infobackground infotext menu menutext scrollbar threeddarkshadow threedface
  threedhighlight threedlightshadow threedshadow window windowframe windowtext`.split(/\s+/),
)
// The named colours a value writes, outside its strings and URLs; a name inside a longer identifier, such as the
// variable `--tw-red`, is not one
const coloursNamedIn = (value: string) =>
  [...value.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|url\([^)]*\)/gi, '').matchAll(/(?<![\w-])[a-z]+(?![\w(-])/gi)]
    .map(([word]) => word)
    .filter((word) => namedColours.has(word.toLowerCase()))
const themeBranch = /\.dark\b|data-theme|prefers-color-scheme/
const colourProperty = /(^|-)colou?r$|^(fill|stroke|background)$/
const colourKeyword = /^(transparent|currentcolor|inherit|initial|unset|revert|none)$/i
const colourTransition =
  /\b(all|color|background(-color)?|border(-[a-z]+)*-color|outline-color|text-decoration-color|fill|stroke|caret-color|accent-color|box-shadow|text-shadow|column-rule-color|scrollbar-color)\b|--tw-gradient/
const themingModule = /(^|\/)(theming|apply-theme|theme-provider)$/
// The lengths Base UI sets on a popup's positioner, which size the popup by its anchor and by the space the window
// leaves it (components::REQ-004/AC-02, AC-07); the size properties may read them
const positionerLengths = new Set(['--anchor-width', '--available-width', '--available-height'])
const sizeProperty = /^(min-|max-)?(width|height)$/
// The lengths Base UI sets on a toast while it is swiped, which move the toast with the pointer
// (components::REQ-011/AC-07); the translate utilities may read them
const swipeLengths = new Set(['--toast-swipe-movement-x', '--toast-swipe-movement-y'])
const translateProperty = /^--tw-translate-[xy]$/

// What is wrong with one declaration a component sets, if anything
function declarationProblems({ prop, value, context }: Declaration): string[] {
  const found: string[] = []
  if (context.some((condition) => themeBranch.test(condition))) found.push('branches on the theme or on light/dark')
  if (colourLiteral.test(value)) found.push(`sets ${prop} to a colour literal, ${value}`)
  const named = coloursNamedIn(value)
  if (named.length > 0) found.push(`sets ${prop} to a named colour, ${named.join(', ')}`)
  // A variable is a general token, or one of Tailwind's own: its utilities' `--tw-*` and the variables of its theme.
  // Any other is read without knowing what it holds, so it fails whatever the property.
  for (const [, name] of value.matchAll(/var\((--[\w-]+)/g)) {
    const themeValue = themeValues.get(name)
    if (name.startsWith('--color-')) {
      if (!themeNames.color.has(name.slice('--color-'.length)))
        found.push(`sets ${prop} to ${name}, a colour of Tailwind's theme`)
    } else if (tokens.includes(name) || name === scaleBase || name.startsWith('--tw-')) {
      // a general token, the base of the radius steps, or a variable of a Tailwind utility
    } else if (positionerLengths.has(name) && sizeProperty.test(prop)) {
      // a length Base UI sets on a popup's positioner, sizing the popup
    } else if (swipeLengths.has(name) && translateProperty.test(prop)) {
      // a length Base UI sets on a toast while it is swiped, moving the toast
    } else if (themeValue === undefined)
      found.push(`sets ${prop} to ${name}, which is neither a general token nor a variable of Tailwind's`)
    else if (colourLiteral.test(themeValue) || coloursNamedIn(themeValue).length > 0)
      found.push(`sets ${prop} to ${name}, a variable of Tailwind's theme that holds a colour`)
  }
  if (
    colourProperty.test(prop) &&
    !/^var\(/.test(value) &&
    !colourKeyword.test(value) &&
    !colourLiteral.test(value) &&
    named.length === 0
  )
    found.push(`sets ${prop} to ${value}, which is not a general token`)
  if (prop === 'font-size' && !fontSizes.has(value))
    found.push(`sets a font size off the scale (${scaleList('text', themeNames.text)})`)
  if ((prop === 'font-family' && !fontFamilies.has(value)) || prop === 'font')
    found.push(`sets a font family off the scale (${scaleList('font', themeNames.font)})`)
  if (/radius$/.test(prop) && !radii.has(value))
    found.push(`sets a radius off the scale (${scaleList('rounded', themeNames.radius)})`)
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
  `theme.css: the ${tokens.length} general tokens of the spec's token table, in ${blocks.length} blocks and each ` +
    "with its entry in Tailwind's theme; no standard scrollbar property outside the Firefox-only block",
)
console.log(
  `src/components: ${componentFiles.length} file(s) use only general tokens and the scale ` +
    `(${scaleList('text', themeNames.text)}; ${scaleList('rounded', themeNames.radius)}; ` +
    `${scaleList('font', themeNames.font)}), with no colour transition and no branch on the theme or light/dark`,
)
