import { api } from './api'

export type InterviewStatus =
  | 'Scheduled'
  | 'Candidate Invited'
  | 'Confirmed'
  | 'Rescheduled'
  | 'Cancelled'
  | 'Completed'
  | 'No Show'
  | 'Rejected'
  | 'Selected for Next Round'
  | 'Hired'
  | 'On Hold'

export type InterviewRound =
  | 'Screening Interview'
  | 'First Interview'
  | 'Second Interview'
  | 'Technical Interview'
  | 'HR Interview'
  | 'Final Interview'

export type InterviewType = 'Online' | 'On-site' | 'Phone Call'

export interface Interview {
  id: number
  job_id: number
  candidate_id: number
  application_id?: number | null
  interviewer_id?: number | null
  interviewer_name?: string | null
  interviewer_email?: string | null
  panel_member_ids?: number[] | null
  panel_member_names?: string[] | null
  panel_member_emails?: string[] | null
  interview_round?: InterviewRound | string | null
  interview_type?: InterviewType | string | null
  interview_date: string
  duration_minutes?: number | null
  meeting_link?: string | null
  google_event_id?: string | null
  timezone?: string | null
  status?: InterviewStatus | string | null
  candidate_confirmed?: boolean | null
  candidate_confirmation_notes?: string | null
  interviewer_notes?: string | null
  notes?: string | null
  instructions?: string | null
  technical_score?: number | null
  communication_score?: number | null
  problem_solving_score?: number | null
  culture_fit_score?: number | null
  confidence_score?: number | null
  overall_score?: number | null
  strengths?: string | null
  weaknesses?: string | null
  detailed_remarks?: string | null
  recommendation?: string | null
  final_decision?: string | null
  final_decision_notes?: string | null
  feedback_status?: string | null
  interview_mode?: string | null
  location?: string | null
  invitation_email_sent?: boolean
  interviewer_email_sent?: boolean
  invited_at?: string | null
  confirmed_at?: string | null
  rescheduled_at?: string | null
  cancelled_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at?: string | null
}

export interface InterviewPayload {
  job_id: number
  candidate_id: number
  application_id?: number
  interviewer_id?: number
  interviewer_name?: string
  interviewer_email?: string
  panel_member_ids?: number[]
  panel_member_names?: string[]
  panel_member_emails?: string[]
  interview_round?: InterviewRound | string
  interview_type?: InterviewType | string
  interview_date: string
  duration_minutes?: number
  meeting_link?: string
  timezone?: string
  notes?: string
  instructions?: string
  location?: string
  create_google_meet?: boolean
  send_candidate_email?: boolean
  send_interviewer_email?: boolean
}

export interface InterviewEvaluationPayload {
  communication_score?: number
  technical_score?: number
  problem_solving_score?: number
  culture_fit_score?: number
  confidence_score?: number
  overall_score?: number
  strengths?: string
  weaknesses?: string
  detailed_remarks?: string
  interviewer_notes?: string
  recommendation?: 'Shortlist for next round' | 'Reject' | 'Hold' | 'Hire' | string
}

export interface ShortlistedCandidate {
  application_id: number
  job_id: number
  candidate_id: number
  candidate_name: string
  candidate_email: string
  job_title: string
  application_status: string
  shortlist_date?: string | null
  match_score?: number | null
}

export interface InterviewTimelineItem {
  id: number
  interview_round?: string | null
  interview_type?: string | null
  interview_date: string
  duration_minutes?: number | null
  interviewer_name?: string | null
  interviewer_email?: string | null
  status?: string | null
  score?: number | null
  remarks?: string | null
  recommendation?: string | null
  meeting_link?: string | null
  location?: string | null
  completed_at?: string | null
}

export interface InterviewTimeline {
  candidate_id: number
  candidate_name: string
  candidate_email: string
  job_id: number
  job_title: string
  application_id?: number | null
  final_decision?: string | null
  timeline: InterviewTimelineItem[]
}

export interface CandidateInterviewView {
  id: number
  job_id: number
  job_title?: string | null
  interview_round?: string | null
  interview_type?: string | null
  interview_date: string
  duration_minutes?: number | null
  timezone?: string | null
  status?: string | null
  location?: string | null
  meeting_link?: string | null
  interviewer_name?: string | null
  notes?: string | null
  instructions?: string | null
  candidate_confirmed?: boolean | null
}

export const getShortlistedCandidates = async (jobId?: number): Promise<ShortlistedCandidate[]> => {
  const { data } = await api.get<ShortlistedCandidate[]>('/interviews/shortlisted-candidates', {
    params: jobId ? { job_id: jobId } : undefined,
  })
  return data
}

export const scheduleInterview = async (payload: InterviewPayload): Promise<Interview> => {
  const { data } = await api.post<Interview>('/interviews/', payload)
  return data
}

export const getInterviews = async (): Promise<Interview[]> => {
  const { data } = await api.get<Interview[]>('/interviews/')
  return data
}

export const getInterview = async (interviewId: number): Promise<Interview> => {
  const { data } = await api.get<Interview>(`/interviews/${interviewId}`)
  return data
}

export const getInterviewsByCandidate = async (candidateId: number): Promise<Interview[]> => {
  const { data } = await api.get<Interview[]>(`/interviews/candidate/${candidateId}`)
  return data
}

export const getInterviewsByJob = async (jobId: number): Promise<Interview[]> => {
  const { data } = await api.get<Interview[]>(`/interviews/job/${jobId}`)
  return data
}

export const getInterviewTimeline = async (candidateId: number, jobId: number): Promise<InterviewTimeline> => {
  const { data } = await api.get<InterviewTimeline>(`/interviews/candidate/${candidateId}/job/${jobId}/timeline`)
  return data
}

export const createInterviewMeeting = async (
  interviewId: number,
): Promise<{ interview_id: number; meeting_link: string; google_event_id?: string | null }> => {
  const { data } = await api.post(`/interviews/${interviewId}/create-meeting`)
  return data
}

export const rescheduleInterview = async (
  interviewId: number,
  payload: Partial<InterviewPayload> & { interview_date: string; send_emails?: boolean },
): Promise<Interview> => {
  const { data } = await api.post<Interview>(`/interviews/${interviewId}/reschedule`, payload)
  return data
}

export const cancelInterview = async (interviewId: number, reason?: string): Promise<Interview> => {
  const { data } = await api.post<Interview>(`/interviews/${interviewId}/cancel`, { reason })
  return data
}

export const completeInterview = async (
  interviewId: number,
  payload?: InterviewEvaluationPayload,
): Promise<Interview> => {
  const { data } = await api.post<Interview>(`/interviews/${interviewId}/complete`, payload ?? {})
  return data
}

export const addInterviewEvaluation = async (
  interviewId: number,
  payload: InterviewEvaluationPayload,
): Promise<Interview> => {
  const { data } = await api.post<Interview>(`/interviews/${interviewId}/evaluation`, payload)
  return data
}

export const updateInterviewFinalDecision = async (
  candidateId: number,
  jobId: number,
  payload: { final_decision: string; final_decision_notes?: string },
): Promise<InterviewTimeline> => {
  const { data } = await api.post<InterviewTimeline>(
    `/interviews/candidate/${candidateId}/job/${jobId}/final-decision`,
    payload,
  )
  return data
}

export const getMyInterviews = async (): Promise<CandidateInterviewView[]> => {
  const { data } = await api.get<CandidateInterviewView[]>('/interviews/my-interviews')
  return data
}

export const confirmInterviewAvailability = async (
  interviewId: number,
  payload: { confirmed: boolean; notes?: string },
): Promise<Interview> => {
  const { data } = await api.post<Interview>(`/interviews/${interviewId}/confirm`, payload)
  return data
}
