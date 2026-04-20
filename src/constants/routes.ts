import type { UserRole } from '../types/auth'

export const appRoutes = {
  login: '/login',
  signup: '/signup',
  adminDashboard: '/admin/dashboard',
  adminAnalytics: '/admin/analytics',
  adminProfile: '/admin/profile',
  userDashboard: '/user/dashboard',
  userProfile: '/user/profile',
} as const

export const dashboardPathByRole: Record<UserRole, string> = {
  admin: appRoutes.adminDashboard,
  candidate: appRoutes.userDashboard,
}

export const profilePathByRole: Record<UserRole, string> = {
  admin: appRoutes.adminProfile,
  candidate: appRoutes.userProfile,
}
