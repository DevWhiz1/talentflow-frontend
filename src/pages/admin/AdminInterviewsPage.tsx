import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, ListChecks, Send, UserCheck } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'

const modules = [
  {
    title: 'Shortlisted Candidates',
    description: 'Review candidates ready for interview scheduling.',
    icon: <UserCheck className="h-5 w-5" />,
    to: appRoutes.adminInterviewShortlist,
  },
  {
    title: 'Schedule Interview',
    description: 'Create interview rounds, assign interviewers, send email invites, and create Meet links.',
    icon: <Send className="h-5 w-5" />,
    to: appRoutes.adminInterviewSchedule,
  },
  {
    title: 'Scheduled Interviews',
    description: 'Track upcoming and completed rounds, then open candidate evaluation details.',
    icon: <CalendarClock className="h-5 w-5" />,
    to: appRoutes.adminInterviewScheduled,
  },
]

export function AdminInterviewsPage(): JSX.Element {
  const navigate = useNavigate()

  return (
    <AppShell
      role="admin"
      title="Interviews"
      description="Manage interview shortlists, schedules, round evaluations, and final hiring decisions."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
          <button key={module.to} type="button" onClick={() => navigate(module.to)} className="text-left">
            <Card className="h-full p-5 transition hover:border-slate-300 hover:shadow-md">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                {module.icon}
              </span>
              <h2 className="mt-5 text-base font-semibold text-slate-900">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
            </Card>
          </button>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <ListChecks className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Interview Flow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              First shortlist candidates from scoring or applicant detail, schedule rounds from the shortlist,
              then open scheduled interviews to add remarks, ratings, recommendations, and final decisions.
            </p>
          </div>
        </div>
      </Card>
    </AppShell>
  )
}
