import type { ChangeEvent, JSX } from 'react'
import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AppShell } from '../../components/layout'
import { Button, Card, Input } from '../../components/ui'
import { dashboardPathByRole } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { updateCandidateProfile, uploadProfileImage } from '../../services/userService'
import type { CandidateProfileUpdatePayload } from '../../types/profile'
import { resolveAssetUrl } from '../../utils/assetUrl'
import { getErrorMessage } from '../../utils/errors'

const candidateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number is required'),
  candidateHeadline: z.string().min(5, 'Add a short professional headline'),
  bio: z.string().min(20, 'Bio should be at least 20 characters'),
  linkedinUrl: z.string().url('Enter a valid LinkedIn URL'),
  githubUrl: z.string().url('Enter a valid GitHub URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Enter a valid portfolio URL').optional().or(z.literal('')),
  skills: z.string().min(2, 'Add at least one skill'),
  currentLocation: z.string().min(2, 'Current location is required'),
  education: z.string().min(2, 'Education is required'),
  experienceYears: z.coerce.number().min(0, 'Experience must be at least 0').max(50, 'Invalid value'),
  resumeUrl: z.string().url('Enter a valid resume URL'),
})

type CandidateProfileFormValues = z.infer<typeof candidateProfileSchema>

export function CandidateProfilePage(): JSX.Element {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const defaultValues = useMemo<CandidateProfileFormValues>(
    () => ({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      candidateHeadline: user?.candidateHeadline ?? '',
      bio: user?.bio ?? '',
      linkedinUrl: user?.linkedinUrl ?? '',
      githubUrl: user?.githubUrl ?? '',
      portfolioUrl: user?.portfolioUrl ?? '',
      skills: user?.skills?.join(', ') ?? '',
      currentLocation: user?.currentLocation ?? '',
      education: user?.education ?? '',
      experienceYears: user?.experienceYears ?? 0,
      resumeUrl: user?.resumeUrl ?? '',
    }),
    [user],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CandidateProfileFormValues>({
    resolver: zodResolver(candidateProfileSchema) as never,
    values: defaultValues,
  })

  const onSubmit = async (values: CandidateProfileFormValues): Promise<void> => {
    try {
      const payload: CandidateProfileUpdatePayload = {
        name: values.name,
        phone: values.phone,
        candidate_headline: values.candidateHeadline,
        bio: values.bio,
        linkedin_url: values.linkedinUrl,
        github_url: values.githubUrl || undefined,
        portfolio_url: values.portfolioUrl || undefined,
        skills: values.skills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        current_location: values.currentLocation,
        education: values.education,
        experience_years: values.experienceYears,
        resume_url: values.resumeUrl,
      }

      const updatedUser = await updateCandidateProfile(payload)
      updateUser(updatedUser)

      showToast({
        title: 'Profile updated',
        description: 'Your candidate profile has been saved successfully.',
        variant: 'success',
      })

      if (updatedUser.profileCompleted) {
        navigate(dashboardPathByRole.candidate)
      }
    } catch (error) {
      showToast({
        title: 'Unable to save profile',
        description: getErrorMessage(error),
        variant: 'error',
      })
    }
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setIsUploadingImage(true)
      const updatedUser = await uploadProfileImage(file)
      updateUser(updatedUser)
      showToast({
        title: 'Photo uploaded',
        description: 'Profile image uploaded to Cloudinary.',
        variant: 'success',
      })
    } catch (error) {
      showToast({
        title: 'Image upload failed',
        description: getErrorMessage(error),
        variant: 'error',
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  return (
    <AppShell
      role="candidate"
      title="Complete your candidate profile"
      description="Add professional details so hiring teams can discover and evaluate you faster."
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
        <Card className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" error={errors.name?.message} {...register('name')} />
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Input
                label="Professional headline"
                className="sm:col-span-2"
                error={errors.candidateHeadline?.message}
                {...register('candidateHeadline')}
              />
              <Input label="LinkedIn URL" error={errors.linkedinUrl?.message} {...register('linkedinUrl')} />
              <Input label="GitHub URL" error={errors.githubUrl?.message} {...register('githubUrl')} />
              <Input
                label="Portfolio URL"
                error={errors.portfolioUrl?.message}
                {...register('portfolioUrl')}
              />
              <Input
                label="Current location"
                error={errors.currentLocation?.message}
                {...register('currentLocation')}
              />
              <Input label="Education" error={errors.education?.message} {...register('education')} />
              <Input
                label="Years of experience"
                type="number"
                min={0}
                max={50}
                error={errors.experienceYears?.message}
                {...register('experienceYears')}
              />
              <Input label="Resume URL" error={errors.resumeUrl?.message} {...register('resumeUrl')} />
              <Input
                label="Skills (comma separated)"
                className="sm:col-span-2"
                error={errors.skills?.message}
                {...register('skills')}
              />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Professional summary</span>
              <textarea
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                placeholder="Write a concise summary about your background, strengths, and target roles."
                {...register('bio')}
              />
              {errors.bio?.message ? <p className="mt-2 text-sm text-rose-600">{errors.bio.message}</p> : null}
            </label>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving profile...' : 'Save candidate profile'}
            </Button>
          </form>
        </Card>

        <Card className="space-y-5 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Profile completion</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{user?.profileCompletion ?? 0}% complete</h2>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-teal-600"
                style={{ width: `${Math.min(user?.profileCompletion ?? 0, 100)}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Complete all fields and upload your profile image to unlock full candidate recommendations.
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Profile image</p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                void handleImageUpload(event)
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
              disabled={isUploadingImage}
            />
            {isUploadingImage ? <p className="mt-2 text-xs text-slate-500">Uploading image...</p> : null}
            {user?.profileImage ? (
              <img
                src={resolveAssetUrl(user.profileImage)}
                alt="Candidate profile"
                className="mt-4 h-24 w-24 rounded-2xl object-cover"
              />
            ) : null}
          </div>

          <Button variant="secondary" className="w-full" onClick={() => navigate(dashboardPathByRole.candidate)}>
            Back to dashboard
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}
