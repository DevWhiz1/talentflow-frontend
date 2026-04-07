import type { JSX, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { appRoutes } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/auth'
import { classNames } from '../utils/classNames'
import { Sidebar, MobileSidebar } from './layout/Sidebar'
import { TopBar } from './layout/TopBar'

function getCurrentPath(pathname: string, hash: string): string {
  return `${pathname}${hash}`
}

interface AppShellProps {
  role: UserRole
  title: string
  description: string
  children: ReactNode
}

export function AppShell({ role, title, description, children }: AppShellProps): JSX.Element {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const currentPath = useMemo(
    () => getCurrentPath(location.pathname, location.hash),
    [location.hash, location.pathname],
  )

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname, location.hash])

  const handleLogout = (): void => {
    logout()
    navigate(appRoutes.login, { replace: true })
  }

  const userName = user?.name ?? 'User'
  const userEmail = user?.email ?? ''

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen w-full">
        <Sidebar
          role={role}
          userName={userName}
          currentPath={currentPath}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            userName={userName}
            userEmail={userEmail}
            onLogout={handleLogout}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />

          <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1200px] space-y-4">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {role} dashboard
                  </p>
                  <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600">{description}</p>
                </div>
              </div>

              <div className={classNames('rounded-2xl bg-transparent')}>{children}</div>
            </div>
          </main>
        </div>
      </div>

      <MobileSidebar
        role={role}
        userName={userName}
        currentPath={currentPath}
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
    </div>
  )
}

export { BrandMark } from './layout/Sidebar'