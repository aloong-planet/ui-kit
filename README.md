# ui-kit

React components and themes built on shadcn/ui (Base UI), styled by your app's own Tailwind CSS v4.

The kit is one npm package, `@aloong-planet/ui`, which carries the components and the theme stylesheet; an app
installs it and compiles the styles with its own Tailwind CSS v4. It provides twelve components (button, search box,
select, segmented control, card, badge, tooltip, drawer, confirm dialog, toast, skeleton and tabs) and three themes
(purple, blue and amber), each in light and dark. It requires React 19 and belongs to no app in particular.

How to set up and use the package in an app is in the package's own readme,
[`packages/ui/README.md`](packages/ui/README.md).

## Layout

This repository is a pnpm workspace with two packages:

| Directory | Contents |
|---|---|
| `packages/ui` | The package `@aloong-planet/ui`: the components, the ThemeProvider, the apply function, the theme stylesheet, and the package's own tests |
| `storybook` | Storybook, which uses the package exactly as an app does: a story for every component and theme, and the browser tests that drive them. It is private and never published |

## Development

Install the dependencies, then, once, the Chromium that Playwright drives the browser tests in:

```sh
pnpm install
pnpm --filter @aloong-planet/ui-storybook exec playwright install chromium
```

| Command | What it does |
|---|---|
| `pnpm dev` | Builds the package, then rebuilds it on every change and serves Storybook at <http://localhost:6006> |
| `pnpm build` | Builds the package into `packages/ui/dist` |
| `pnpm typecheck` | Type-checks both packages. The stories type-check against the built package, so run `pnpm build` first |
| `pnpm lint` | Runs ESLint over the repository and fails on any warning |
| `pnpm check:tokens` | Checks the theme stylesheet's tokens against the token table in [`docs/specs/theming.md`](docs/specs/theming.md) and against their Tailwind mapping, and checks the component source against the tokens and the scale |
| `pnpm test` | Runs both packages' tests with Vitest, in Node and in headless Chromium; every story runs as a test |
| `pnpm --filter @aloong-planet/ui-storybook build-storybook` | Builds a static Storybook into `storybook/storybook-static` |

CI runs `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm check:tokens` and `pnpm test`, in that order, on Node 26.

## Specs

What the kit does, the terms it uses and the decisions behind it are written in [`docs/specs/`](docs/specs/README.md),
one spec per feature: the package, theming and the components.

## License

[MIT](LICENSE).
