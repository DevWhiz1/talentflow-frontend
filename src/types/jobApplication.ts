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
  city: string
  country: string
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

export interface JobApplicationEducation {
  id: number
  application_id: number
  school: string
  field_of_study?: string | null
  degree?: string | null
  start_date?: string | null
  end_date?: string | null
  is_currently_studying: boolean
  gpa?: number | null
  description?: string | null
  created_at: string
}

export interface JobApplicationExperience {
  id: number
  application_id: number
  title: string
  company?: string | null
  industry?: string | null
  description?: string | null
  start_date?: string | null
  end_date?: string | null
  is_currently_working: boolean
  employment_type?: string | null
  location?: string | null
  created_at: string
}

export interface AdminJobApplicant {
  id: number
  job_id: number
  candidate_id: number
  first_name: string
  last_name: string
  email: string
  current_job_title?: string | null
  status: string
  application_rating?: number | null
  applied_at: string
  is_viewed: boolean
  is_flagged: boolean
  match_score?: number | null
  similarity_score?: number | null
  skill_score?: number | null
  score_explanation?: string | null
  matched_skills?: string[] | null
  resume_skills?: string[] | null
  job_skills?: string[] | null
}

export interface AdminJobApplicantDetail extends AdminJobApplicant {
  phone: string
  address: string
  city: string
  country: string
  headline?: string | null
  profile_summary?: string | null
  resume_url: string
  cover_letter_url?: string | null
  portfolio_url?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  current_company?: string | null
  current_employment_status?: string | null
  notice_period?: string | null
  years_of_experience?: number | null
  expected_salary_min?: number | null
  expected_salary_max?: number | null
  salary_currency?: string | null
  available_start_date?: string | null
  screening_notes?: string | null
  shortlist_date?: string | null
  rejection_date?: string | null
  interview_score?: number | null
  interview_feedback?: string | null
  interview_date?: string | null
  offer_extended?: boolean | null
  offer_extended_date?: string | null
  offer_accepted?: boolean | null
  offer_accepted_date?: string | null
  viewed_date?: string | null
  flagged_reason?: string | null
  rejection_reason?: string | null
  education?: JobApplicationEducation[] | null
  experience?: JobApplicationExperience[] | null
  created_at: string
  updated_at: string
}
