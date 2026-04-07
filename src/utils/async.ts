export const delay = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, milliseconds)
  })
