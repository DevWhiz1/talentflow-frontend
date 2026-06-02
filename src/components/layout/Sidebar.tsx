import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart2,
  Briefcase,
  CalendarClock,
  ChevronUp,
  Circle,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  ClipboardCheck,
  Settings,
  Users,
  X,
} from 'lucide-react'
import type { UserRole } from '../../types/auth'
import { appRoutes } from '../../constants/routes'
import { classNames } from '../../utils/classNames'
import talentflowLogo from '../../assets/talentflow-logo.png'

interface SidebarChildLink {
  label: string
  to: string
  icon?: JSX.Element
}

interface SidebarItem {
  label: string
  icon: JSX.Element
  to?: string
  children?: SidebarChildLink[]
}

interface SidebarConfig {
  primary: SidebarItem[]
  secondary: SidebarItem[]
}

const adminSidebarConfig: SidebarConfig = {
  primary: [
    {
      label: 'Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
      to: `${appRoutes.adminDashboard}#overview`,
    },
    {
      label: 'Reports',
      icon: <FileText className="h-4 w-4" />,
      to: `${appRoutes.adminDashboard}#reports`,
    },
    {
      label: 'Create Job',
      icon: <Briefcase className="h-4 w-4" />,
      to: appRoutes.adminJobsNew,
    },
    {
      label: 'HR Jobs',
      icon: <FileText className="h-4 w-4" />,
      to: appRoutes.adminHrJobs,
    },
    {
      label: 'Scoring',
      icon: <ListChecks className="h-4 w-4" />,
      to: appRoutes.adminHrScoring,
    },
    {
      label: 'Assessments',
      icon: <ClipboardCheck className="h-4 w-4" />,
      to: appRoutes.adminAssessments,
    },
    {
      label: 'Interviews',
      icon: <CalendarClock className="h-4 w-4" />,
      to: appRoutes.adminInterviews,
      children: [
        { label: 'All Interviews', to: appRoutes.adminInterviews, icon: <Circle className="h-3 w-3 fill-current" /> },
        { label: 'Shortlisted Candidates', to: appRoutes.adminInterviewShortlist, icon: <Users className="h-4 w-4" /> },
        { label: 'Schedule Interview', to: appRoutes.adminInterviewSchedule, icon: <CalendarClock className="h-4 w-4" /> },
        { label: 'Scheduled Interviews', to: appRoutes.adminInterviewScheduled, icon: <ListChecks className="h-4 w-4" /> },
      ],
    },
    {
      label: 'Company Profile',
      icon: <Users className="h-4 w-4" />,
      to: appRoutes.adminProfile,
    },
    {
      label: 'Analytics',
      icon: <BarChart2 className="h-4 w-4" />,
      to: appRoutes.adminAnalytics,
    },
  ],
  secondary: [
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      label: 'Help',
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ],
}

const candidateSidebarConfig: SidebarConfig = {
  primary: [
    {
      label: 'Overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
      to: `${appRoutes.userDashboard}#overview`,
    },
    {
      label: 'Jobs',
      icon: <FileText className="h-4 w-4" />,
      to: appRoutes.candidateJobs,
    },
    {
      label: 'Assessments',
      icon: <ClipboardCheck className="h-4 w-4" />,
      to: appRoutes.candidateAssessments,
    },
    {
      label: 'Profile',
      icon: <Users className="h-4 w-4" />,
      to: appRoutes.userProfile,
    },
  ],
  secondary: [
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      label: 'Help',
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ],
}

function getSidebarConfig(role: UserRole): SidebarConfig {
  return role === 'admin' ? adminSidebarConfig : candidateSidebarConfig
}

export function BrandMark({ collapsed = false }: { collapsed?: boolean }): JSX.Element {
  return (
    <div className={classNames('flex items-center gap-3', collapsed ? 'justify-center' : '')}>
      <img src={talentflowLogo} alt="TalentFlow Logo" className="h-10 w-10" />
      {!collapsed && (
        <div>
          <p className="text-sm font-semibold text-slate-900">TalentFlow</p>
          <p className="text-xs text-slate-500">Hiring workspace</p>
        </div>
      )}
    </div>
  )
}

function SidebarItemRow({
  item,
  active,
  collapsed,
  grouped = false,
}: {
  item: SidebarItem
  active: boolean
  collapsed: boolean
  grouped?: boolean
}): JSX.Element {
  const content = (
    <div
      className={classNames(
        'flex items-center rounded-2xl px-3 py-2 text-sm transition',
        grouped && active ? 'bg-blue-50 text-blue-700' : active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
        collapsed ? 'justify-center' : 'gap-3',
      )}
    >
      <span
        className={classNames(
          'inline-flex h-8 w-8 items-center justify-center rounded-xl',
          grouped && active ? 'bg-blue-600 text-white' : active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600',
        )}
      >
        {item.icon}
      </span>
      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
    </div>
  )

  if (!item.to) {
    return content
  }

  return (
    <Link to={item.to} className="block">
      {content}
    </Link>
  )
}

function SidebarSection({
  items,
  currentPath,
  collapsed,
}: {
  items: SidebarItem[]
  currentPath: string
  collapsed: boolean
}): JSX.Element {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (label: string): void => {
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }))
  }

  const closeGroup = (label: string): void => {
    setOpenGroups((current) => ({ ...current, [label]: false }))
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const hasChildren = item.children && item.children.length > 0
        const isActiveDirect = item.to
          ? currentPath === item.to
            || (item.to === appRoutes.adminInterviews && currentPath.startsWith(appRoutes.adminInterviews))
            || (item.to === appRoutes.adminHrScoring && currentPath.startsWith(appRoutes.adminHrScoring))
          : false
        const isActiveChild =
          hasChildren && item.children!.some((child) => currentPath === child.to)
        const active = isActiveDirect || Boolean(isActiveChild)

        if (hasChildren && !collapsed) {
          const open = Boolean(openGroups[item.label])
          return (
            <div key={item.label} className="rounded-2xl bg-transparent">
              <button type="button" className="block w-full" onClick={() => toggleGroup(item.label)}>
                <div className="relative">
                  <SidebarItemRow item={{ ...item, to: undefined }} active={active} collapsed={collapsed} grouped />
                  <ChevronUp
                    className={classNames(
                      'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 transition',
                      !open && 'rotate-180',
                    )}
                  />
                </div>
              </button>
              {open ? <div className="relative ml-7 mt-2 space-y-1 border-l border-blue-100 pl-3">
                {item.children!.map((child) => {
                  const childActive = child.to === appRoutes.adminInterviews
                    ? currentPath === child.to
                    : currentPath.startsWith(child.to)
                  return (
                    <Link key={child.to} to={child.to} className="block" onClick={() => closeGroup(item.label)}>
                      <div
                        className={classNames(
                          'relative flex items-center gap-3 rounded-none px-3 py-2.5 text-sm transition',
                          childActive ? 'bg-blue-50 text-blue-700 shadow-[inset_2px_0_0_#2563eb]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        )}
                      >
                        <span className={classNames('inline-flex h-5 w-5 items-center justify-center', childActive ? 'text-blue-700' : 'text-slate-500')}>
                          {child.icon || <BarChart2 className="h-4 w-4" />}
                        </span>
                        <span className="truncate">{child.label}</span>
                      </div>
                    </Link>
                  )
                })}
              </div> : null}
            </div>
          )
        }

        return (
          <SidebarItemRow
            key={item.label}
            item={item}
            active={active}
            collapsed={collapsed}
          />
        )
      })}
    </div>
  )
}

export interface SidebarProps {
  role: UserRole
  currentPath: string
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  role,
  currentPath,
  collapsed,
  onToggleCollapse,
}: SidebarProps): JSX.Element {
  const config = getSidebarConfig(role)

  return (
    <aside
      className={classNames(
        'hidden h-screen shrink-0 bg-transparent lg:flex',
        collapsed ? 'w-[80px]' : 'w-[260px]',
      )}
    >
      <div className="m-2 flex h-[calc(100vh-16px)] w-full flex-col justify-between rounded-3xl bg-white px-3 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 pb-4">
          <BrandMark collapsed={collapsed} />
          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <span className="text-xs">&gt;</span>
            ) : (
              <span className="text-xs">&lt;</span>
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto pb-4 pt-1">
          <SidebarSection items={config.primary} currentPath={currentPath} collapsed={collapsed} />

          <div className="border-t border-slate-100 pt-4">
            <SidebarSection items={config.secondary} currentPath={currentPath} collapsed={collapsed} />
          </div>
        </nav>

        {/* <div className="mt-2 rounded-2xl border border-slate-100 px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
                <p className="truncate text-xs text-slate-500">Active user</p>
              </div>
            )}
          </div>
        </div> */}
      </div>
    </aside>
  )
}

export interface MobileSidebarProps {
  role: UserRole
  currentPath: string
  open: boolean
  onClose: () => void
}

export function MobileSidebar({
  role,
  currentPath,
  open,
  onClose,
}: MobileSidebarProps): JSX.Element {
  const config = getSidebarConfig(role)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <div
      className={classNames(
        'fixed inset-0 z-40 lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={classNames(
          'absolute inset-0 bg-slate-900/40 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
        aria-label="Close sidebar overlay"
      />

      <aside
        className={classNames(
          'absolute left-0 top-0 h-full w-[min(280px,86vw)] bg-white shadow-xl transition-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex h-full flex-col px-3 py-3">
          <nav className="flex-1 space-y-6 overflow-y-auto pb-4 pt-1">
            <SidebarSection items={config.primary} currentPath={currentPath} collapsed={false} />

            <div className="border-t border-slate-100 pt-4">
              <SidebarSection items={config.secondary} currentPath={currentPath} collapsed={false} />
            </div>
          </nav>

          {/* <div className="mt-2 rounded-2xl border border-slate-100 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{userName}</p>
                <p className="truncate text-xs text-slate-500">Active user</p>
              </div>
            </div>
          </div> */}
        </div>
      </aside>
    </div>
  )
}
