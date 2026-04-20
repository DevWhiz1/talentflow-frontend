import type { AuthResponse, LoginPayload, SignupPayload } from '../types/auth'
import { mapBackendProfileUser } from '../types/profile'
import { api } from './api'

interface BackendAuthUser {
  id: string | number
  name: string
  email: string
  role: string
  headline?: string
  phone?: string
  profile_image?: string
  company_name?: string
  company_website?: string
  company_address?: string
  company_industry?: string
  company_size?: string
  hr_designation?: string
  hr_department?: string
  company_description?: string
  company_logo?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  candidate_headline?: string
  bio?: string
  skills?: string[]
  current_location?: string
  education?: string
  experience_years?: number
  resume_url?: string
  profile_completed?: boolean
  profile_completion?: number
}

interface BackendAuthResponse {
  access_token: string
  token_type: string
  user: BackendAuthUser
}

const mapAuthResponse = (response: BackendAuthResponse): AuthResponse => ({
  token: response.access_token,
  user: mapBackendProfileUser(response.user),
})

export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await api.post<BackendAuthResponse>('/auth/login', {
    email: payload.email,
    password: payload.password,
  })

  return mapAuthResponse(data)
}

export const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  const { data } = await api.post<BackendAuthResponse>('/auth/register', {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role,
  })

  return mapAuthResponse(data)
}
