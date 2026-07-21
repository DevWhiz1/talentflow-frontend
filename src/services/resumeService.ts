import { api } from './api'

export interface ParsedResumeData {
  full_name: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
  summary: string
  skills: string[]
  education: Array<{
    degree: string
    institution: string
    start_date: string
    end_date: string
    year?: string
  }>
  experience: Array<{
    job_title: string
    company: string
    start_date: string
    end_date: string
    description: string
  }>
  resume_url?: string
  profile_updated?: boolean
}

export interface ResumeAnalysisResponse {
  similarity_score: number
  skill_score: number
  final_score: number
  resume_skills: string[]
  job_skills: string[]
}

const getResumeFileName = (resumeUrl: string): string => {
  const path = resumeUrl.split('?')[0]
  const lastSegment = path.split('/').filter(Boolean).pop()

  return lastSegment || 'resume.pdf'
}

export const parseResume = async (file: File): Promise<ParsedResumeData> => {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post<ParsedResumeData>('/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 180000,
  })

  return data
}

export const downloadResumeFile = async (resumeUrl: string): Promise<File> => {
  const { data } = await api.get<Blob>(resumeUrl, {
    responseType: 'blob',
  })

  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/octet-stream' })

  return new File([blob], getResumeFileName(resumeUrl), {
    type: blob.type || 'application/octet-stream',
  })
}

export const analyzeResumeWithJobDescription = async (file: File, jobDescription: string): Promise<ResumeAnalysisResponse> => {
  const formData = new FormData()
  formData.append('resume', file)
  formData.append('job_description', jobDescription)

  const requestConfig = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 180000,
  }

  const analysisApiUrl = 'http://localhost:8001/analyze'

  const { data } = await api.post<ResumeAnalysisResponse>(analysisApiUrl, formData, requestConfig)
  return data
}
