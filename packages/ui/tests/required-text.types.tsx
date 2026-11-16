// The uses of a component its props reject. components::CON-001: every text a component needs is a required prop, so a
// component used without it fails the type check; components::REQ-002: a link takes no size. Each use marked
// `@ts-expect-error` breaks one of these, and typecheck fails if one of them compiles, since its directive then has no
// error to expect; the unmarked use next to it differs only in keeping the rule, so that the marked one fails for
// breaking it and not for something else. This file is type-checked by `pnpm typecheck`, never run.
import { X } from 'lucide-react'
import { Button, SearchBox } from '../src'

declare const name: string

export const iconButtons = [
  // @ts-expect-error an icon-only button needs the accessible name the caller passes
  <Button key="icon" size="icon">
    <X />
  </Button>,
  <Button key="icon named" size="icon" aria-label={name}>
    <X />
  </Button>,
  // @ts-expect-error a small icon-only button needs it too
  <Button key="icon-sm" size="icon-sm" variant="ghost">
    <X />
  </Button>,
  <Button key="icon-sm named" size="icon-sm" variant="ghost" aria-label={name}>
    <X />
  </Button>,
]

export const textButtons = [
  // @ts-expect-error a text button needs its label
  <Button key="no label" variant="primary" />,
  <Button key="label" variant="primary">
    {name}
  </Button>,
]

// components::REQ-002: a link is inline text in the size of the text around it, so it takes no size
export const links = [
  // @ts-expect-error a link takes no size
  <Button key="link sized" variant="link" size="icon" aria-label={name}>
    <X />
  </Button>,
  <Button key="link" variant="link">
    {name}
  </Button>,
]

// A search box needs its placeholder and its accessible name, an `aria-label` or an `aria-labelledby`
export const searchBoxes = [
  // @ts-expect-error a search box needs its accessible name
  <SearchBox key="no name" placeholder={name} />,
  <SearchBox key="label" placeholder={name} aria-label={name} />,
  <SearchBox key="labelled by" placeholder={name} aria-labelledby={name} />,
  // @ts-expect-error a search box needs its placeholder
  <SearchBox key="no placeholder" aria-label={name} />,
]
