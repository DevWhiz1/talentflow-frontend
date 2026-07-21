import type { JSX } from 'react'
import { ChevronDown, Menu } from 'lucide-react'
import { resolveAssetUrl } from '../../utils/assetUrl'

interface TopBarProps {
  userName: string
  userEmail: string
  avatarUrl?: string | null
  onLogout: () => void
  onMenuClick: () => void
}

export function TopBar({ userName, userEmail, avatarUrl, onLogout, onMenuClick }: TopBarProps): JSX.Element {
  const initials = userName ? userName.charAt(0).toUpperCase() : 'U'
  const imageUrl = resolveAssetUrl(avatarUrl)

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-12 items-center justify-between px-4 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center justify-end gap-4">
          {/* <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </button> */}

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-full px-1 py-1 text-left hover:bg-slate-100">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
                {imageUrl ? (
                  <img src={imageUrl} alt={`${userName} profile`} className="h-full w-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden text-xs sm:block">
                <p className="text-[13px] font-semibold leading-tight text-slate-900">{userName}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{userEmail}</p>
              </div>
              <ChevronDown className="mr-1 hidden h-4 w-4 text-slate-400 group-open:rotate-180 sm:block" />
            </summary>

            <div className="absolute right-0 z-30 mt-2 w-40 rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-lg">
              <button
                type="button"
                onClick={onLogout}
                className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
