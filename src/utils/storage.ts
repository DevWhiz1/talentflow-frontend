const hasStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage)

export const readStoredString = (key: string): string | null => {
  if (!hasStorage()) {
    return null
  }

  return window.localStorage.getItem(key)
}

export const writeStoredString = (key: string, value: string): void => {
  if (!hasStorage()) {
    return
  }

  window.localStorage.setItem(key, value)
}

export const removeStoredValue = (key: string): void => {
  if (!hasStorage()) {
    return
  }

  window.localStorage.removeItem(key)
}

export const readStoredJson = <T>(key: string): T | null => {
  const value = readStoredString(key)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export const writeStoredJson = (key: string, value: unknown): void => {
  writeStoredString(key, JSON.stringify(value))
}
