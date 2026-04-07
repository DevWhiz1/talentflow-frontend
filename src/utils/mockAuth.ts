import { storageKeys } from '../constants/storage'
import { demoAuthAccounts } from '../constants/mockData'
import type { AuthResponse, LoginPayload, MockAccount, SignupPayload } from '../types/auth'
import { delay } from './async'
import { createId } from './id'
import { readStoredJson, writeStoredJson } from './storage'

const ensureMockAccounts = (): MockAccount[] => {
  const storedAccounts = readStoredJson<MockAccount[]>(storageKeys.mockUsers)

  if (storedAccounts?.length) {
    return storedAccounts
  }

  writeStoredJson(storageKeys.mockUsers, demoAuthAccounts)
  return demoAuthAccounts
}

const persistMockAccounts = (accounts: MockAccount[]): void => {
  writeStoredJson(storageKeys.mockUsers, accounts)
}

const toAuthResponse = (account: MockAccount): AuthResponse => ({
  token: `mock-${account.role}-${account.id}`,
  user: {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    headline: account.headline,
  },
})

export const mockLogin = async (payload: LoginPayload): Promise<AuthResponse> => {
  await delay(250)

  const accounts = ensureMockAccounts()
  const account = accounts.find(
    (candidate) =>
      candidate.email.toLowerCase() === payload.email.toLowerCase() &&
      candidate.password === payload.password &&
      candidate.role === payload.role,
  )

  if (!account) {
    throw new Error('Invalid credentials. Use the demo account or create a new one.')
  }

  return toAuthResponse(account)
}

export const mockSignup = async (payload: SignupPayload): Promise<AuthResponse> => {
  await delay(250)

  const accounts = ensureMockAccounts()
  const duplicate = accounts.some(
    (candidate) => candidate.email.toLowerCase() === payload.email.toLowerCase(),
  )

  if (duplicate) {
    throw new Error('An account with this email already exists.')
  }

  const account: MockAccount = {
    id: createId('user'),
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    headline: payload.role === 'admin' ? 'HR Manager' : 'Candidate',
  }

  persistMockAccounts([...accounts, account])
  return toAuthResponse(account)
}
