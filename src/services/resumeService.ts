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
