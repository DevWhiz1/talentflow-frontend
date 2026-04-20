import type { AuthUser } from './auth'

export interface CandidateProfileUpdatePayload {
  name?: string
  phone?: string
  profile_image?: string
  candidate_headline?: string
  bio?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  skills?: string[]
  current_location?: string
  education?: string
  experience_years?: number
  resume_url?: string
}

export interface AdminProfileUpdatePayload {
  name?: string
  phone?: string
  profile_image?: string
  company_name?: string
  company_website?: string
  company_address?: string
  company_industry?: string
  company_size?: string
  hr_designation?: string
  hr_department?: string
  company_description?: string
}

export interface BackendProfileUser {
  id: string | number
  name: string
  email: string
  role: string
  phone?: string
  profile_image?: string
  company_name?: string
  company_website?: string
  company_address?: string
  company_industry?: string
  company_size?: string
  hr_designation?: string
  hr_department?: string
  company_description?: string
  company_logo?: string
  linkedin_url?: string
  github_url?: string
  portfolio_url?: string
  candidate_headline?: string
  bio?: string
  skills?: string[]
  current_location?: string
  education?: string
  experience_years?: number
  resume_url?: string
  profile_completed?: boolean
  profile_completion?: number
}

export const normalizeUserRole = (role: string): 'admin' | 'candidate' => {
  const normalizedRole = role.toLowerCase()
  return normalizedRole.includes('admin') || normalizedRole.includes('hr') ? 'admin' : 'candidate'
}

export const mapBackendProfileUser = (user: BackendProfileUser): AuthUser => ({
  id: String(user.id),
  name: user.name,
  email: user.email,
  role: normalizeUserRole(user.role),
  phone: user.phone,
  profileImage: user.profile_image,
  companyName: user.company_name,
  companyWebsite: user.company_website,
  companyAddress: user.company_address,
  companyIndustry: user.company_industry,
  companySize: user.company_size,
  hrDesignation: user.hr_designation,
  hrDepartment: user.hr_department,
  companyDescription: user.company_description,
  companyLogo: user.company_logo,
  linkedinUrl: user.linkedin_url,
  githubUrl: user.github_url,
  portfolioUrl: user.portfolio_url,
  candidateHeadline: user.candidate_headline,
  bio: user.bio,
  skills: user.skills,
  currentLocation: user.current_location,
  education: user.education,
  experienceYears: user.experience_years,
  resumeUrl: user.resume_url,
  profileCompleted: user.profile_completed,
  profileCompletion: user.profile_completion,
})
