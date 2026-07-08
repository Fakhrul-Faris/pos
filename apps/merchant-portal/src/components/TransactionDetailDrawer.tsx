'use client'

import type { Transaction } from '../data/mock'
import { IconX } from './icons'

type TransactionDetailDrawerProps = {
  transaction: Transaction | null
  onClose: () => void
  onRefund?: (transactionId: string) => void
}

function formatMoney(amount: number, showDecimals = true) {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs text-ash">{label}</dt>
      <dd className="text-right text-sm font-medium text-carbon">{value}</dd>
    </div>
  )
}

export function TransactionDetailDrawer({
  transaction,
  onClose,
  onRefund,
}: TransactionDetailDrawerProps) {
  if (!transaction) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close receipt"
        className="absolute inset-0 bg-carbon/20"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-[rgba(0,0,0,0.08)_0px_8px_24px_0px]">
        <header className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-ui text-ash">{transaction.ref}</p>
            <h2 className="font-display mt-1 text-lg font-medium tracking-ui text-carbon">
              Receipt
            </h2>
            <p className="mt-1 text-sm text-ash">
              {transaction.customer} · {transaction.time}
            </p>
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <section className="mb-6">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-ui text-ash">
              Payment
            </h3>
            <dl className="divide-y divide-fog">
              <DetailRow label="Method" value={transaction.method.toUpperCase()} />
              <DetailRow label="Staff" value={transaction.staff} />
              <DetailRow label="Status" value={transaction.status.replace('-', ' ')} />
            </dl>
          </section>

          <section>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-ui text-ash">
              Amount
            </h3>
            <dl className="divide-y divide-fog">
              <DetailRow label="Gross" value={formatMoney(transaction.gross, false)} />
              <DetailRow label="Fee" value={transaction.fee > 0 ? formatMoney(transaction.fee) : '—'} />
              <DetailRow label="Net" value={transaction.net > 0 ? formatMoney(transaction.net) : '—'} />
            </dl>
          </section>

          <div className="mt-6 rounded-2xl border border-fog bg-linen p-4">
            <p className="text-xs text-ash">Total paid</p>
            <p className="font-display tabular-nums mt-1 text-3xl font-medium tracking-ui text-carbon">
              {formatMoney(transaction.gross, false)}
            </p>
            <p className="mt-1 text-xs text-ash">
              Reference {transaction.ref}
            </p>
          </div>
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 px-4 py-2">
            Close
          </button>
          {transaction.status === 'completed' && (
            <button
              type="button"
              className="btn-ghost flex-1 px-4 py-2 text-ember hover:text-ember"
              onClick={() => onRefund?.(transaction.id)}
            >
              Refund
            </button>
          )}
          <button
            type="button"
            className="btn-primary flex-1 px-4 py-2"
            onClick={() => {
              navigator.clipboard?.writeText(transaction.ref)
            }}
          >
            Copy reference
          </button>
        </footer>
      </aside>
    </div>
  )
}

