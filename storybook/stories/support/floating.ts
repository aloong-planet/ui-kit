// What the stories and tests of the floating surfaces (the select popup, the tooltip) read of an open surface that Base
// UI renders in a portal: what could clip it, and the shadow it casts (components::REQ-001/AC-03).

// The ancestors of a popup's positioner that would set up a box clipping it: any with a transform, a filter or a
// perspective, which would also become the box it is placed in
export function positionerAncestorsWith(surface: HTMLElement): string[] {
  const found: string[] = []
  for (let node = surface.parentElement?.parentElement; node; node = node.parentElement) {
    const style = getComputedStyle(node)
    if (style.transform !== 'none' || style.filter !== 'none' || style.perspective !== 'none') found.push(node.tagName)
  }
  return found
}

// The layers of a computed `box-shadow` that cast a shadow: Tailwind writes a shadow utility after empty layers for its
// rings and inset shadows, which the browser computes as transparent layers of no size
export function castShadows(value: string): string[] {
  return value.split(/,(?![^(]*\))/).map((layer) => layer.trim()).filter((layer) => !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px$/.test(layer))
}
