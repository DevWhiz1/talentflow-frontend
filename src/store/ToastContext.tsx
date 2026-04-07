import type { JSX, ReactNode } from 'react'
import { createContext, useState } from 'react'
import { classNames } from '../utils/classNames'
import { createId } from '../utils/id'

type ToastVariant = 'info' | 'success' | 'error'

interface ToastInput {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastItem extends Required<Pick<ToastInput, 'title'>> {
  id: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => string
  dismissToast: (id: string) => void
  toasts: ToastItem[]
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = (id: string): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  const showToast = ({ title, description, variant = 'info' }: ToastInput): string => {
    const id = createId('toast')

    setToasts((current) => [...current, { id, title, description, variant }])
    globalThis.setTimeout(() => dismissToast(id), 3800)

    return id
  }

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toasts }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(100vw-2rem,24rem)] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={classNames(
              'pointer-events-auto rounded-2xl border bg-white p-4 shadow-lg shadow-slate-200/80 transition-all',
              toast.variant === 'success' && 'border-emerald-200',
              toast.variant === 'error' && 'border-rose-200',
              toast.variant === 'info' && 'border-slate-200',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm text-slate-600">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-full px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export { ToastContext }
