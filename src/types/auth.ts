export type UserRole = 'admin' | 'candidate'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  headline?: string
}

export interface MockAccount extends AuthUser {
  password: string
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export interface AuthState {
  token: string | null
  user: AuthUser | null
}

export interface LoginPayload {
  email: string
  password: string
  role: UserRole
}

export interface SignupPayload {
  name: string
  email: string
  password: string
  role: UserRole
}

export type AuthResponse = AuthSession
