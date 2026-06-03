import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Download, FileText, MessageSquare, XCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import {
  acceptOffer,
  downloadOfferPdf,
  getMyOfferLetters,
  markOfferViewed,
  previewOfferLetter,
  rejectOffer,
  requestOfferChanges,
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

export function CandidateOfferLettersPage(): JSX.Element {
  const { showToast } = useToast()
  const [searchParams] = useSearchParams()
  const [offers, setOffers] = useState<OfferLetter[]>([])
  const [selectedOffer, setSelectedOffer] = useState<OfferLetter | null>(null)
  const [preview, setPreview] = useState<OfferPreview | null>(null)
  const [comments, setComments] = useState('')
  const [changeRequest, setChangeRequest] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadOffers = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      const offerList = await getMyOfferLetters()
      setOffers(offerList)
      const linkedOfferId = Number(searchParams.get('offerId'))
      const linkedOffer = offerList.find((offer) => offer.id === linkedOfferId)
      if (!selectedOffer && (linkedOffer || offerList[0])) setSelectedOffer(linkedOffer || offerList[0])
    } catch (error) {
      showToast({ title: 'Unable to load offers', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [searchParams, selectedOffer, showToast])

  useEffect(() => {
    void loadOffers()
  }, [loadOffers])

  useEffect(() => {
    if (!selectedOffer) return
    void markOfferViewed(selectedOffer.id).catch(() => undefined)
    void previewOfferLetter(selectedOffer.id).then(setPreview).catch(() => setPreview(null))
  }, [selectedOffer])

  const handleDownload = async (offerId: number): Promise<void> => {
    const blob = await downloadOfferPdf(offerId)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `offer-letter-${offerId}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  const respond = async (action: 'accept' | 'reject' | 'changes'): Promise<void> => {
    if (!selectedOffer) return
    try {
      if (action === 'accept') await acceptOffer(selectedOffer.id, comments)
      if (action === 'reject') await rejectOffer(selectedOffer.id, comments || 'Rejected by candidate')
      if (action === 'changes') await requestOfferChanges(selectedOffer.id, changeRequest)
      showToast({ title: 'Offer response saved', variant: 'success' })
      setComments('')
      setChangeRequest('')
      await loadOffers()
    } catch (error) {
      showToast({ title: 'Could not update offer', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="candidate" title="Offer Letters" description="View offer details, download PDF, accept, reject, or request changes.">
      {isLoading ? <Card className="p-6 text-sm text-slate-600">Loading offer letters...</Card> : (
        <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-slate-900">My Offers</h2>
            <div className="mt-4 space-y-3">
              {offers.map((offer) => (
                <button key={offer.id} type="button" onClick={() => setSelectedOffer(offer)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-semibold text-slate-900">{offer.job_title}</p><p className="mt-1 text-sm text-slate-500">{offer.salary_currency} {offer.salary?.toLocaleString()} - starts {new Date(offer.joining_date).toLocaleDateString()}</p></div>
                    <Badge tone={tone(offer.status)}>{offer.status}</Badge>
                  </div>
                </button>
              ))}
              {offers.length === 0 ? <p className="text-sm text-slate-600">No offer letter is available yet.</p> : null}
            </div>
          </Card>

          <Card className="p-6">
            {selectedOffer ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
                  <div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><FileText className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold text-slate-900">{selectedOffer.job_title}</h2><p className="text-sm text-slate-600">{selectedOffer.department || 'Department'} - {selectedOffer.work_location || 'Work location'}</p></div></div>
                  <Button variant="secondary" onClick={() => void handleDownload(selectedOffer.id)}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
                </div>
                <div className="mt-5 max-h-[560px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <pre className="min-h-[460px] whitespace-pre-wrap rounded-lg bg-white p-6 text-sm leading-6 text-slate-700 shadow-sm">{preview?.body || 'Loading offer preview...'}</pre>
                </div>
                {['sent', 'viewed', 'revised'].includes(selectedOffer.status) ? (
                  <div className="mt-5 grid gap-4">
                    <Input label="Comments" value={comments} onChange={(event) => setComments(event.target.value)} />
                    <Input label="Request Changes" value={changeRequest} onChange={(event) => setChangeRequest(event.target.value)} disabled={!selectedOffer.allow_change_request} />
                    <div className="flex flex-wrap gap-3">
                      <Button onClick={() => void respond('accept')}><CheckCircle2 className="mr-2 h-4 w-4" />Accept Offer</Button>
                      <Button variant="secondary" onClick={() => void respond('changes')} disabled={!changeRequest || !selectedOffer.allow_change_request}><MessageSquare className="mr-2 h-4 w-4" />Request Changes</Button>
                      <Button variant="danger" onClick={() => void respond('reject')}><XCircle className="mr-2 h-4 w-4" />Reject Offer</Button>
                    </div>
                  </div>
                ) : <p className="mt-5 text-sm text-slate-600">This offer is currently {selectedOffer.status}.</p>}
              </>
            ) : <p className="text-sm text-slate-600">Select an offer to view details.</p>}
          </Card>
        </div>
      )}
    </AppShell>
  )
}
