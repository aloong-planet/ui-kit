# The token gate passed colours, branches and sizes written in forms it did not list

2026-11-13. Found by the independent review of the Button, and the rest of it on 2026-11-16 by the documentation
regression after the first fix; both before it merged, so no release carried it.

## What happened

`pnpm check:tokens` is the only guard for three acceptance criteria: components read colours only from general tokens
and never branch on the theme or light/dark (components::CON-004), no component animates a colour
(components::REQ-001/AC-04), and fonts, font sizes and radii come only from the scale (theming::REQ-008/AC-01). It
let through every one of them when written in a form it did not list: arbitrary properties (`[font-size:14px]`,
`[color:red]`, `[transition-property:background-color]`), 24 of the 51 colour utilities Tailwind compiles
(`ring-offset-*`, `text-shadow-*`, `scrollbar-thumb-*`, `mask-*` …), the compound variants built on `dark`
(`not-dark:`, `group-dark:` …), and a colour written as an element's attribute (`fill="red"`). After the first fix it
still let through a colour reached through a variable of any name (`bg-(--brand)`, `ring-(--brand)`) and a named
colour outside the colour properties (`shadow-[0_0_0_2px_red]`, `bg-[linear-gradient(red,blue)]`).

## Root cause

The gate decided what a class does from its name, against lists written by hand: a list of colour prefixes, a list
of palette names, a list of font-size names, the variant `dark`. Tailwind accepts many more forms than any such list
holds, and every form missing from a list passed. The first fix still judged a value against a list, the colour
properties, and accepted any variable in them.

## Why the checks did not catch it

The gate was shown able to fail with one deliberate violation of each kind, each written in the form its author had
listed. That shows the gate can fail; it says nothing about forms of the same kind that nobody wrote down. The first
fix was checked against the classes Tailwind lists, which hold no arbitrary value, so a variable or a named colour
written into one was never tried.

## Defence

- The gate compiles each class of the component source with Tailwind's design system and the kit's stylesheet, as a
  consumer does, and judges the declarations and selectors that come out, so a form is caught whatever its name.
- A declaration is judged by its value, whatever the property: a colour function or hex value, a named or system
  colour, or a variable that is neither a general token nor one of Tailwind's own fails.
- Checked against every class Tailwind 4.3.5 lists that ends in a palette colour (51), the same 51 forms with a
  general token and an opacity modifier, and every compound variant built on `dark` (5): all are reported.
- Run over every class Tailwind 4.3.5 lists (25,123), the value checks reject no class the first fix passed, so they
  raise no false alarm on Tailwind's own utilities; the only classes newly rejected are `rounded-*-none` and
  `rounded-*-full`, which the scale does not list. The forms above, a colour through a variable, in a shadow and in a
  gradient, are each reported.
