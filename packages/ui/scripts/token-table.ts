// The general tokens, as `pnpm check:tokens` reads them from the token table under theming::REQ-004 in
// docs/specs/theming.md: the Kit token column, one or more tokens to a row (`--success` / `--success-foreground`).

// The spec's table cannot be read as the token table: read any other way, it would yield fewer tokens than the spec
// lists, and the check would pass. `line` is the line of the spec the problem is on, counted from 1.
export class TokenTableError extends Error {
  line: number

  constructor(line: number, problem: string) {
    super(problem)
    this.line = line
  }
}

function stopAt(line: number, problem: string): never {
  throw new TokenTableError(line, problem)
}

// The row under a table's header: cells of dashes, each with or without a colon at either end
const delimiterRow = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/

// `lines` are the lines of the spec
export function tableTokens(lines: string[]): string[] {
  const heading = lines.findIndex((line) => line.startsWith('### theming::REQ-004 '))
  if (heading === -1) stopAt(1, 'cannot find the token table: no heading "### theming::REQ-004 …"')
  const next = lines.findIndex((line, i) => i > heading && /^#{1,3} /.test(line))
  const end = next === -1 ? lines.length : next
  let first = heading + 1
  while (first < end && !lines[first].startsWith('|')) first++
  if (first === end) stopAt(heading + 1, 'cannot find the token table under this heading')
  // GFM ends a table at a blank line or where another block starts, and reads every line before that as a row, one
  // without a leading pipe or indented included. Only lines that start with `|` are read here, so any other line before
  // the blank line stops the check rather than drop the rows from it on.
  let last = first
  for (; last < end && lines[last].trim() !== ''; last++)
    if (!lines[last].startsWith('|'))
      stopAt(
        last + 1,
        'a line of the token table does not start with "|": start every row with it, and end the table with a blank line',
      )
  // The rows of a second table under the heading would not be read either
  for (let i = last; i < end; i++)
    if (lines[i].includes('|') && delimiterRow.test(lines[i]))
      stopAt(i + 1, 'a second table under theming::REQ-004: keep every general token in the token table')
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
