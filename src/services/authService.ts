import type { AuthResponse, LoginPayload, SignupPayload } from '../types/auth'
import { mockLogin, mockSignup } from '../utils/mockAuth'
import { api } from './api'

const shouldUseMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      return mockLogin(payload)
    }

    throw error
  }
}

export const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/signup', payload)
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      return mockSignup(payload)
    }

    throw error
  }
}
