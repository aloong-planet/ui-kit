// components::CON-001: every text a component needs is a required prop, so a component used without it fails the type
// check. Each use marked `@ts-expect-error` leaves out a required text, and typecheck fails if one of them compiles,
// since its directive then has no error to expect; the unmarked use next to it passes the text, so that the marked
// one fails for the missing text and not for something else. This file is type-checked by `pnpm typecheck`, never run.
import { X } from 'lucide-react'
import { Button } from '../src'

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
