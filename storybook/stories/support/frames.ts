// Waiting for the page to settle, for the stories and the interaction tests: until the next animation frame, or until
// `count` frames have passed

export const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))

export async function frames(count: number): Promise<void> {
  for (let index = 0; index < count; index++) await frame()
}
