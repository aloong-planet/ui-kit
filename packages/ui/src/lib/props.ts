// The props two or more components take under one rule, defined once so that each component follows the same rule.

/**
 * A required accessible name: an `aria-label`, or an `aria-labelledby` pointing at a label on the page. A component
 * that writes no text of its own takes it, so a missing one fails the type check (components::CON-001).
 */
export type AccessibleNameProps = { "aria-label": string; "aria-labelledby"?: string } | { "aria-label"?: string; "aria-labelledby": string }

/**
 * A required selected value, one of the control's options `V`: a controlled `value` or an uncontrolled `defaultValue`.
 * Without either, or with a value none of the options' types allow, the type check fails (components::REQ-004/AC-09,
 * components::REQ-005/AC-06, components::REQ-013/AC-05). `NoInfer` keeps `V` from being inferred from the value.
 */
export type SelectedValueProps<V extends string> = { value: NoInfer<V>; defaultValue?: never } | { value?: never; defaultValue: NoInfer<V> }
