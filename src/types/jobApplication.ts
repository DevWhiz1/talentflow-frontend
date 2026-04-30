export interface CandidateJobOpening {
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
  company_logo?: string | null
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
}

export interface JobApplicationEducationInput {
  school: string
  field_of_study?: string
  degree?: string
  start_date?: string
  end_date?: string
  is_currently_studying?: boolean
  gpa?: number | string
  description?: string
}

export interface JobApplicationExperienceInput {
  title: string
  company?: string
  industry?: string
  description?: string
  start_date?: string
  end_date?: string
  is_currently_working?: boolean
  employment_type?: string
  location?: string
}

export interface JobApplicationSubmitPayload {
  job_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  headline?: string
  resume_url: string
  cover_letter?: string
  portfolio_url?: string
  linkedin_url?: string
  github_url?: string
  education?: JobApplicationEducationInput[]
  experience?: JobApplicationExperienceInput[]
}

export interface JobApplicationUploadResponse {
  url: string
  filename: string
  content_type?: string
}
