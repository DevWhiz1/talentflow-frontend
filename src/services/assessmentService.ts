import { api } from './api'

export type AssessmentType = 'mcq' | 'project'
export type AssessmentStatus = 'draft' | 'published' | 'archived'

export interface AssessmentQuestion {
  question_id?: number
  question_text: string
  question_type?: string
  options: string[]
  correct_answer?: string
  marks: number
  skill_tag?: string
  difficulty?: string
}

export interface ProjectAttachment {
  name: string
  url: string
}

export interface Assessment {
  id: number
  job_id: number
  title: string
  description?: string | null
  assessment_type: AssessmentType
  status: AssessmentStatus
  total_questions: number
  total_marks: number
  passing_marks?: number | null
  passing_percentage?: number | null
  time_limit_seconds?: number | null
  due_at?: string | null
  instructions?: string | null
  questions: AssessmentQuestion[]
  show_result_to_candidate: boolean
  project_requirements?: string | null
  project_deliverables?: string | null
  project_deadline_hours?: number | null
  project_submission_instructions?: string | null
  reference_files: ProjectAttachment[]
  allow_late_submission: boolean
  created_at: string
  published_at?: string | null
}

export interface AssessmentPayload {
  job_id: number
  title: string
  description?: string
  assessment_type: AssessmentType
  status: AssessmentStatus
  passing_marks?: number | null
  passing_percentage?: number | null
  time_limit_seconds?: number | null
  due_at?: string | null
  instructions?: string
  questions?: AssessmentQuestion[]
  show_result_to_candidate?: boolean
  project_requirements?: string
  project_deliverables?: string
  project_deadline_hours?: number | null
  project_submission_instructions?: string
  reference_files?: ProjectAttachment[]
  allow_late_submission?: boolean
}

export interface AssignmentListItem {
  id: number
  assessment_id: number
  job_id: number
  application_id: number
  candidate_id: number
  invite_token: string
  status: string
  assigned_at: string
  due_at?: string | null
  submitted_at?: string | null
  obtained_marks?: number | null
  percentage?: number | null
  passed?: boolean | null
  hr_score?: number | null
  hr_feedback?: string | null
  recommendation?: string | null
  candidate_name: string
  candidate_email: string
  job_title: string
  assessment_title: string
  assessment_type: AssessmentType
}

export interface CandidateAssessmentDetail {
  assignment: AssignmentListItem
  assessment: Assessment
  job_title: string
  candidate_name: string
  can_submit: boolean
  already_submitted: boolean
  result_visible: boolean
}

export interface MCQStartResponse {
  assignment_id: number
  started_at: string
  ends_at?: string | null
  questions: AssessmentQuestion[]
}

export interface Scorecard {
  assignment_id: number
  candidate_name: string
  job_title: string
  assessment_title: string
  assessment_type: AssessmentType
  total_questions?: number | null
  correct_answers?: number | null
  wrong_answers?: number | null
  total_marks?: number | null
  obtained_marks?: number | null
  percentage?: number | null
  passed?: boolean | null
  submission_status: string
  submitted_links?: Record<string, string | null> | null
  hr_score?: number | null
  hr_feedback?: string | null
  recommendation?: string | null
}

export const getAssessments = async (): Promise<Assessment[]> => {
  const { data } = await api.get<Assessment[]>('/assessments/')
  return data
}

export const getAssessment = async (assessmentId: number): Promise<Assessment> => {
  const { data } = await api.get<Assessment>(`/assessments/${assessmentId}`)
  return data
}

export const createAssessment = async (payload: AssessmentPayload): Promise<Assessment> => {
  const { data } = await api.post<Assessment>('/assessments/', payload)
  return data
}

export const updateAssessment = async (assessmentId: number, payload: Partial<AssessmentPayload>): Promise<Assessment> => {
  const { data } = await api.put<Assessment>(`/assessments/${assessmentId}`, payload)
  return data
}

export const assignAssessment = async (
  assessmentId: number,
  payload: { assign_all?: boolean; candidate_ids?: number[]; application_ids?: number[] },
): Promise<AssignmentListItem[]> => {
  const { data } = await api.post<AssignmentListItem[]>(`/assessments/${assessmentId}/assign`, payload)
  return data
}

export const getAssessmentAssignments = async (params?: {
  assessment_id?: number
  job_id?: number
}): Promise<AssignmentListItem[]> => {
  const { data } = await api.get<AssignmentListItem[]>('/assessments/assignments', { params })
  return data
}

export const getMyAssessments = async (): Promise<AssignmentListItem[]> => {
  const { data } = await api.get<AssignmentListItem[]>('/assessments/candidate')
  return data
}

export const getCandidateAssessmentDetail = async (inviteToken: string): Promise<CandidateAssessmentDetail> => {
  const { data } = await api.get<CandidateAssessmentDetail>(`/assessments/candidate/${inviteToken}`)
  return data
}

export const startMCQAssessment = async (inviteToken: string): Promise<MCQStartResponse> => {
  const { data } = await api.post<MCQStartResponse>(`/assessments/candidate/${inviteToken}/start`)
  return data
}

export const submitMCQAssessment = async (
  inviteToken: string,
  answers: Record<string, string>,
): Promise<Scorecard> => {
  const { data } = await api.post<Scorecard>(`/assessments/candidate/${inviteToken}/submit-mcq`, { answers })
  return data
}

export const submitProjectAssessment = async (
  inviteToken: string,
  payload: Record<string, string>,
): Promise<Scorecard> => {
  const { data } = await api.post<Scorecard>(`/assessments/candidate/${inviteToken}/submit-project`, payload)
  return data
}

export const reviewProjectSubmission = async (
  assignmentId: number,
  payload: { score: number; feedback?: string; recommendation: string; status: string },
): Promise<Scorecard> => {
  const { data } = await api.put<Scorecard>(`/assessments/assignments/${assignmentId}/review-project`, payload)
  return data
}

export interface AIAssessmentGenerateRequest {
  job_id?: number
  topic_or_role: string
  assessment_type?: AssessmentType
  num_questions?: number
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed'
  additional_instructions?: string
}

export interface AIAssessmentGenerateResponse {
  title: string
  description?: string
  instructions?: string
  passing_percentage: number
  time_limit_seconds: number
  questions: AssessmentQuestion[]
  project_requirements?: string
  project_deliverables?: string
  project_submission_instructions?: string
}

export const uploadAssessmentFile = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ url: string }>('/assessments/upload-file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}

export const generateAIAssessment = async (
  payload: AIAssessmentGenerateRequest,
): Promise<AIAssessmentGenerateResponse> => {
  const { data } = await api.post<AIAssessmentGenerateResponse>('/assessments/generate-ai', payload)
  return data
}

