import { demoAuthAccounts, profileChecklist, recentCandidates } from '../constants/mockData'
import type { AuthUser } from '../types/auth'
import type { ProfileChecklist, RecentCandidate } from '../types/dashboard'
import { delay } from '../utils/async'
import { readAuthSession } from '../utils/authStorage'
import { api } from './api'

const shouldUseMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const getCurrentUser = async (): Promise<AuthUser> => {
  try {
    const { data } = await api.get<AuthUser>('/users/me')
    return data
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
