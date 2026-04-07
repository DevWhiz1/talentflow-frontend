import type { JSX, ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { classNames } from '../utils/classNames'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps): JSX.Element {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-teal-600 text-white shadow-sm shadow-teal-100 hover:bg-teal-700',
    secondary: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  }

  return (
    <button
      type={type}
      className={classNames(
        'inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}

interface CardProps {
  children?: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps): JSX.Element {
  return <div className={classNames('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>{children}</div>
}

interface BadgeProps {
  children: ReactNode
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps): JSX.Element {
  const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
    info: 'bg-teal-50 text-teal-700 ring-teal-100',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100',
    danger: 'bg-rose-50 text-rose-700 ring-rose-100',
  }

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

interface FieldLabelProps {
  children: ReactNode
  required?: boolean
}

function FieldLabel({ children, required }: FieldLabelProps): JSX.Element {
  return (
    <div className="mb-2 flex items-center gap-1 text-sm font-medium text-slate-700">
      <span>{children}</span>
      {required ? <span className="text-rose-500">*</span> : null}
    </div>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className, ...props },
  ref,
): JSX.Element {
  return (
    <label className="block">
      <FieldLabel required={props.required}>{label}</FieldLabel>
      <input
        ref={ref}
        className={classNames(
          'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10',
          error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10',
          className,
        )}
        {...props}
      />
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      {!error && helperText ? <p className="mt-2 text-sm text-slate-500">{helperText}</p> : null}
    </label>
  )
})

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, children, ...props },
  ref,
): JSX.Element {
  return (
    <label className="block">
      <FieldLabel required={props.required}>{label}</FieldLabel>
      <select
        ref={ref}
        className={classNames(
          'h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10',
          error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </label>
  )
})

export interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p> : null}
        <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
