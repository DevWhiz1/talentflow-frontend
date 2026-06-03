import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Mail } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input, Select } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import {
  getOnboarding,
  sendWelcomeEmail,
  updateOnboarding,
  type Onboarding,
  type OnboardingPayload,
  type OnboardingStatus,
  type OnboardingTask,
} from '../../services/offerOnboardingService'
import { resolveAssetUrl } from '../../utils/assetUrl'
import { getErrorMessage } from '../../utils/errors'

const statuses: OnboardingStatus[] = ['not_started', 'started', 'pending_documents', 'documents_submitted', 'under_review', 'completed', 'on_hold', 'cancelled']

function tone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'completed') return 'success'
  if (['started', 'documents_submitted', 'under_review'].includes(status)) return 'info'
  if (['pending_documents', 'not_started', 'on_hold'].includes(status)) return 'warning'
  if (status === 'cancelled') return 'danger'
  return 'neutral'
}

function candidateDisplay(record: Onboarding): string {
  const name = record.candidate_name?.trim()
  return name ? `${name} (#${record.candidate_id})` : `Candidate #${record.candidate_id}`
}

export function AdminOnboardingDetailPage(): JSX.Element {
  const { onboardingId } = useParams<{ onboardingId: string }>()
  const { showToast } = useToast()
  const [record, setRecord] = useState<Onboarding | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async (): Promise<void> => {
    if (!onboardingId) return
    try {
      setIsLoading(true)
      setRecord(await getOnboarding(Number(onboardingId)))
    } catch (error) {
      showToast({ title: 'Unable to load onboarding', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [onboardingId, showToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const patchRecord = async (patch: OnboardingPayload, title = 'Onboarding updated'): Promise<void> => {
    if (!record) return
    try {
      setRecord(await updateOnboarding(record.id, patch))
      showToast({ title, variant: 'success' })
    } catch (error) {
      showToast({ title: 'Could not update onboarding', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const updateTask = (index: number, patch: Partial<OnboardingTask>): void => {
    if (!record) return
    const checklist = [...(record.checklist || [])]
    checklist[index] = { ...checklist[index], ...patch }
    void patchRecord({ checklist }, 'Checklist updated')
  }

  const sendWelcome = async (): Promise<void> => {
    if (!record) return
    try {
      setRecord(await sendWelcomeEmail(record.id))
      showToast({ title: 'Welcome email sent', variant: 'success' })
    } catch (error) {
      showToast({ title: 'Could not send welcome email', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title="Onboarding Detail" description="Update joining details, document checks, and completion state.">
      <Card className="p-6">
        {isLoading || !record ? <p className="text-sm text-slate-600">Loading onboarding record...</p> : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{record.job_title || 'Onboarding'}</h2>
                <p className="mt-1 text-sm text-slate-600">{candidateDisplay(record)}</p>
                {record.candidate_email ? <p className="mt-1 text-xs text-slate-500">{record.candidate_email}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={tone(record.status)}>{record.status}</Badge>
                <Button variant="secondary" onClick={() => void sendWelcome()}><Mail className="mr-2 h-4 w-4" />Welcome Email</Button>
                <Button onClick={() => void patchRecord({ status: 'completed' }, 'Onboarding completed')}><CheckCircle2 className="mr-2 h-4 w-4" />Complete</Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Select label="Status" value={record.status} onChange={(event) => void patchRecord({ status: event.target.value as OnboardingStatus })}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</Select>
              <Input label="Employee ID" value={record.employee_id || ''} onBlur={(event) => void patchRecord({ employee_id: event.target.value })} onChange={(event) => setRecord({ ...record, employee_id: event.target.value })} />
              <Input label="Department" value={record.department || ''} onBlur={(event) => void patchRecord({ department: event.target.value })} onChange={(event) => setRecord({ ...record, department: event.target.value })} />
              <Input label="Reporting Manager" value={record.reporting_manager || ''} onBlur={(event) => void patchRecord({ reporting_manager: event.target.value })} onChange={(event) => setRecord({ ...record, reporting_manager: event.target.value })} />
              <Input label="Joining Date" type="date" value={record.joining_date?.slice(0, 10) || ''} onChange={(event) => void patchRecord({ joining_date: new Date(event.target.value).toISOString() })} />
              <Input label="Verification Notes" value={record.verification_notes || ''} onBlur={(event) => void patchRecord({ verification_notes: event.target.value })} onChange={(event) => setRecord({ ...record, verification_notes: event.target.value })} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Checklist</h3>
                <div className="mt-3 space-y-2">
                  {(record.checklist || []).map((task, index) => (
                    <label key={`${task.title}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <input type="checkbox" checked={task.status === 'completed'} onChange={(event) => updateTask(index, { status: event.target.checked ? 'completed' : 'pending' })} />
                      <span className="flex-1 text-slate-800">{task.title}</span>
                      <Badge tone={task.status === 'completed' ? 'success' : 'warning'}>{task.status}</Badge>
                    </label>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Documents</h3>
                <div className="mt-3 space-y-2">
                  {(record.documents || []).map((document) => (
                    <div key={document.name} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">{document.name}</span>
                        <Badge tone={document.status === 'verified' ? 'success' : document.url ? 'info' : 'warning'}>{document.status}</Badge>
                      </div>
                      {document.url ? <a href={resolveAssetUrl(document.url)} className="mt-1 block text-teal-700" target="_blank" rel="noreferrer">Open document</a> : null}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </Card>
    </AppShell>
  )
}
