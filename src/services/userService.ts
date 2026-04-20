import { demoAuthAccounts, profileChecklist, recentCandidates } from '../constants/mockData'
import type { AuthUser } from '../types/auth'
import type { ProfileChecklist, RecentCandidate } from '../types/dashboard'
import type {
  AdminProfileUpdatePayload,
  BackendProfileUser,
  CandidateProfileUpdatePayload,
} from '../types/profile'
import { mapBackendProfileUser } from '../types/profile'
import { delay } from '../utils/async'
import { readAuthSession, writeAuthSession } from '../utils/authStorage'
import { api } from './api'

const shouldUseMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const getCurrentUser = async (): Promise<AuthUser> => {
  try {
    const { data } = await api.get<BackendProfileUser>('/users/me')
    return mapBackendProfileUser(data)
  } catch (error) {
    if (shouldUseMockApi) {
      await delay(150)
      const session = readAuthSession()
      if (session.user) {
        return session.user
      }

      return demoAuthAccounts[1]
    }

    throw error
  }
}

const updateSessionUser = (user: AuthUser): void => {
  const session = readAuthSession()
  if (!session.token) {
    return
  }

  writeAuthSession({ token: session.token, user })
}

export const updateCandidateProfile = async (
  payload: CandidateProfileUpdatePayload,
): Promise<AuthUser> => {
  const { data } = await api.put<BackendProfileUser>('/users/me/profile', payload)
  const user = mapBackendProfileUser(data)
  updateSessionUser(user)
  return user
}

export const updateAdminProfile = async (payload: AdminProfileUpdatePayload): Promise<AuthUser> => {
  const { data } = await api.put<BackendProfileUser>('/users/me/profile', payload)
  const user = mapBackendProfileUser(data)
  updateSessionUser(user)
  return user
}

export const uploadProfileImage = async (file: File): Promise<AuthUser> => {
  const formData = new FormData()
  formData.append('image', file)

  const { data } = await api.post<BackendProfileUser>('/users/me/profile-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  const user = mapBackendProfileUser(data)
  updateSessionUser(user)
  return user
}

export const getRecentCandidates = async (): Promise<RecentCandidate[]> => {
  try {
    const { data } = await api.get<RecentCandidate[]>('/users/recent-candidates')
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      await delay(200)
      return recentCandidates
    }

    throw error
  }
}

export const getProfileChecklist = async (): Promise<ProfileChecklist> => {
  try {
    const { data } = await api.get<ProfileChecklist>('/users/profile-checklist')
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      await delay(200)
      return profileChecklist
    }

    throw error
  }
}
