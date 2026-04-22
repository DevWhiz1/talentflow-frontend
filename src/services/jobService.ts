import { adminChartData, adminStats, appliedJobs, candidateStats, recommendedJobs } from '../constants/mockData'
import type { AppliedJob, ChartDatum, DashboardStat, RecommendedJob } from '../types/dashboard'
import { delay } from '../utils/async'
import { api } from './api'

const shouldUseMockApi = import.meta.env.VITE_USE_MOCK_API !== 'false'

export interface CreateJobPayload {
  title: string
  description: string
  requirements?: string
  skills?: string
  experience_level?: string
  location?: string
  salary_range?: string
  company_name?: string
  department?: string
  employment_type?: string
  work_mode?: string
  openings_count?: number
  min_experience_years?: number
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  is_salary_visible?: boolean
  status?: string
}

export interface JobDescriptionGeneratePayload {
  prompt: string
  title?: string
  skills?: string
  min_experience_years?: number
  location?: string
  employment_type?: string
  salary_range?: string
}

interface JobDescriptionGenerateResponse {
  description: string
}

export const createJob = async (payload: CreateJobPayload) => {
  const { data } = await api.post('/jobs/', payload)
  return data
}

export const generateJobDescription = async (
  payload: JobDescriptionGeneratePayload,
): Promise<string> => {
  const { data } = await api.post<JobDescriptionGenerateResponse>('/jobs/generate-description', payload)
  return data.description
}

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
