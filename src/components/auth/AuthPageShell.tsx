import type { JSX, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../layout'
import { Badge, Card } from '../ui'

interface AuthPageShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footerText: string
  footerLinkText: string
  footerLinkTo: string
}

export function AuthPageShell({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthPageShellProps): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.02fr,0.98fr] lg:px-8">
        <section className="flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div>
            <BrandMark />

            <div className="mt-10 max-w-2xl">
              <Badge tone="info">Enterprise HR platform</Badge>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{subtitle}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ['Role aware', 'Admin and candidate flows are isolated.'],
                ['Fast insights', 'Pipeline metrics update from dummy API data.'],
                ['Production ready', 'Modular structure with reusable UI primitives.'],
              ].map(([heading, copy]) => (
                <Card key={heading} className="p-4 shadow-none">
                  <p className="text-sm font-semibold text-slate-900">{heading}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Card className="border-slate-100 bg-slate-50 p-5 shadow-none">
              <p className="text-sm font-semibold text-slate-900">Admin workspace</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Monitor jobs, candidates, and application volumes from one clean dashboard.
              </p>
            </Card>
            <Card className="border-slate-100 bg-slate-50 p-5 shadow-none">
              <p className="text-sm font-semibold text-slate-900">Candidate workspace</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review applications, recommended jobs, and profile readiness in one place.
              </p>
            </Card>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-xl">
            <Card className="p-6 sm:p-8 lg:p-10">{children}</Card>

            <p className="mt-4 text-center text-sm text-slate-600">
              {footerText}{' '}
              <Link to={footerLinkTo} className="font-semibold text-teal-700 hover:text-teal-800">
                {footerLinkText}
              </Link>
            </p>

            <div className="mt-4 text-center text-xs text-slate-500">
              Demo accounts: admin@talentflow.dev / Admin@123 and candidate@talentflow.dev / Candidate@123.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
