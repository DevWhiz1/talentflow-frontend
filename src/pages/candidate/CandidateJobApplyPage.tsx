import type { JSX, ChangeEvent, DragEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { ArrowLeft, FileText, Plus, Trash2, UploadCloud, Download } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input, SectionHeader } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { getJobOpeningById, getMyJobApplications, submitJobApplication, uploadApplicationDocument } from '../../services/jobService'
import { parseResume } from '../../services/resumeService'
import type { CandidateJobOpening, JobApplicationSubmitPayload } from '../../types/jobApplication'
import { getErrorMessage } from '../../utils/errors'
import { slugify } from '../../utils/slug'

const educationSchema = z.object({
  school: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  degree: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
})

const experienceSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  summary: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
})

const applicationSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  headline: z.string().optional(),
  phone: z.string().min(8, 'Phone number is required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  portfolioUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  resumeUrl: z.string().url('Upload your resume before submitting'),
  coverLetter: z.string().optional(),
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
})

type ApplicationFormValues = z.infer<typeof applicationSchema>

const buildDetailPath = (companySlug: string, jobId: number): string => `/user/jobs/${companySlug}/${jobId}`
const buildCompanyPath = (companySlug: string): string => `/user/jobs/${companySlug}`

const initialEducation = {
  school: '',
  fieldOfStudy: '',
  degree: '',
  startDate: '',
  endDate: '',
  description: '',
}

const initialExperience = {
  title: '',
  company: '',
  summary: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
}

function monthValueToIso(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const cleaned = value.trim()
  if (!cleaned) {
    return undefined
  }

  // Handle MM/YYYY format (01/2023)
  const monthYearMatch = cleaned.match(/^(\d{1,2})\/(\d{4})$/)
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch
    const paddedMonth = month.padStart(2, '0')
    return `${year}-${paddedMonth}-01`
  }

  // Handle YYYY-MM format (2023-01)
  const isoMonthMatch = cleaned.match(/^(\d{4})-(\d{1,2})$/)
  if (isoMonthMatch) {
    const [, year, month] = isoMonthMatch
    const paddedMonth = month.padStart(2, '0')
    return `${year}-${paddedMonth}-01`
  }

  // Handle full ISO date (2023-01-15)
  const dateMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    const paddedMonth = month.padStart(2, '0')
    const paddedDay = day.padStart(2, '0')
    return `${year}-${paddedMonth}-${paddedDay}`
  }

  return undefined
}

function formatUploadedName(fileName?: string | null): string {
  if (!fileName) {
    return 'No file uploaded yet'
  }

  return fileName
}

function splitDateRange(value?: string): { startDate: string; endDate: string } {
  if (!value) {
    return { startDate: '', endDate: '' }
  }

  const cleaned = value.trim()
  if (!cleaned) {
    return { startDate: '', endDate: '' }
  }

  const parts = cleaned.split(/\s*[-–to]+\s*/i).map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return { startDate: parts[0], endDate: parts[1] }
  }

  return { startDate: cleaned, endDate: '' }
}

function DocumentDropzone({
  label,
  hint,
  fileName,
  uploading,
  required = false,
  onChange,
}: {
  label: string
  hint: string
  fileName?: string | null
  uploading: boolean
  required?: boolean
  onChange: (file: File) => void
}): JSX.Element {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragging(false)
    const droppedFile = event.dataTransfer.files?.[0]
    if (droppedFile) {
      onChange(droppedFile)
    }
  }

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      onChange(selectedFile)
    }
  }

  return (
    <label className="block">
      <div className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {required ? <span className="text-rose-500">*</span> : null}
      </div>
      <div
        role="presentation"
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          'relative rounded-2xl border-2 border-dashed px-4 py-5 text-sm transition',
          isDragging ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50',
        ].join(' ')}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white p-3 text-teal-600 shadow-sm">
            <UploadCloud className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">{formatUploadedName(fileName)}</p>
            <p className="mt-1 text-sm text-slate-500">{hint}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex h-9 items-center rounded-xl bg-slate-900 px-3 text-xs font-medium text-white">
                Choose file
              </span>
              <span className="text-xs text-slate-500">Drag and drop is supported</span>
            </div>
          </div>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.rtf,.txt"
            className="absolute inset-0 z-10 cursor-pointer opacity-0"
            onChange={handleInputChange}
          />
        </div>
        {uploading ? <p className="mt-3 text-xs text-teal-700">Uploading...</p> : null}
      </div>
    </label>
  )
}

function SectionWrapper({ children }: { children: ReactNode }): JSX.Element {
  return <div className="space-y-4">{children}</div>
}

export function CandidateJobApplyPage(): JSX.Element {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { companySlug = '', jobId = '' } = useParams<{ companySlug?: string; jobId?: string }>()
  const [job, setJob] = useState<CandidateJobOpening | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resumeFileName, setResumeFileName] = useState<string | null>(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [isAutofilling, setIsAutofilling] = useState(false)
  const [autofillStep, setAutofillStep] = useState(0)
  const [hasApplied, setHasApplied] = useState(false)
  const [existingApplicationStatus, setExistingApplicationStatus] = useState<string>('')

  const defaultValues = useMemo<ApplicationFormValues>(
    () => ({
      firstName: '',
      lastName: '',
      email: '',
      headline: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      portfolioUrl: '',
      linkedinUrl: '',
      githubUrl: '',
      resumeUrl: '',
      coverLetter: '',
      education: [],
      experience: [],
    }),
    [],
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues,
  })

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control,
    name: 'education',
  })

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: 'experience',
  })

  useEffect(() => {
    const loadJob = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)

      try {
        const normalizedJobId = Number(jobId)
        const [response, myApplications] = await Promise.all([
          getJobOpeningById(normalizedJobId),
          getMyJobApplications(),
        ])

        const existingApplication = myApplications.find((application) => application.job_id === normalizedJobId)

        setJob(response)
        setHasApplied(Boolean(existingApplication))
        setExistingApplicationStatus(existingApplication?.status ?? '')
        reset({
          ...defaultValues,
          email: '',
        })
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Failed to load the application form.'))
      } finally {
        setIsLoading(false)
      }
    }

    if (jobId) {
      void loadJob()
    }
  }, [defaultValues, jobId, reset])

  const companyPath = buildCompanyPath(slugify(job?.company_name ?? companySlug ?? 'company'))
  const detailPath = buildDetailPath(slugify(job?.company_name ?? companySlug ?? 'company'), Number(jobId))

  const handleUpload = async (file: File): Promise<void> => {
    try {
      setResumeUploading(true)
      const uploadedUrl = await uploadApplicationDocument(file)
      setValue('resumeUrl', uploadedUrl, { shouldValidate: true })
      setResumeFileName(file.name)

      showToast({
        title: 'File uploaded',
        description: `${file.name} is ready for submission.`,
        variant: 'success',
      })
    } catch (uploadError) {
      showToast({
        title: 'Upload failed',
        description: getErrorMessage(uploadError, 'Unable to upload the file.'),
        variant: 'error',
      })
    } finally {
      setResumeUploading(false)
    }
  }

  const handleAutofillFromResume = async (file: File): Promise<void> => {
    try {
      setIsAutofilling(true)
      setAutofillStep(1)
      const parsedData = await parseResume(file)
      setAutofillStep(2)

      // Import flow should also store the resume as uploaded for submission.
      if (parsedData.resume_url) {
        setValue('resumeUrl', parsedData.resume_url, { shouldValidate: true })
      }
      setResumeFileName(file.name)

      // Extract and set personal information
      if (parsedData.full_name) {
        const nameParts = parsedData.full_name.trim().split(/\s+/)
        setValue('firstName', nameParts[0] || '', { shouldValidate: true })
        setValue('lastName', nameParts.slice(1).join(' ') || '', { shouldValidate: true })
      }

      if (parsedData.email) setValue('email', parsedData.email.trim(), { shouldValidate: true })
      if (parsedData.phone) setValue('phone', parsedData.phone.trim(), { shouldValidate: true })
      if (parsedData.location) {
        const location = parsedData.location.trim()

        const locationParts = location.split(',').map((part) => part.trim()).filter(Boolean)
        if (locationParts.length >= 2) {
          setValue('city', locationParts[0], { shouldValidate: true })
          setValue('country', locationParts[locationParts.length - 1], { shouldValidate: true })
        } else if (locationParts.length === 1) {
          setValue('city', locationParts[0], { shouldValidate: true })
        }
      }
      if (parsedData.linkedin) setValue('linkedinUrl', parsedData.linkedin.trim(), { shouldValidate: true })
      if (parsedData.github) setValue('githubUrl', parsedData.github.trim(), { shouldValidate: true })
      if (parsedData.portfolio) setValue('portfolioUrl', parsedData.portfolio.trim(), { shouldValidate: true })
      if (parsedData.summary) setValue('headline', parsedData.summary.trim(), { shouldValidate: true })
      setAutofillStep(3)

      // Clear existing education/experience before adding new ones
      educationFields.forEach((_, index) => removeEducation(index))
      experienceFields.forEach((_, index) => removeExperience(index))

      // Add education entries
      if (parsedData.education?.length > 0) {
        parsedData.education
          .filter((edu) => edu.degree?.trim() || edu.institution?.trim())
          .forEach((edu) => {
            const fallbackRange = splitDateRange(edu.year)
            appendEducation({
              school: edu.institution?.trim() || '',
              degree: edu.degree?.trim() || '',
              fieldOfStudy: '',
              startDate: edu.start_date?.trim() || fallbackRange.startDate,
              endDate: edu.end_date?.trim() || fallbackRange.endDate,
              description: '',
            })
          })
      }

      // Add experience entries
      if (parsedData.experience?.length > 0) {
        parsedData.experience
          .filter((exp) => exp.job_title?.trim() || exp.company?.trim())
          .forEach((exp) => {
            appendExperience({
              title: exp.job_title?.trim() || '',
              company: exp.company?.trim() || '',
              summary: exp.description?.trim() || '',
              startDate: exp.start_date?.trim() || '',
              endDate: exp.end_date?.trim() && exp.end_date.toLowerCase() !== 'present' ? exp.end_date.trim() : '',
              isCurrent: !exp.end_date || exp.end_date.toLowerCase() === 'present' || exp.end_date.toLowerCase() === 'current',
            })
          })
      }

      setAutofillStep(4)

      showToast({
        title: 'Resume imported successfully',
        description: 'Your resume information has been auto-filled. Please review and adjust as needed.',
        variant: 'success',
      })
    } catch (autofillError) {
      showToast({
        title: 'Import failed',
        description: getErrorMessage(autofillError, 'Unable to parse your resume. Please fill the form manually.'),
        variant: 'error',
      })
    } finally {
      setAutofillStep(0)
      setIsAutofilling(false)
    }
  }

  const onSubmit = async (values: ApplicationFormValues): Promise<void> => {
    if (!job) {
      return
    }

    if (hasApplied) {
      showToast({
        title: 'Already applied',
        description: 'You have already applied for this job.',
        variant: 'error',
      })
      return
    }

    const payload: JobApplicationSubmitPayload = {
      job_id: job.id,
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      country: values.country.trim(),
      headline: values.headline?.trim() || undefined,
      resume_url: values.resumeUrl,
      cover_letter: values.coverLetter?.trim() || undefined,
      portfolio_url: values.portfolioUrl?.trim() || undefined,
      linkedin_url: values.linkedinUrl?.trim() || undefined,
      github_url: values.githubUrl?.trim() || undefined,
      education: values.education
        .filter((entry) => entry.school?.trim())
        .map((entry) => ({
          school: entry.school?.trim() ?? '',
          field_of_study: entry.fieldOfStudy?.trim() || undefined,
          degree: entry.degree?.trim() || undefined,
          start_date: monthValueToIso(entry.startDate),
          end_date: monthValueToIso(entry.endDate),
          description: entry.description?.trim() || undefined,
        })),
      experience: values.experience
        .filter((entry) => entry.title?.trim())
        .map((entry) => ({
          title: entry.title?.trim() ?? '',
          company: entry.company?.trim() || undefined,
          description: entry.summary?.trim() || undefined,
          start_date: monthValueToIso(entry.startDate),
          end_date: entry.isCurrent ? undefined : monthValueToIso(entry.endDate),
          is_currently_working: Boolean(entry.isCurrent),
        })),
    }

    try {
      await submitJobApplication(payload)
      showToast({
        title: 'Application submitted',
        description: 'Your application has been sent to the hiring team.',
        variant: 'success',
      })
      navigate(detailPath)
    } catch (submitError) {
      showToast({
        title: 'Submission failed',
        description: getErrorMessage(submitError, 'Unable to submit your application.'),
        variant: 'error',
      })
    }
  }

  const currentEducation = watch('education')
  const currentExperience = watch('experience')

  return (
    <AppShell
      role="candidate"
      title="Apply for role"
      description="Submit your profile, education, experience, and documents in one streamlined application."
    >
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="h-[720px] animate-pulse bg-slate-100" />
          <Card className="h-[720px] animate-pulse bg-slate-100" />
        </div>
      ) : error || !job ? (
        <Card className="mx-auto max-w-2xl p-6 text-center">
          <p className="text-lg font-semibold text-slate-900">Unable to open the application form</p>
          <p className="mt-2 text-sm text-slate-600">{error ?? 'The selected role could not be loaded.'}</p>
          <Button className="mt-5" onClick={() => navigate(companyPath)}>
            Back to openings
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link to={detailPath} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
                  <ArrowLeft className="h-4 w-4" />
                  Back to details
                </Link>
                <Badge tone="info">{job.company_name || 'Company'}</Badge>
                <Badge tone="neutral">{job.work_mode || 'Open role'}</Badge>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">{job.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Share the information below. Upload your resume and cover letter to create the application record.
              </p>
              {hasApplied ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  You have already applied for this job{existingApplicationStatus ? ` (status: ${existingApplicationStatus})` : ''}.
                </div>
              ) : null}
            </Card>

            <Card className="rounded-2xl border border-teal-200 bg-teal-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Quick apply with your resume</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Import your resume to auto-fill your information. Review and adjust as needed before submitting.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  disabled={isAutofilling}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.pdf,.docx,.doc'
                    input.onchange = () => {
                      const selectedFile = input.files?.[0]
                      if (selectedFile) {
                        void handleAutofillFromResume(selectedFile)
                      }
                    }
                    input.click()
                  }}
                  className="whitespace-nowrap"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isAutofilling ? 'Importing...' : 'Import resume'}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <SectionHeader
                eyebrow="Personal information"
                title="Tell us about yourself"
                description="This information helps the hiring team contact you and review your application quickly."
              />
              <form className="mt-6 space-y-8" onSubmit={handleSubmit(onSubmit)}>
                <SectionWrapper>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="First name" required error={errors.firstName?.message} {...register('firstName')} />
                    <Input label="Last name" required error={errors.lastName?.message} {...register('lastName')} />
                    <Input label="Email" required error={errors.email?.message} {...register('email')} />
                    <Input label="Phone" required error={errors.phone?.message} {...register('phone')} />
                    <Input label="Address" required className="sm:col-span-2" error={errors.address?.message} {...register('address')} />
                    <Input label="City" required error={errors.city?.message} {...register('city')} />
                    <Input label="Country" required error={errors.country?.message} {...register('country')} />
                    <Input label="Headline" className="sm:col-span-2" error={errors.headline?.message} {...register('headline')} />
                  </div>
                </SectionWrapper>

                <SectionWrapper>
                  <SectionHeader
                    eyebrow="Documents"
                    title="Upload your application files"
                    description="Resume is required. Cover letter is optional."
                  />
                  <DocumentDropzone
                    label="Resume"
                    required
                    hint="PDF, DOC, DOCX, RTF, or TXT. Drag and drop your resume here."
                    uploading={resumeUploading}
                    fileName={resumeFileName}
                    onChange={(file) => {
                      void handleUpload(file)
                    }}
                  />

                  <input type="hidden" {...register('resumeUrl')} />

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Cover letter</span>
                    <textarea
                      rows={5}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                      placeholder="Optional. Add a short cover letter to explain why you're a great fit for this role."
                      {...register('coverLetter')}
                    />
                    {errors.coverLetter?.message ? (
                      <p className="mt-2 text-sm text-rose-600">{errors.coverLetter.message}</p>
                    ) : null}
                  </label>
                </SectionWrapper>

                <SectionWrapper>
                  <div className="flex items-end justify-between gap-4">
                    <SectionHeader
                      eyebrow="Education"
                      title="Add your education history"
                      description="You can add multiple education entries if needed."
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="whitespace-nowrap"
                      onClick={() => appendEducation({ ...initialEducation })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add education
                    </Button>
                  </div>
                  {educationFields.length === 0 ? (
                    <Card className="border-dashed p-5 text-sm text-slate-600">
                      No education records yet. Add one if it helps the hiring team review your background.
                    </Card>
                  ) : null}
                  <div className="space-y-4">
                    {educationFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-slate-900">Education #{index + 1}</p>
                          <Button type="button" variant="ghost" onClick={() => removeEducation(index)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <Input label="School" required {...register(`education.${index}.school`)} />
                          <Input label="Field of study" {...register(`education.${index}.fieldOfStudy`)} />
                          <Input label="Degree" {...register(`education.${index}.degree`)} />
                          <Input label="Start date (MM/YYYY)" placeholder="MM/YYYY" {...register(`education.${index}.startDate`)} />
                          <Input label="End date (MM/YYYY)" placeholder="MM/YYYY" {...register(`education.${index}.endDate`)} />
                          <label className="sm:col-span-3 block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
                            <textarea
                              rows={2}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                              placeholder="Relevant coursework, honors, or project notes."
                              {...register(`education.${index}.description`)}
                            />
                          </label>
                        </div>
                      </Card>
                    ))}
                  </div>
                </SectionWrapper>

                <SectionWrapper>
                  <div className="flex items-end justify-between gap-4">
                    <SectionHeader
                      eyebrow="Experience"
                      title="Add your work experience"
                      description="List your most relevant roles, or leave this section empty if you are just starting out."
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="whitespace-nowrap"
                      onClick={() => appendExperience({ ...initialExperience })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add experience
                    </Button>
                  </div>
                  {experienceFields.length === 0 ? (
                    <Card className="border-dashed p-5 text-sm text-slate-600">
                      No experience records yet. Add one if you have previous work history to share.
                    </Card>
                  ) : null}
                  <div className="space-y-4">
                    {experienceFields.map((field, index) => (
                      <Card key={field.id} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-slate-900">Experience #{index + 1}</p>
                          <Button type="button" variant="ghost" onClick={() => removeExperience(index)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <Input label="Title" required {...register(`experience.${index}.title`)} />
                          <Input label="Company" {...register(`experience.${index}.company`)} />
                          <Input label="Start date (MM/YYYY)" placeholder="MM/YYYY" {...register(`experience.${index}.startDate`)} />
                          <Input label="End date (MM/YYYY)" placeholder="MM/YYYY" {...register(`experience.${index}.endDate`)} />
                          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 sm:col-span-3">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600" {...register(`experience.${index}.isCurrent`)} />
                            I currently work here
                          </label>
                          <label className="sm:col-span-3 block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Summary</span>
                            <textarea
                              rows={2}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                              placeholder="Describe your responsibilities, achievements, and impact."
                              {...register(`experience.${index}.summary`)}
                            />
                          </label>
                        </div>
                      </Card>
                    ))}
                  </div>
                </SectionWrapper>

                <SectionWrapper>
                  <SectionHeader
                    eyebrow="Professional links"
                    title="Optional links"
                    description="Add portfolio and social links if you want the hiring team to review more of your work."
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Portfolio URL" error={errors.portfolioUrl?.message} {...register('portfolioUrl')} />
                    <Input label="LinkedIn URL" error={errors.linkedinUrl?.message} {...register('linkedinUrl')} />
                    <Input label="GitHub URL" error={errors.githubUrl?.message} {...register('githubUrl')} />
                  </div>
                </SectionWrapper>

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
                  <Button type="submit" className="sm:flex-1" disabled={hasApplied || isSubmitting}>
                    {hasApplied ? 'Already applied' : isSubmitting ? 'Submitting application...' : 'Submit application'}
                  </Button>
                  <Button type="button" variant="secondary" className="sm:flex-1" onClick={() => navigate(detailPath)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Application checklist</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-teal-600" />
                  Resume uploaded and linked
                </li>
                <li className="flex gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-teal-600" />
                  Education and experience added if available
                </li>
                <li className="flex gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-teal-600" />
                  Contact details are complete
                </li>
              </ul>
            </Card>

            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Live values</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Education entries</span>
                  <span className="font-medium text-slate-900">{currentEducation.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Experience entries</span>
                  <span className="font-medium text-slate-900">{currentExperience.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Resume ready</span>
                  <Badge tone={watch('resumeUrl') ? 'success' : 'warning'}>
                    {watch('resumeUrl') ? 'Uploaded' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {isAutofilling ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-200 via-fuchsia-200 to-indigo-300">
              <FileText className="h-10 w-10 text-indigo-700" />
            </div>
            <h3 className="text-center text-3xl font-semibold text-slate-800">Processing your resume</h3>

            <div className="mx-auto mt-6 h-2 w-full max-w-md overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-violet-700 transition-all duration-300"
                style={{ width: `${autofillStep === 1 ? 23 : autofillStep === 2 ? 48 : autofillStep === 3 ? 76 : 100}%` }}
              />
            </div>

            <p className="mt-3 text-center text-3xl font-semibold text-violet-700">
              {autofillStep === 1 ? '23%' : autofillStep === 2 ? '48%' : autofillStep === 3 ? '76%' : '100%'} completed
            </p>

            <ul className="mx-auto mt-8 max-w-sm space-y-4 text-lg text-slate-600">
              <li className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${autofillStep >= 1 ? 'bg-violet-700 ring-4 ring-violet-200' : 'bg-violet-200'}`} />
                Reading your resume
              </li>
              <li className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${autofillStep >= 2 ? 'bg-violet-700 ring-4 ring-violet-200' : 'bg-violet-200'}`} />
                Filling in your contact details
              </li>
              <li className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${autofillStep >= 3 ? 'bg-violet-700 ring-4 ring-violet-200' : 'bg-violet-200'}`} />
                Adding your experience and education
              </li>
              <li className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${autofillStep >= 4 ? 'bg-violet-700 ring-4 ring-violet-200' : 'bg-violet-200'}`} />
                Finishing up
              </li>
            </ul>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
