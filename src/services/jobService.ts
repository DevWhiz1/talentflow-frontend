import { adminChartData, adminStats, appliedJobs, candidateStats, recommendedJobs } from '../constants/mockData'
import type { AppliedJob, ChartDatum, DashboardStat, RecommendedJob } from '../types/dashboard'
import { delay } from '../utils/async'
import { api } from './api'

const shouldUseMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const getAdminStats = async (): Promise<DashboardStat[]> => {
  try {
    const { data } = await api.get<DashboardStat[]>('/jobs/admin/stats')
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      await delay(200)
      return adminStats
    }

    throw error
  }
}

export const getAdminChartData = async (): Promise<ChartDatum[]> => {
  try {
    const { data } = await api.get<ChartDatum[]>('/jobs/admin/chart')
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      await delay(200)
      return adminChartData
    }

    throw error
  }
}

export const getCandidateStats = async (): Promise<DashboardStat[]> => {
  try {
    const { data } = await api.get<DashboardStat[]>('/jobs/candidate/stats')
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      await delay(200)
      return candidateStats
    }

    throw error
  }
}

export const getAppliedJobs = async (): Promise<AppliedJob[]> => {
  try {
    const { data } = await api.get<AppliedJob[]>('/jobs/applied')
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      await delay(200)
      return appliedJobs
    }

    throw error
  }
}

export const getRecommendedJobs = async (): Promise<RecommendedJob[]> => {
  try {
    const { data } = await api.get<RecommendedJob[]>('/jobs/recommended')
    return data
  } catch (error) {
    if (shouldUseMockApi) {
      await delay(200)
      return recommendedJobs
    }

    throw error
  }
}
