export const getErrorMessage = (error: unknown, fallbackMessage = 'Something went wrong'): string =>
  error instanceof Error ? error.message : fallbackMessage
