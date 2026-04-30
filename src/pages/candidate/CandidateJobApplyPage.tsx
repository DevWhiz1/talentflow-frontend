import type { JSX, ChangeEvent, DragEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { ArrowLeft, FileText, Plus, Trash2, UploadCloud, Sparkles } from 'lucide-react'
import { AppShell } from '../../components/layout'
import { Badge, Button, Card, Input, SectionHeader } from '../../components/ui'
import { useToast } from '../../hooks/useToast'
import { getJobOpeningById, submitJobApplication, uploadApplicationDocument } from '../../services/jobService'
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
  gpa: z.string().optional(),
})

const experienceSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  summary: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
})

const applicationSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  headline: z.string().optional(),
  phone: z.string().min(8, 'Phone number is required'),
  address: z.string().min(5, 'Address is required'),
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
  gpa: '',
}

const initialExperience = {
  title: '',
  company: '',
  industry: '',
  summary: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  employmentType: '',
  location: '',
}

function monthValueToIso(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const cleaned = value.trim()
  if (!cleaned) {
    return undefined
  }

  const monthYearMatch = cleaned.match(/^(\d{2})\/(\d{4})$/)
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch
    return `${year}-${month}-01T00:00:00`
  }

  const isoMonthMatch = cleaned.match(/^(\d{4})-(\d{2})$/)
  if (isoMonthMatch) {
    const [, year, month] = isoMonthMatch
    return `${year}-${month}-01T00:00:00`
  }

  const dateMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00`
  }

  return undefined
}

function formatUploadedName(fileName?: string | null): string {
  if (!fileName) {
    return 'No file uploaded yet'
  }

  return fileName
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

  const defaultValues = useMemo<ApplicationFormValues>(
    () => ({
      firstName: '',
      lastName: '',
      email: '',
      headline: '',
      phone: '',
      address: '',
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
        const response = await getJobOpeningById(Number(jobId))
        setJob(response)
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
      const parsedData = await parseResume(file)

      if (parsedData.full_name) {
        const nameParts = parsedData.full_name.split(' ')
        setValue('firstName', nameParts[0] || '', { shouldValidate: true })
        setValue('lastName', nameParts.slice(1).join(' ') || '', { shouldValidate: true })
      }

      if (parsedData.email) setValue('email', parsedData.email, { shouldValidate: true })
      if (parsedData.phone) setValue('phone', parsedData.phone, { shouldValidate: true })
      if (parsedData.linkedin) setValue('linkedinUrl', parsedData.linkedin, { shouldValidate: true })
      if (parsedData.github) setValue('githubUrl', parsedData.github, { shouldValidate: true })
      if (parsedData.portfolio) setValue('portfolioUrl', parsedData.portfolio, { shouldValidate: true })

      if (parsedData.education?.length) {
        parsedData.education
          .filter((edu) => edu.degree || edu.institution)
          .forEach((edu) => {
            appendEducation({
              school: edu.institution || '',
              degree: edu.degree || '',
              startDate: '',
              endDate: edu.year || '',
              fieldOfStudy: '',
              description: '',
              gpa: '',
            })
          })
      }

      if (parsedData.experience?.length) {
        parsedData.experience
          .filter((exp) => exp.job_title || exp.company)
          .forEach((exp) => {
            appendExperience({
              title: exp.job_title || '',
              company: exp.company || '',
              summary: exp.description || '',
              startDate: '',
              endDate: '',
              isCurrent: !exp.end_date,
              employmentType: '',
              industry: '',
              location: '',
            })
          })
      }

      showToast({
        title: 'Resume parsed successfully',
        description: 'Your resume information has been auto-filled into the form.',
        variant: 'success',
      })
    } catch (autofillError) {
      showToast({
        title: 'Autofill failed',
        description: getErrorMessage(autofillError, 'Unable to parse your resume.'),
        variant: 'error',
      })
    } finally {
      setIsAutofilling(false)
    }
  }

  const onSubmit = async (values: ApplicationFormValues): Promise<void> => {
    if (!job) {
      return
    }

    const payload: JobApplicationSubmitPayload = {
      job_id: job.id,
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      phone: values.phone,
      address: values.address,
      headline: values.headline || undefined,
      resume_url: values.resumeUrl,
      cover_letter: values.coverLetter || undefined,
      portfolio_url: values.portfolioUrl || undefined,
      linkedin_url: values.linkedinUrl || undefined,
      github_url: values.githubUrl || undefined,
      education: values.education
        .filter((entry) => entry.school?.trim())
        .map((entry) => ({
          school: entry.school?.trim() ?? '',
          field_of_study: entry.fieldOfStudy?.trim() || undefined,
          degree: entry.degree?.trim() || undefined,
          start_date: monthValueToIso(entry.startDate),
          end_date: monthValueToIso(entry.endDate),
          description: entry.description?.trim() || undefined,
          gpa: entry.gpa ? Number(entry.gpa) : undefined,
        })),
      experience: values.experience
        .filter((entry) => entry.title?.trim())
        .map((entry) => ({
          title: entry.title?.trim() ?? '',
          company: entry.company?.trim() || undefined,
          industry: entry.industry?.trim() || undefined,
          description: entry.summary?.trim() || undefined,
          start_date: monthValueToIso(entry.startDate),
          end_date: entry.isCurrent ? undefined : monthValueToIso(entry.endDate),
          is_currently_working: Boolean(entry.isCurrent),
          employment_type: entry.employmentType?.trim() || undefined,
          location: entry.location?.trim() || undefined,
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
                    <Input label="Headline" className="sm:col-span-2" error={errors.headline?.message} {...register('headline')} />
                    <Input label="Address" className="sm:col-span-2" required error={errors.address?.message} {...register('address')} />
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
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={resumeUploading || isAutofilling}
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = '.pdf,.docx'
                        input.onchange = () => {
                          const selectedFile = input.files?.[0]
                          if (selectedFile) {
                            void handleAutofillFromResume(selectedFile)
                          }
                        }
                        input.click()
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Autofill from Resume
                    </Button>

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
                      <Card key={field.id} className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-slate-900">Education #{index + 1}</p>
                          <Button type="button" variant="ghost" onClick={() => removeEducation(index)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <Input label="School" required {...register(`education.${index}.school`)} />
                          <Input label="Field of study" {...register(`education.${index}.fieldOfStudy`)} />
                          <Input label="Degree" {...register(`education.${index}.degree`)} />
                          <Input label="GPA" {...register(`education.${index}.gpa`)} />
                          <Input label="Start date (MM/YYYY)" placeholder="MM/YYYY" {...register(`education.${index}.startDate`)} />
                          <Input label="End date (MM/YYYY)" placeholder="MM/YYYY" {...register(`education.${index}.endDate`)} />
                          <label className="sm:col-span-2 block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
                            <textarea
                              rows={3}
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
                      <Card key={field.id} className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium text-slate-900">Experience #{index + 1}</p>
                          <Button type="button" variant="ghost" onClick={() => removeExperience(index)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <Input label="Title" required {...register(`experience.${index}.title`)} />
                          <Input label="Company" {...register(`experience.${index}.company`)} />
                          <Input label="Industry" {...register(`experience.${index}.industry`)} />
                          <Input label="Employment type" {...register(`experience.${index}.employmentType`)} />
                          <Input label="Location" {...register(`experience.${index}.location`)} />
                          <Input label="Start date (MM/YYYY)" placeholder="MM/YYYY" {...register(`experience.${index}.startDate`)} />
                          <Input label="End date (MM/YYYY)" placeholder="MM/YYYY" {...register(`experience.${index}.endDate`)} />
                          <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 sm:col-span-2">
                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-600" {...register(`experience.${index}.isCurrent`)} />
                            I currently work here
                          </label>
                          <label className="sm:col-span-2 block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Summary</span>
                            <textarea
                              rows={3}
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
                  <Button type="submit" className="sm:flex-1">
                    {isSubmitting ? 'Submitting application...' : 'Submit application'}
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Role summary</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">{job.title}</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Company</span>
                  <span className="font-medium text-slate-900">{job.company_name || 'Company'}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <span>Location</span>
                  <span className="font-medium text-slate-900">{job.location || 'Remote'}</span>
                </div>
              </div>
            </Card>

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
    </AppShell>
  )
}
