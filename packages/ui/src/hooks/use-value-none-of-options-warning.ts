import { useEffect, useRef } from "react"

type Component = "Select" | "SegmentedControl" | "Tabs"

// components::REQ-016/AC-04: in development, a select, a segmented control or tabs whose value is none of their options
// log one console warning naming the component and the value, and one more each time the value or the options change
// to leave it such a value. A render with the same value and options, which an app passes as new arrays, warns no more,
// nor does Strict Mode running the effect a second time.
function useWarning(component: Component, value: string | undefined, values: readonly string[]) {
  const unheld = value !== undefined && !values.includes(value)
  const key = unheld ? JSON.stringify([value, values]) : undefined
  const warned = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (key === warned.current) return
    warned.current = key
    if (key === undefined) return
    const consequence = {
      Select: "options, so no option shows as selected",
      SegmentedControl: "options, so no segment shows as selected",
      Tabs: "tabs, so no tab shows as selected and no panel shows",
    }[component]
    console.warn(`${component}: the value ${JSON.stringify(value)} is none of its ${consequence}.`)
  }, [component, key, value])
}

// A production build logs nothing. Development and production are told apart as the kit's dependencies tell them
// apart, Base UI's development-only code and React's entry points: by `process.env.NODE_ENV`, which the kit's build
// leaves as written and the app's bundler replaces. In production the hook is a function that does nothing, and the
// bundler drops the warning with its text.
export const useValueNoneOfOptionsWarning: typeof useWarning =
  process.env.NODE_ENV !== "production" ? useWarning : () => undefined
