import { useEffect } from 'react'

export type ToastKind = 'success' | 'info' | 'error'

export type ToastState = {
  open: boolean
  kind: ToastKind
  title: string
  message?: string
}

export function Toast({
  toast,
  onClose,
  durationMs = 2200,
}: {
  toast: ToastState
  onClose: () => void
  durationMs?: number
}) {
  useEffect(() => {
    if (!toast.open) return
    const t = window.setTimeout(onClose, durationMs)
    return () => window.clearTimeout(t)
  }, [toast.open, durationMs, onClose])

  if (!toast.open) return null

  const accent =
    toast.kind === 'success'
      ? 'bg-mint'
      : toast.kind === 'error'
        ? 'bg-ember'
        : 'bg-sky'

  return (
    <div className="fixed bottom-5 right-5 z-[60] w-[340px] max-w-[calc(100vw-40px)]">
      <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white shadow-panel">
        <div className={`h-1.5 w-full ${accent}`} aria-hidden />
        <div className="p-4">
          <p className="text-sm font-medium text-carbon">{toast.title}</p>
          {toast.message && <p className="mt-1 text-sm text-graphite">{toast.message}</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-lavender hover:text-iris"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

