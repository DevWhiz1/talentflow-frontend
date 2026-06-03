import type { JSX } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Edit3, Eye, Plus, RefreshCw, Search, Send, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import {
  cancelOfferLetter,
  downloadOfferPdf,
  getOfferLetters,
  resendOfferLetter,
  sendOfferLetter,
  type OfferLetter,
} from '../../services/offerOnboardingService'
import { getErrorMessage } from '../../utils/errors'

const offerStatusOptions: Array<OfferLetter['status']> = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
  'cancelled',
  'revised',
]

function tone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'accepted') return 'success'
  if (['sent', 'viewed'].includes(status)) return 'info'
  if (['draft', 'revised'].includes(status)) return 'warning'
  if (['rejected', 'expired', 'cancelled'].includes(status)) return 'danger'
  return 'neutral'
}

function dateText(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

function candidateDisplayName(offer: OfferLetter): string {
  return offer.candidate_name?.trim() || offer.candidate_email?.split('@')[0] || 'Name unavailable'
}

async function downloadPdf(offerId: number): Promise<void> {
  const blob = await downloadOfferPdf(offerId)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `offer-letter-${offerId}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

export function AdminOfferLettersPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [offers, setOffers] = useState<OfferLetter[]>([])
  const [search, setSearch] = useState('')
  const [jobSearch, setJobSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OfferLetter['status']>('all')
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      setOffers(await getOfferLetters())
    } catch (error) {
      showToast({ title: 'Unable to load offers', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const jobQuery = jobSearch.trim().toLowerCase()
    return offers.filter((offer) => {
      const candidateMatches = !query
        || `${candidateDisplayName(offer)} ${offer.candidate_email || ''}`.toLowerCase().includes(query)
      const jobMatches = !jobQuery || `${offer.job_title || ''} ${offer.job_name || ''}`.toLowerCase().includes(jobQuery)
      const statusMatches = statusFilter === 'all' || offer.status === statusFilter
      return candidateMatches && jobMatches && statusMatches
    })
  }, [jobSearch, offers, search, statusFilter])

  const mutateOffer = async (action: () => Promise<OfferLetter>, title: string): Promise<void> => {
    try {
      await action()
      showToast({ title, variant: 'success' })
      await loadData()
    } catch (error) {
      showToast({ title: 'Offer action failed', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title="Offer Letters" description="Track every offer first, then open details or edit when needed.">
      <Card className="p-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">All Offer Letters</h2>
            <p className="mt-1 text-sm text-slate-600">{filtered.length} records</p>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidates..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                value={jobSearch}
                onChange={(event) => setJobSearch(event.target.value)}
                placeholder="Search jobs..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
              />
            </div>
            <select
              aria-label="Filter by offer status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | OfferLetter['status'])}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 sm:w-44"
            >
              <option value="all">All statuses</option>
              {offerStatusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <Button onClick={() => navigate(appRoutes.adminOfferLettersNew)}>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                <th className="px-3 py-3">Candidate</th>
                <th className="px-3 py-3">Job</th>
                <th className="px-3 py-3">Package</th>
                <th className="px-3 py-3">Joining</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((offer) => (
                <tr key={offer.id}>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{candidateDisplayName(offer)}</p>
                    <p className="mt-1 text-xs text-slate-500">{offer.candidate_email || '-'}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">{offer.job_title}</td>
                  <td className="px-3 py-3 text-slate-700">{offer.salary_currency} {offer.salary?.toLocaleString()}</td>
                  <td className="px-3 py-3 text-slate-700">{dateText(offer.joining_date)}</td>
                  <td className="px-3 py-3"><Badge tone={tone(offer.status)}>{offer.status}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => navigate(appRoutes.adminOfferLetterDetail.replace(':offerId', String(offer.id)))}><Eye className="mr-2 h-4 w-4" />View</Button>
                      <Button size="sm" variant="secondary" onClick={() => navigate(appRoutes.adminOfferLetterEdit.replace(':offerId', String(offer.id)))}><Edit3 className="mr-2 h-4 w-4" />Edit</Button>
                      <Button size="sm" onClick={() => void mutateOffer(() => sendOfferLetter(offer.id), 'Offer sent')}><Send className="mr-2 h-4 w-4" />Send</Button>
                      <Button size="sm" variant="secondary" onClick={() => void mutateOffer(() => resendOfferLetter(offer.id), 'Offer resent')}><RefreshCw className="mr-2 h-4 w-4" />Resend</Button>
                      <Button size="sm" variant="secondary" onClick={() => void downloadPdf(offer.id)}><Download className="mr-2 h-4 w-4" />PDF</Button>
                      <Button size="sm" variant="danger" onClick={() => void mutateOffer(() => cancelOfferLetter(offer.id), 'Offer cancelled')}><XCircle className="mr-2 h-4 w-4" />Cancel</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    {isLoading ? 'Loading offer letters...' : 'No offer letters found.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  )
}
