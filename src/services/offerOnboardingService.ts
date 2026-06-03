import { api } from './api'

export type OfferStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'revised'
export type OnboardingStatus = 'not_started' | 'started' | 'pending_documents' | 'documents_submitted' | 'under_review' | 'completed' | 'on_hold' | 'cancelled'

export interface OfferLetter {
  id: number
  candidate_id: number
  candidate_name?: string | null
  candidate_email?: string | null
  job_id: number
  job_name?: string | null
  application_id?: number | null
  template_name: string
  job_title: string
  department?: string | null
  reporting_manager?: string | null
  work_location?: string | null
  employment_type?: string | null
  probation_period?: string | null
  salary: number
  salary_currency: string
  package_details?: string | null
  joining_date: string
  benefits?: string | null
  terms_and_conditions?: string | null
  offer_body?: string | null
  status: OfferStatus
  candidate_comments?: string | null
  change_request?: string | null
  allow_change_request: boolean
  created_at: string
  sent_at?: string | null
  viewed_at?: string | null
  accepted_at?: string | null
}

export interface OfferLetterPayload {
  candidate_id: number
  job_id: number
  application_id?: number | null
  template_name: string
  job_title: string
  department?: string
  reporting_manager?: string
  work_location?: string
  employment_type?: string
  probation_period?: string
  salary: number
  salary_currency: string
  package_details?: string
  joining_date: string
  benefits?: string
  terms_and_conditions?: string
  offer_body?: string
  status?: OfferStatus
  allow_change_request?: boolean
}

export interface OfferPreview {
  subject: string
  body: string
}

export interface OnboardingTask {
  title: string
  assigned_to: string
  status: string
  due_date?: string | null
  notes?: string | null
}

export interface OnboardingDocument {
  name: string
  url?: string | null
  status: string
  notes?: string | null
}

export interface Onboarding {
  id: number
  candidate_id: number
  candidate_name?: string | null
  candidate_email?: string | null
  offer_letter_id?: number | null
  employee_id?: string | null
  job_title?: string | null
  department?: string | null
  reporting_manager?: string | null
  joining_date?: string | null
  status: OnboardingStatus
  checklist?: OnboardingTask[] | null
  documents?: OnboardingDocument[] | null
  personal_information?: Record<string, string> | null
  bank_details?: Record<string, string> | null
  emergency_contact?: Record<string, string> | null
  verification_notes?: string | null
  welcome_email_sent_at?: string | null
  completed_at?: string | null
  created_at: string
}

export interface OnboardingPayload {
  candidate_id?: number
  offer_letter_id?: number | null
  employee_id?: string
  job_title?: string
  department?: string
  reporting_manager?: string
  joining_date?: string
  status?: OnboardingStatus
  checklist?: OnboardingTask[]
  documents?: OnboardingDocument[]
  personal_information?: Record<string, string>
  bank_details?: Record<string, string>
  emergency_contact?: Record<string, string>
  verification_notes?: string
}

export const getOfferLetters = async (): Promise<OfferLetter[]> => {
  const { data } = await api.get<OfferLetter[]>('/offer-letters/')
  return data
}

export const getOfferLetter = async (offerId: number): Promise<OfferLetter> => {
  const { data } = await api.get<OfferLetter>(`/offer-letters/${offerId}`)
  return data
}

export const getMyOfferLetters = async (): Promise<OfferLetter[]> => {
  const { data } = await api.get<OfferLetter[]>('/offer-letters/candidate/me')
  return data
}

export const createOfferLetter = async (payload: OfferLetterPayload): Promise<OfferLetter> => {
  const { data } = await api.post<OfferLetter>('/offer-letters/', payload)
  return data
}

export const updateOfferLetter = async (offerId: number, payload: Partial<OfferLetterPayload>): Promise<OfferLetter> => {
  const { data } = await api.put<OfferLetter>(`/offer-letters/${offerId}`, payload)
  return data
}

export const previewOfferLetter = async (offerId: number): Promise<OfferPreview> => {
  const { data } = await api.get<OfferPreview>(`/offer-letters/${offerId}/preview`)
  return data
}

export const sendOfferLetter = async (offerId: number): Promise<OfferLetter> => {
  const { data } = await api.post<OfferLetter>(`/offer-letters/${offerId}/send`)
  return data
}

export const resendOfferLetter = async (offerId: number): Promise<OfferLetter> => {
  const { data } = await api.post<OfferLetter>(`/offer-letters/${offerId}/resend`)
  return data
}

export const cancelOfferLetter = async (offerId: number): Promise<OfferLetter> => {
  const { data } = await api.post<OfferLetter>(`/offer-letters/${offerId}/cancel`)
  return data
}

export const markOfferViewed = async (offerId: number): Promise<OfferLetter> => {
  const { data } = await api.post<OfferLetter>(`/offer-letters/${offerId}/view`)
  return data
}

export const acceptOffer = async (offerId: number, comments?: string): Promise<OfferLetter> => {
  const { data } = await api.post<OfferLetter>(`/offer-letters/${offerId}/accept`, { comments })
  return data
}

export const rejectOffer = async (offerId: number, comments: string): Promise<OfferLetter> => {
  const { data } = await api.post<OfferLetter>(`/offer-letters/${offerId}/reject`, { comments })
  return data
}

export const requestOfferChanges = async (offerId: number, changeRequest: string): Promise<OfferLetter> => {
  const { data } = await api.post<OfferLetter>(`/offer-letters/${offerId}/request-changes`, { change_request: changeRequest })
  return data
}

export const downloadOfferPdf = async (offerId: number): Promise<Blob> => {
  const { data } = await api.get(`/offer-letters/${offerId}/pdf`, { responseType: 'blob' })
  return data
}

export const getOnboardings = async (): Promise<Onboarding[]> => {
  const { data } = await api.get<Onboarding[]>('/onboardings/')
  return data
}

export const getOnboarding = async (onboardingId: number): Promise<Onboarding> => {
  const { data } = await api.get<Onboarding>(`/onboardings/${onboardingId}`)
  return data
}

export const getMyOnboarding = async (): Promise<Onboarding | null> => {
  try {
    const { data } = await api.get<Onboarding>('/onboardings/candidate/me')
    return data
  } catch (error) {
    if ((error as Error & { status?: number }).status === 404) return null
    throw error
  }
}

export const startOnboardingFromOffer = async (offerId: number): Promise<Onboarding> => {
  const { data } = await api.post<Onboarding>(`/onboardings/start-from-offer/${offerId}`)
  return data
}

export const updateOnboarding = async (onboardingId: number, payload: OnboardingPayload): Promise<Onboarding> => {
  const { data } = await api.put<Onboarding>(`/onboardings/${onboardingId}`, payload)
  return data
}

export const submitCandidateOnboarding = async (onboardingId: number, payload: OnboardingPayload): Promise<Onboarding> => {
  const { data } = await api.put<Onboarding>(`/onboardings/${onboardingId}/candidate-submit`, payload)
  return data
}

export const sendWelcomeEmail = async (onboardingId: number): Promise<Onboarding> => {
  const { data } = await api.post<Onboarding>(`/onboardings/${onboardingId}/send-welcome`)
  return data
}

export const uploadOnboardingDocument = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post<{ url: string }>('/onboardings/upload-document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.url
}
