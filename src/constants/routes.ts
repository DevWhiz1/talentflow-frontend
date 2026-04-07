import type { UserRole } from '../types/auth'

export const appRoutes = {
  login: '/login',
  signup: '/signup',
  adminDashboard: '/admin/dashboard',
  adminAnalytics: '/admin/analytics',
  userDashboard: '/user/dashboard',
} as const

export const dashboardPathByRole: Record<UserRole, string> = {
  admin: appRoutes.adminDashboard,
  candidate: appRoutes.userDashboard,
}
