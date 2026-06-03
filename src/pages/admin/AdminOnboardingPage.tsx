import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Eye, PlayCircle, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import {
  getOfferLetters,
  getOnboardings,
  startOnboardingFromOffer,
  type OfferLetter,
  type Onboarding,
} from '../../services/offerOnboardingService'
import { getErrorMessage } from '../../utils/errors'

function tone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'completed') return 'success'
  if (['started', 'documents_submitted', 'under_review'].includes(status)) return 'info'
  if (['pending_documents', 'not_started', 'on_hold'].includes(status)) return 'warning'
  if (status === 'cancelled') return 'danger'
  return 'neutral'
}

function dateText(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

function candidateDisplay(record: Onboarding): string {
  const name = record.candidate_name?.trim()
  return name ? `${name} (#${record.candidate_id})` : `Candidate #${record.candidate_id}`
}

export function AdminOnboardingPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [offers, setOffers] = useState<OfferLetter[]>([])
  const [onboardings, setOnboardings] = useState<Onboarding[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      const [offerList, onboardingList] = await Promise.all([getOfferLetters(), getOnboardings()])
      setOffers(offerList)
      setOnboardings(onboardingList)
    } catch (error) {
      showToast({ title: 'Unable to load onboarding', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const acceptedOffers = useMemo(() => {
    const startedOfferIds = new Set(onboardings.map((item) => item.offer_letter_id).filter(Boolean))
    return offers.filter((offer) => offer.status === 'accepted' && !startedOfferIds.has(offer.id))
  }, [offers, onboardings])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return onboardings
    return onboardings.filter((item) =>
      `${candidateDisplay(item)} ${item.candidate_email || ''} ${item.job_title || ''} ${item.department || ''} ${item.reporting_manager || ''} ${item.status}`
        .toLowerCase()
        .includes(query),
    )
  }, [onboardings, search])

  const startOnboarding = async (offerId: number): Promise<void> => {
    try {
      const record = await startOnboardingFromOffer(offerId)
      showToast({ title: 'Onboarding started', variant: 'success' })
      navigate(appRoutes.adminOnboardingDetail.replace(':onboardingId', String(record.id)))
    } catch (error) {
      showToast({ title: 'Could not start onboarding', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title="Onboarding" description="Start from accepted offers, then manage each onboarding record from its detail page.">
      <div className="space-y-4">
        {acceptedOffers.length ? (
          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">Accepted Offers Waiting For Onboarding</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {acceptedOffers.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{offer.candidate_name || `Candidate #${offer.candidate_id}`}</p>
                  <p className="mt-1 text-sm text-slate-500">{offer.job_title} - joins {dateText(offer.joining_date)}</p>
                  <Button className="mt-3" size="sm" onClick={() => void startOnboarding(offer.id)}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Onboarding
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        <Card className="p-5">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">All Onboarding Records</h2>
              <p className="mt-1 text-sm text-slate-600">{filtered.length} records</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search onboarding..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-3">Candidate</th>
                  <th className="px-3 py-3">Job</th>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3">Manager</th>
                  <th className="px-3 py-3">Joining</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-slate-900">{candidateDisplay(item)}</p>
                      {item.candidate_email ? <p className="mt-1 text-xs text-slate-500">{item.candidate_email}</p> : null}
                    </td>
                    <td className="px-3 py-3 text-slate-700">{item.job_title || '-'}</td>
                    <td className="px-3 py-3 text-slate-700">{item.department || '-'}</td>
                    <td className="px-3 py-3 text-slate-700">{item.reporting_manager || '-'}</td>
                    <td className="px-3 py-3 text-slate-700">{dateText(item.joining_date)}</td>
                    <td className="px-3 py-3"><Badge tone={tone(item.status)}>{item.status}</Badge></td>
                    <td className="px-3 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => navigate(appRoutes.adminOnboardingDetail.replace(':onboardingId', String(item.id)))}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      {isLoading ? 'Loading onboarding records...' : 'No onboarding records found.'}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
