import type { ChangeEvent, JSX } from 'react'
import { useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AppShell } from '../../components/layout'
import { Button, Card, Input, Select } from '../../components/ui'
import { dashboardPathByRole } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { updateAdminProfile, uploadProfileImage } from '../../services/userService'
import type { AdminProfileUpdatePayload } from '../../types/profile'
import { getErrorMessage } from '../../utils/errors'

const adminProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number is required'),
  companyName: z.string().min(2, 'Company name is required'),
  companyWebsite: z.string().url('Enter a valid company website URL'),
  companyAddress: z.string().min(5, 'Company address is required'),
  companyIndustry: z.string().min(2, 'Industry is required'),
  companySize: z.string().min(1, 'Select company size'),
  hrDesignation: z.string().min(2, 'Designation is required'),
  hrDepartment: z.string().min(2, 'Department is required'),
  companyDescription: z.string().min(20, 'Company description should be at least 20 characters'),
})

type AdminProfileFormValues = z.infer<typeof adminProfileSchema>

export function AdminProfilePage(): JSX.Element {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const defaultValues = useMemo<AdminProfileFormValues>(
    () => ({
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      companyName: user?.companyName ?? '',
      companyWebsite: user?.companyWebsite ?? '',
      companyAddress: user?.companyAddress ?? '',
      companyIndustry: user?.companyIndustry ?? '',
      companySize: user?.companySize ?? '',
      hrDesignation: user?.hrDesignation ?? '',
      hrDepartment: user?.hrDepartment ?? '',
      companyDescription: user?.companyDescription ?? '',
    }),
    [user],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminProfileFormValues>({
    resolver: zodResolver(adminProfileSchema),
    values: defaultValues,
  })

  const onSubmit = async (values: AdminProfileFormValues): Promise<void> => {
    try {
      const payload: AdminProfileUpdatePayload = {
        name: values.name,
        phone: values.phone,
        company_name: values.companyName,
        company_website: values.companyWebsite,
        company_address: values.companyAddress,
        company_industry: values.companyIndustry,
        company_size: values.companySize,
        hr_designation: values.hrDesignation,
        hr_department: values.hrDepartment,
        company_description: values.companyDescription,
      }

      const updatedUser = await updateAdminProfile(payload)
      updateUser(updatedUser)

      showToast({
        title: 'Profile updated',
        description: 'Your HR/company profile has been saved successfully.',
        variant: 'success',
      })

      if (updatedUser.profileCompleted) {
        navigate(dashboardPathByRole.admin)
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
        description: 'Profile image uploaded.',
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
      role="admin"
      title="Complete your HR/company profile"
      description="Provide organizational and recruiter details so candidate sourcing and communication stay consistent."
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr,0.75fr]">
        <Card className="p-6">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" error={errors.name?.message} {...register('name')} />
              <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
              <Input label="Company name" error={errors.companyName?.message} {...register('companyName')} />
              <Input
                label="Company website"
                error={errors.companyWebsite?.message}
                {...register('companyWebsite')}
              />
              <Input
                label="Company address"
                className="sm:col-span-2"
                error={errors.companyAddress?.message}
                {...register('companyAddress')}
              />
              <Input
                label="Industry"
                error={errors.companyIndustry?.message}
                {...register('companyIndustry')}
              />
              <Select label="Company size" error={errors.companySize?.message} {...register('companySize')}>
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </Select>
              <Input
                label="HR designation"
                error={errors.hrDesignation?.message}
                {...register('hrDesignation')}
              />
              <Input label="Department" error={errors.hrDepartment?.message} {...register('hrDepartment')} />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Company description</span>
              <textarea
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                placeholder="Describe company mission, hiring focus, and work culture."
                {...register('companyDescription')}
              />
              {errors.companyDescription?.message ? (
                <p className="mt-2 text-sm text-rose-600">{errors.companyDescription.message}</p>
              ) : null}
            </label>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving profile...' : 'Save HR/company profile'}
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
              Complete all company details and upload your profile image to enable full admin workflows.
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
                src={user.profileImage}
                alt="Admin profile"
                className="mt-4 h-24 w-24 rounded-2xl object-cover"
              />
            ) : null}
          </div>

          <Button variant="secondary" className="w-full" onClick={() => navigate(dashboardPathByRole.admin)}>
            Back to dashboard
          </Button>
        </Card>
      </div>
    </AppShell>
  )
}
