import type { JSX, ReactNode } from 'react'
import { createContext, useState } from 'react'
import { dashboardPathByRole } from '../constants/routes'
import type { AuthResponse, AuthState, LoginPayload, SignupPayload, UserRole } from '../types/auth'
import { login as loginRequest, signup as signupRequest } from '../services/authService'
import { clearAuthSession, readAuthSession, writeAuthSession } from '../utils/authStorage'

interface AuthContextValue extends AuthState {
  isHydrated: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<AuthResponse>
  signup: (payload: SignupPayload) => Promise<AuthResponse>
  logout: () => void
  setSession: (response: AuthResponse) => void
  dashboardPath: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const initialState: AuthState = readAuthSession()

const getDashboardPath = (role: UserRole | null | undefined): string =>
  role ? dashboardPathByRole[role] : dashboardPathByRole.candidate

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<AuthState>(initialState)
  const isHydrated = true

  const setSession = (response: AuthResponse): void => {
    setState(response)
    writeAuthSession(response)
  }

  const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await loginRequest(payload)
    setSession(response)
    return response
  }

  const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
    const response = await signupRequest(payload)
    setSession(response)
    return response
  }

  const logout = (): void => {
    setState(initialState)
    clearAuthSession()
  }

  const value: AuthContextValue = {
    ...state,
    isHydrated,
    isAuthenticated: Boolean(state.token && state.user),
    login,
    signup,
    logout,
    setSession,
    dashboardPath: getDashboardPath(state.user?.role),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
