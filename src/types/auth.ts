export type UserRole = 'admin' | 'candidate'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  headline?: string
  phone?: string
  profileImage?: string
  companyName?: string
  companyWebsite?: string
  companyAddress?: string
  companyIndustry?: string
  companySize?: string
  hrDesignation?: string
  hrDepartment?: string
  companyDescription?: string
  companyLogo?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  candidateHeadline?: string
  bio?: string
  skills?: string[]
  currentLocation?: string
  education?: string
  experienceYears?: number
  resumeUrl?: string
  profileCompleted?: boolean
  profileCompletion?: number
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
  company_name?: string
}

export type AuthResponse = AuthSession
