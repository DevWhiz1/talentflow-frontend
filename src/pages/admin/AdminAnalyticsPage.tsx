import type { JSX } from 'react'
import { AppShell } from '../../components/layout'
import { Card } from '../../components/ui'

export function AdminAnalyticsPage(): JSX.Element {
  return (
    <AppShell
      role="admin"
      title="Analytics overview"
      description="Sample analytics page linked from the sidebar. Replace this with your real charts and reports."
    >
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Analytics placeholder</h2>
        <p className="mt-2 text-sm text-slate-600">
          This is a demo page to show navigation from the new sidebar. You can design your own analytics layout
          here using cards, charts, and tables.
        </p>
      </Card>
    </AppShell>
  )
}
