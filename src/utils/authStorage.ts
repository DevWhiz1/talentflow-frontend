import { storageKeys } from '../constants/storage'
import type { AuthResponse, AuthSession, AuthState } from '../types/auth'
import {
  readStoredJson,
  readStoredString,
  removeStoredValue,
  writeStoredJson,
  writeStoredString,
} from './storage'

export const readAuthSession = (): AuthState => {
  const storedSession = readStoredJson<AuthSession>(storageKeys.authSession)

  if (storedSession?.token && storedSession.user) {
    return storedSession
  }

  const token = readStoredString(storageKeys.authToken)

  if (!token) {
    return { token: null, user: null }
  }

  return { token, user: null }
}

export const readAuthToken = (): string | null => readStoredString(storageKeys.authToken)

export const writeAuthSession = (session: AuthResponse): void => {
  writeStoredString(storageKeys.authToken, session.token)
  writeStoredJson(storageKeys.authSession, session)
}

export const clearAuthSession = (): void => {
  removeStoredValue(storageKeys.authToken)
  removeStoredValue(storageKeys.authSession)
}
