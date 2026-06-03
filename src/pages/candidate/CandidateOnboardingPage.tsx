import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import {
  getMyOnboarding,
  submitCandidateOnboarding,
  uploadOnboardingDocument,
  type Onboarding,
  type OnboardingDocument,
  type OnboardingTask,
} from '../../services/offerOnboardingService'
import { resolveAssetUrl } from '../../utils/assetUrl'
import { getErrorMessage } from '../../utils/errors'

function tone(status: string): 'neutral' | 'info' | 'success' | 'warning' | 'danger' {
  if (['completed', 'verified'].includes(status)) return 'success'
  if (['documents_submitted', 'under_review', 'uploaded'].includes(status)) return 'info'
  if (['started', 'pending', 'pending_documents', 'not_started'].includes(status)) return 'warning'
  if (['cancelled', 'rejected'].includes(status)) return 'danger'
  return 'neutral'
}

export function CandidateOnboardingPage(): JSX.Element {
  const { showToast } = useToast()
  const [onboarding, setOnboarding] = useState<Onboarding | null>(null)
  const [personalInformation, setPersonalInformation] = useState<Record<string, string>>({})
  const [bankDetails, setBankDetails] = useState<Record<string, string>>({})
  const [emergencyContact, setEmergencyContact] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  const loadOnboarding = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true)
      const record = await getMyOnboarding()
      setOnboarding(record)
      setPersonalInformation(record?.personal_information || {})
      setBankDetails(record?.bank_details || {})
      setEmergencyContact(record?.emergency_contact || {})
    } catch (error) {
      showToast({ title: 'Unable to load onboarding', description: getErrorMessage(error), variant: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadOnboarding()
  }, [loadOnboarding])

  const updateDocument = async (documentIndex: number, file?: File): Promise<void> => {
    if (!onboarding || !file) return
    try {
      const url = await uploadOnboardingDocument(file)
      const documents: OnboardingDocument[] = [...(onboarding.documents || [])]
      documents[documentIndex] = { ...documents[documentIndex], url, status: 'uploaded' }
      setOnboarding({ ...onboarding, documents })
      showToast({ title: 'Document uploaded', variant: 'success' })
    } catch (error) {
      showToast({ title: 'Upload failed', description: getErrorMessage(error), variant: 'error' })
    }
  }

  const toggleTask = (index: number, completed: boolean): void => {
    if (!onboarding) return
    const checklist: OnboardingTask[] = [...(onboarding.checklist || [])]
    checklist[index] = { ...checklist[index], status: completed ? 'completed' : 'pending' }
    setOnboarding({ ...onboarding, checklist })
  }

  const submit = async (): Promise<void> => {
    if (!onboarding) return
    try {
      await submitCandidateOnboarding(onboarding.id, {
        documents: onboarding.documents || [],
        checklist: onboarding.checklist || [],
        personal_information: personalInformation,
        bank_details: bankDetails,
        emergency_contact: emergencyContact,
      })
      showToast({ title: 'Onboarding submitted', description: 'HR can now verify your details.', variant: 'success' })
      await loadOnboarding()
    } catch (error) {
      showToast({ title: 'Could not submit onboarding', description: getErrorMessage(error), variant: 'error' })
    }
  }

  return (
    <AppShell role="candidate" title="Onboarding" description="Complete your joining forms, upload required documents, and track onboarding progress.">
      {isLoading ? <Card className="p-6 text-sm text-slate-600">Loading onboarding...</Card> : !onboarding ? (
        <Card className="p-6"><p className="font-semibold text-slate-900">Onboarding has not started yet.</p><p className="mt-2 text-sm text-slate-600">This module becomes available after you accept an offer and HR starts onboarding.</p></Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr,360px]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-5">
                <div><h2 className="text-xl font-semibold text-slate-900">{onboarding.job_title || 'Joining Formalities'}</h2><p className="text-sm text-slate-600">{onboarding.department || 'Department'} - joins {onboarding.joining_date ? new Date(onboarding.joining_date).toLocaleDateString() : 'TBD'}</p></div>
                <Badge tone={tone(onboarding.status)}>{onboarding.status}</Badge>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input label="Full Legal Name" value={personalInformation.full_name || ''} onChange={(event) => setPersonalInformation({ ...personalInformation, full_name: event.target.value })} />
                <Input label="CNIC / Passport Number" value={personalInformation.identity_number || ''} onChange={(event) => setPersonalInformation({ ...personalInformation, identity_number: event.target.value })} />
                <Input label="Date of Birth" type="date" value={personalInformation.date_of_birth || ''} onChange={(event) => setPersonalInformation({ ...personalInformation, date_of_birth: event.target.value })} />
                <Input label="Current Address" value={personalInformation.address || ''} onChange={(event) => setPersonalInformation({ ...personalInformation, address: event.target.value })} />
                <Input label="Bank Name" value={bankDetails.bank_name || ''} onChange={(event) => setBankDetails({ ...bankDetails, bank_name: event.target.value })} />
                <Input label="Account Number" value={bankDetails.account_number || ''} onChange={(event) => setBankDetails({ ...bankDetails, account_number: event.target.value })} />
                <Input label="Emergency Contact Name" value={emergencyContact.name || ''} onChange={(event) => setEmergencyContact({ ...emergencyContact, name: event.target.value })} />
                <Input label="Emergency Contact Phone" value={emergencyContact.phone || ''} onChange={(event) => setEmergencyContact({ ...emergencyContact, phone: event.target.value })} />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Required Documents</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(onboarding.documents || []).map((document, index) => (
                  <div key={document.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-2"><p className="font-medium text-slate-900">{document.name}</p><Badge tone={tone(document.status)}>{document.status}</Badge></div>
                    <label className="mt-3 inline-flex cursor-pointer items-center rounded-xl border border-black bg-white px-3 py-2 text-sm font-medium text-black hover:bg-slate-100">
                      <Upload className="mr-2 h-4 w-4" />Upload
                      <input className="sr-only" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(event) => void updateDocument(index, event.target.files?.[0])} />
                    </label>
                    {document.url ? <a href={resolveAssetUrl(document.url)} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-teal-700">Uploaded file</a> : null}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-slate-900">Task Checklist</h2>
              <div className="mt-4 space-y-2">
                {(onboarding.checklist || []).map((task, index) => (
                  <label key={`${task.title}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <input type="checkbox" checked={task.status === 'completed'} onChange={(event) => toggleTask(index, event.target.checked)} />
                    <span className="flex-1 text-slate-800">{task.title}</span>
                  </label>
                ))}
              </div>
              <Button className="mt-5 w-full" onClick={() => void submit()}>Submit Onboarding</Button>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  )
}
