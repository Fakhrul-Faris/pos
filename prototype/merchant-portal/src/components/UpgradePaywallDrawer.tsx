import { IconX } from './icons'

type UpgradePaywallDrawerProps = {
  open: boolean
  title?: string
  subtitle?: string
  onClose: () => void
  onUpgrade: () => void
}

export function UpgradePaywallDrawer({
  open,
  title = 'Upgrade to add more staff',
  subtitle = 'Your current plan has reached its staff limit.',
  onClose,
  onUpgrade,
}: UpgradePaywallDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close paywall"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-[rgba(0,0,0,0.08)_0px_8px_24px_0px]">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-sky">Upgrade required</p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              {title}
            </h2>
            <p className="mt-1 text-sm text-ash">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ash transition-colors hover:bg-mist hover:text-carbon"
          >
            <IconX className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="rounded-2xl border border-fog bg-linen p-4">
            <p className="text-sm font-medium text-carbon">Unlock staff scaling</p>
            <ul className="mt-3 space-y-2 text-sm text-graphite">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender" />
                Add more barbers/staff
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender" />
                Parallel “now serving” lanes on counter view
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender" />
                Higher booking volume support
              </li>
            </ul>
          </div>
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
            Not now
          </button>
          <button type="button" onClick={onUpgrade} className="btn-primary flex-1 px-4 py-2">
            Upgrade plan
          </button>
        </footer>
      </aside>
    </div>
  )
}

