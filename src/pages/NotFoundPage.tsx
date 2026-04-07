import type { JSX } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { appRoutes } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

export function NotFoundPage(): JSX.Element {
  const { dashboardPath, isAuthenticated } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-xl p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to={isAuthenticated ? dashboardPath : appRoutes.login}>
            <Button>Go to dashboard</Button>
          </Link>
          <Link to={appRoutes.login}>
            <Button variant="secondary">Sign in</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
