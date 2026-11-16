// The general tokens `pnpm check:tokens` reads from the token table of theming::REQ-004, and every form of table it
// stops on rather than read fewer rows. The spec is given as lines in the shape of docs/specs/theming.md: prose with
// backticked tokens before the table, a column after the Kit token one that names tokens too, the acceptance criteria
// after it, and a table under the next heading.
import { describe, expect, it } from 'vitest'
import { tableTokens, TokenTableError } from '../scripts/token-table.ts'

const spec = [
  '# Theming', // 1
  '', // 2
  '### theming::REQ-004 General tokens', // 3
  '', // 4
  'A colour shadcn/ui has no token for is added as a `--<name>` / `--<name>-foreground` pair.', // 5
  '', // 6
  '| Kit token | What it colours |', // 7
  '|---|---|', // 8
  '| `--background` | The page; the ground of a segment under `--accent` |', // 9
  '| `--success` / `--success-foreground` | Success toasts and badges |', // 10
  '| `--shadow-pop` | The shadow of every floating surface |', // 11
  '', // 12
  '- theming::REQ-004/AC-01: Every row of the table is defined for every theme and for light and dark.', // 13
  '', // 14
  '---', // 15
  '', // 16
  '### theming::REQ-008 Type and radius scale', // 17
  '', // 18
  '| Step | Value |', // 19
  '|---|---|', // 20
  '| `text-xs` | `--text-xs`, 11px |', // 21
]

// The spec with `count` lines from `line` (counted from 1) replaced by `replacement`
function edited(line: number, count: number, ...replacement: string[]): string[] {
  return [...spec.slice(0, line - 1), ...replacement, ...spec.slice(line - 1 + count)]
}

function stopOf(lines: string[]): { line: number; problem: string } {
  try {
    tableTokens(lines)
  } catch (error) {
    if (error instanceof TokenTableError) return { line: error.line, problem: error.message }
    throw error
  }
  throw new Error('the table was read with no stop')
}

describe('the token table of theming::REQ-004', () => {
  it.each([
    ['with a heading after its section', spec],
    ['with its section running to the end of the spec', spec.slice(0, 14)],
  ])('yields the tokens of the Kit token column, in order, each of a row of two, %s', (_, lines) => {
    expect(tableTokens(lines)).toEqual(['--background', '--success', '--success-foreground', '--shadow-pop'])
  })

  it.each([
    ['no heading for theming::REQ-004', edited(3, 1, '### General tokens'), 1, 'cannot find the token table'],
    ['no table under the heading', edited(7, 6), 3, 'cannot find the token table under this heading'],
    ['no Kit token column', edited(7, 1, '| Token | What it colours |'), 7, 'no "Kit token" column'],
    ['no delimiter row under the header', edited(8, 1), 8, 'no delimiter row'],
    ['nothing under the header', edited(8, 4), 8, 'no delimiter row'],
    ['no rows', edited(9, 3), 7, 'no rows'],
    [
      'a Kit token cell of another shape',
      edited(10, 1, '| `--success`, `--success-foreground` | Success toasts and badges |'),
      10,
      'is not one or more `--name` joined by " / "',
    ],
    [
      'a row with no cell in the Kit token column',
      edited(7, 3, '| What it colours | Kit token |', '|---|---|', '| The page |'),
      9,
      'the Kit token cell ""',
    ],
    ['a token in two rows', edited(11, 1, '| `--background` | Again |'), 11, '--background is in the token table twice'],
    ['a row without its leading pipe', edited(12, 0, '`--brand` | A colour |'), 12, 'does not start with "|"'],
    ['a row indented', edited(12, 0, '  | `--brand` | A colour |'), 12, 'does not start with "|"'],
    [
      'a second table under the heading',
      edited(14, 0, '', '| Kit token | What it colours |', '|---|---|', '| `--brand` | A colour |'),
      16,
      'a second table under theming::REQ-004',
    ],
  ])('stops on %s, at its line', (_, lines, line, problem) => {
    const stop = stopOf(lines)
    expect(stop.line).toBe(line)
    expect(stop.problem).toContain(problem)
  })
})
