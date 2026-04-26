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

export interface UpdateAdminHrJobPayload {
  title?: string
  description?: string
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
  published_at?: string
  application_deadline?: string
  min_experience_years?: number
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  is_salary_visible?: boolean
  job_summary?: string
  auto_match_enabled?: boolean
  min_match_score?: number
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

export interface AdminHrJobListItem {
  id: number
  title: string
  department?: string | null
  company_name?: string | null
  employment_type?: string | null
  work_mode?: string | null
  location?: string | null
  status?: string | null
  openings_count?: number | null
  total_applications?: number | null
  created_by?: number | null
  creator_name?: string | null
  creator_email?: string | null
  created_at: string
}

export interface AdminHrJobDetail {
  id: number
  title: string
  description: string
  requirements?: string | null
  skills?: string | null
  experience_level?: string | null
  location?: string | null
  salary_range?: string | null
  company_name?: string | null
  department?: string | null
  employment_type?: string | null
  work_mode?: string | null
  openings_count?: number | null
  published_at?: string | null
  application_deadline?: string | null
  min_experience_years?: number | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
  salary_period?: string | null
  is_salary_visible?: boolean | null
  total_applications?: number | null
  shortlisted_count?: number | null
  interview_count?: number | null
  offer_count?: number | null
  hired_count?: number | null
  job_summary?: string | null
  job_vector_id?: string | null
  auto_match_enabled?: boolean | null
  min_match_score?: number | null
  created_by?: number | null
  status?: string | null
  created_at: string
  creator_name?: string | null
  creator_email?: string | null
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

export const getAdminHrJobs = async (): Promise<AdminHrJobListItem[]> => {
  const { data } = await api.get<AdminHrJobListItem[]>('/jobs/admin/hr')
  return data
}

export const getAdminHrJobById = async (jobId: number): Promise<AdminHrJobDetail> => {
  const { data } = await api.get<AdminHrJobDetail>(`/jobs/admin/hr/${jobId}`)
  return data
}

export const updateAdminHrJob = async (
  jobId: number,
  payload: UpdateAdminHrJobPayload,
): Promise<AdminHrJobDetail> => {
  const { data } = await api.put<AdminHrJobDetail>(`/jobs/admin/hr/${jobId}`, payload)
  return data
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
