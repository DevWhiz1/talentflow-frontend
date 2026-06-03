import type { JSX } from 'react'
import { useEffect, useState } from 'react'
import { Download, Edit3, Send } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card } from '../../components/ui'
import { appRoutes } from '../../constants/routes'
import { useToast } from '../../hooks/useToast'
import {
  downloadOfferPdf,
  getOfferLetter,
  previewOfferLetter,
  sendOfferLetter,
  type OfferLetter,
  type OfferPreview,
} from '../../services/offerOnboardingService'
import { getErrorMessage } from '../../utils/errors'

function tone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (status === 'accepted') return 'success'
  if (['sent', 'viewed'].includes(status)) return 'info'
  if (['draft', 'revised'].includes(status)) return 'warning'
  if (['rejected', 'expired', 'cancelled'].includes(status)) return 'danger'
  return 'neutral'
}

function valueText(value?: string | number | null): string {
  return value == null || value === '' ? '-' : String(value)
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

export function AdminOfferLetterDetailPage(): JSX.Element {
  const { offerId } = useParams<{ offerId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [offer, setOffer] = useState<OfferLetter | null>(null)
  const [preview, setPreview] = useState<OfferPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      if (!offerId) return
      try {
        setIsLoading(true)
        const numericId = Number(offerId)
        const [offerData, previewData] = await Promise.all([getOfferLetter(numericId), previewOfferLetter(numericId)])
        setOffer(offerData)
        setPreview(previewData)
      } catch (error) {
        showToast({ title: 'Unable to load offer', description: getErrorMessage(error), variant: 'error' })
      } finally {
        setIsLoading(false)
      }
    }
    void loadData()
  }, [offerId, showToast])

  const handleSend = async (): Promise<void> => {
    if (!offer) return
    try {
      setOffer(await sendOfferLetter(offer.id))
      showToast({ title: 'Offer sent', variant: 'success' })
    } catch (error) {
      showToast({ title: 'Unable to send offer', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="admin" title="Offer Letter Detail" description="Review the generated letter and candidate response history.">
      <div className="space-y-4">
        <Card className="p-5">
          {isLoading || !offer ? <p className="text-sm text-slate-600">Loading offer letter...</p> : (
            <>
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{offer.candidate_name || `Candidate #${offer.candidate_id}`}</h2>
                  <p className="mt-1 text-sm text-slate-600">{offer.job_title}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={tone(offer.status)}>{offer.status}</Badge>
                  <Button size="sm" variant="secondary" onClick={() => navigate(appRoutes.adminOfferLetterEdit.replace(':offerId', String(offer.id)))}><Edit3 className="mr-2 h-4 w-4" />Edit</Button>
                  <Button size="sm" onClick={() => void handleSend()}><Send className="mr-2 h-4 w-4" />Send</Button>
                  <Button size="sm" variant="secondary" onClick={() => void downloadPdf(offer.id)}><Download className="mr-2 h-4 w-4" />PDF</Button>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Detail label="Email" value={valueText(offer.candidate_email)} />
                <Detail label="Department" value={valueText(offer.department)} />
                <Detail label="Salary" value={`${offer.salary_currency} ${offer.salary?.toLocaleString()}`} />
                <Detail label="Joining Date" value={offer.joining_date ? new Date(offer.joining_date).toLocaleDateString() : '-'} />
                <Detail label="Manager" value={valueText(offer.reporting_manager)} />
                <Detail label="Location" value={valueText(offer.work_location)} />
              </div>
            </>
          )}
        </Card>

        {preview ? (
          <Card className="p-5">
            <h2 className="text-base font-semibold text-slate-900">{preview.subject}</h2>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{preview.body}</pre>
          </Card>
        ) : null}
      </div>
    </AppShell>
  )
}

function Detail({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}
