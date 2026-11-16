// An app module that uses the select, the segmented control and the tabs, imported through the kit's `exports`. It
// hands them to the page, so an app build, which keeps no export of its entry, keeps them.
import { SegmentedControl, Select, Tabs } from '@aloong-planet/ui'

Object.assign(globalThis, { kit: { SegmentedControl, Select, Tabs } })
