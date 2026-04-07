import type {
  AppliedJob,
  ChartDatum,
  DashboardStat,
  ProfileChecklist,
  RecentCandidate,
  RecommendedJob,
} from '../types/dashboard'
import type { MockAccount } from '../types/auth'

export const demoAuthAccounts: MockAccount[] = [
  {
    id: 'admin-demo',
    name: 'Amina Rahman',
    email: 'admin@talentflow.dev',
    password: 'Admin@123',
    role: 'admin',
    headline: 'HR Director',
  },
  {
    id: 'candidate-demo',
    name: 'Daniel Moore',
    email: 'candidate@talentflow.dev',
    password: 'Candidate@123',
    role: 'candidate',
    headline: 'Product Designer',
  },
]

export const adminStats: DashboardStat[] = [
  {
    label: 'Total jobs',
    value: '148',
    hint: '12 published this week',
    trend: '+8.4% from last month',
  },
  {
    label: 'Candidates',
    value: '2,134',
    hint: '348 active this week',
    trend: '+11.2% from last month',
  },
  {
    label: 'Applications',
    value: '9,482',
    hint: '423 new submissions',
    trend: '+6.9% from last month',
  },
  {
    label: 'Interview rate',
    value: '41%',
    hint: 'Qualification quality improved',
    trend: '+3.1 points from last month',
  },
]

export const adminChartData: ChartDatum[] = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 58 },
  { label: 'Wed', value: 51 },
  { label: 'Thu', value: 69 },
  { label: 'Fri', value: 74 },
  { label: 'Sat', value: 47 },
  { label: 'Sun', value: 55 },
]

export const recentCandidates: RecentCandidate[] = [
  {
    id: 'cand-1',
    name: 'Ayesha Malik',
    email: 'ayesha.malik@example.com',
    appliedRole: 'Senior React Engineer',
    status: 'Shortlisted',
    source: 'LinkedIn',
    appliedAt: '2 hours ago',
  },
  {
    id: 'cand-2',
    name: 'Omar Nadeem',
    email: 'omar.nadeem@example.com',
    appliedRole: 'Product Manager',
    status: 'Interviewed',
    source: 'Referral',
    appliedAt: 'Today',
  },
  {
    id: 'cand-3',
    name: 'Sara Wilson',
    email: 'sara.wilson@example.com',
    appliedRole: 'Data Analyst',
    status: 'Screening',
    source: 'Career page',
    appliedAt: 'Yesterday',
  },
  {
    id: 'cand-4',
    name: 'Bilal Khan',
    email: 'bilal.khan@example.com',
    appliedRole: 'UX Researcher',
    status: 'Offer Sent',
    source: 'Referral',
    appliedAt: '3 days ago',
  },
]

export const candidateStats: DashboardStat[] = [
  {
    label: 'Applications',
    value: '12',
    hint: '4 under review',
    trend: '+3 in the last 7 days',
  },
  {
    label: 'Interviews',
    value: '3',
    hint: '2 upcoming this week',
    trend: '+1 from last week',
  },
  {
    label: 'Profile completion',
    value: '78%',
    hint: 'Missing references and skills test',
    trend: 'Ready to improve',
  },
  {
    label: 'Match score',
    value: '91%',
    hint: 'Based on experience and skills',
    trend: '+4 points from last month',
  },
]

export const appliedJobs: AppliedJob[] = [
  {
    id: 'job-1',
    title: 'Senior UI Engineer',
    company: 'Nimbus AI',
    location: 'Remote',
    type: 'Full-time',
    status: 'In review',
    matchScore: 94,
    appliedAt: 'Today',
  },
  {
    id: 'job-2',
    title: 'Design System Lead',
    company: 'Northwind Labs',
    location: 'Lahore, PK',
    type: 'Hybrid',
    status: 'Interview',
    matchScore: 89,
    appliedAt: '2 days ago',
  },
  {
    id: 'job-3',
    title: 'Frontend Architect',
    company: 'Cortex Studio',
    location: 'Remote',
    type: 'Contract',
    status: 'Applied',
    matchScore: 86,
    appliedAt: '4 days ago',
  },
]

export const recommendedJobs: RecommendedJob[] = [
  {
    id: 'rec-1',
    title: 'Product Designer',
    company: 'BluePeak',
    location: 'Remote',
    type: 'Full-time',
    matchScore: 96,
    summary: 'Strong overlap with your design system and analytics experience.',
  },
  {
    id: 'rec-2',
    title: 'Frontend Developer',
    company: 'Arbor Finance',
    location: 'Islamabad, PK',
    type: 'Hybrid',
    matchScore: 92,
    summary: 'Needs React, TypeScript, and reusable component expertise.',
  },
  {
    id: 'rec-3',
    title: 'UX Engineer',
    company: 'Northstar Health',
    location: 'Remote',
    type: 'Full-time',
    matchScore: 90,
    summary: 'Best fit for candidates who can bridge product and design.',
  },
]

export const profileChecklist: ProfileChecklist = {
  percent: 78,
  completed: ['Personal details', 'Resume upload', 'Portfolio link'],
  pending: ['Skills assessment', 'Reference contacts'],
}
