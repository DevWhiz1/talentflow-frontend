import type { JSX } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { appRoutes, dashboardPathByRole } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

function RouteLoader(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium text-slate-700 shadow-sm">
        Loading workspace...
      </div>
    </div>
  )
}

interface ProtectedRouteProps {
  allowedRoles?: Array<'admin' | 'candidate'>
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps): JSX.Element {
  const { dashboardPath, isAuthenticated, isHydrated, user } = useAuth()

  if (!isHydrated) {
    return <RouteLoader />
  }

  if (!isAuthenticated || !user) {
    return <Navigate replace to={appRoutes.login} />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate replace to={dashboardPathByRole[user.role] ?? dashboardPath} />
  }

  return <Outlet />
}

export function PublicRoute(): JSX.Element {
  const { dashboardPath, isAuthenticated, isHydrated } = useAuth()

  if (!isHydrated) {
    return <RouteLoader />
  }

  if (isAuthenticated) {
    return <Navigate replace to={dashboardPath} />
  }

  return <Outlet />
}

export function HomeRedirect(): JSX.Element {
  const { dashboardPath, isAuthenticated, isHydrated } = useAuth()

  if (!isHydrated) {
    return <RouteLoader />
  }

  return <Navigate replace to={isAuthenticated ? dashboardPath : appRoutes.login} />
}
