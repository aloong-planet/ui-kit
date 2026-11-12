# Specs

Each file here describes one feature of the kit as it is now: its behaviour, what it deliberately does not
do, the terms it uses and the decisions behind it, each decision with its reason and the alternative it
rejected (this repository keeps no glossary and no ADRs). A spec is rewritten in place when its feature
changes, and is deleted together with its row below when the feature is removed; its history is in git.

A spec cites no tickets, branches or working notes. A fact not yet true of the implementation is marked with
a `> Pending:` note whose condition can be checked against the implementation; once the condition no longer
holds, the note is removed or rewritten as ordinary text. Requirements and acceptance criteria are
identified as `<spec>::<ID>`, for example `theming::REQ-002/AC-01`, and a reference to another spec links to
that spec's file.

| Spec | In one line |
|---|---|
| [Package](package.md) | How apps consume the kit: the npm package, its entry points, React 19, and Tailwind CSS v4 in the consumer |
| [Theming](theming.md) | The three themes in light and dark, their tokens, how the theme and mode reach the document root, and the scrollbars |
| [Components](components.md) | The twelve first-release components, each in one standard form, their variants and states, and Storybook |
