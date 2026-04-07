export interface DashboardStat {
  label: string
  value: string
  hint: string
  trend: string
}

export interface ChartDatum {
  label: string
  value: number
}

export interface RecentCandidate {
  id: string
  name: string
  email: string
  appliedRole: string
  status: 'Screening' | 'Interviewed' | 'Shortlisted' | 'Offer Sent'
  source: string
  appliedAt: string
}

export interface AppliedJob {
  id: string
  title: string
  company: string
  location: string
  type: string
  status: 'Applied' | 'In review' | 'Interview' | 'Offer'
  matchScore: number
  appliedAt: string
}

export interface RecommendedJob {
  id: string
  title: string
  company: string
  location: string
  type: string
  matchScore: number
  summary: string
}

export interface ProfileChecklist {
  percent: number
  completed: string[]
  pending: string[]
}
