'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDate, formatDateTime, merchantName } from '@/data/mock'
import type {
  SupportPriority,
  SupportStatus,
  SupportType,
} from '@/data/types'
import { Badge, Chip } from '../ui/Badge'
import { Button } from '../ui/Button'
import { EmptyRow, Table, TBody, TD, TH, THead, TR } from '../ui/Table'

const priorityTone: Record<SupportPriority, 'red' | 'gray' | 'blue'> = {
  high: 'red',
  normal: 'gray',
  low: 'blue',
}

const statusTone: Record<SupportStatus, 'amber' | 'blue' | 'green'> = {
  open: 'amber',
  in_progress: 'blue',
  resolved: 'green',
}

const TYPE_LABELS: Record<SupportType, string> = {
  payment: 'Payment',
  access: 'Access',
  billing: 'Billing',
  product: 'Product',
  other: 'Other',
}

type Props = {
  onOpenMerchant: (id: string) => void
}

/** Inbox only - no form / question builder (IA brief). Not merchant Help. */
export function Support({ onOpenMerchant }: Props) {
  const store = useAdminStore()
  const [selectedId, setSelectedId] = useState<string | null>(
    store.support[0]?.id ?? null,
  )
  const [statusFilter, setStatusFilter] = useState<SupportStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<SupportPriority | 'all'>(
    'all',
  )
  const [noteDraft, setNoteDraft] = useState('')

  const filtered = useMemo(() => {
    return store.support.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
      return true
    })
  }, [store.support, statusFilter, priorityFilter])

  const selected = store.support.find((r) => r.id === selectedId) ?? null
  const openCount = store.support.filter((r) => r.status !== 'resolved').length
  const highCount = store.support.filter(
    (r) => r.priority === 'high' && r.status !== 'resolved',
  ).length

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="page-title">Support inbox</h1>
        <p className="page-desc">
          End-customer submissions · {openCount} open · {highCount} high
          priority. Inbox only — no form builder.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-1">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map((s) => (
          <Chip
            key={s}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'in_progress' ? 'In progress' : s === 'all' ? 'All' : s}
          </Chip>
        ))}
        <span className="mx-1 text-gray-400">|</span>
        {(['all', 'high', 'normal', 'low'] as const).map((p) => (
          <Chip
            key={p}
            active={priorityFilter === p}
            onClick={() => setPriorityFilter(p)}
          >
            {p === 'all' ? 'All priorities' : p}
          </Chip>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <Table>
          <THead>
            <tr>
              <TH>Subject</TH>
              <TH>Organization</TH>
              <TH>Type</TH>
              <TH>Priority</TH>
              <TH>Status</TH>
              <TH>Submitted</TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((r) => (
              <TR
                key={r.id}
                onClick={() => {
                  setSelectedId(r.id)
                  setNoteDraft(r.resolutionNotes)
                }}
                className={selected?.id === r.id ? '!bg-gray-200' : ''}
              >
                <TD>
                  <span className="font-medium text-gray-1000">{r.subject}</span>
                </TD>
                <TD muted>
                  {r.merchantId
                    ? merchantName(store.merchants, r.merchantId)
                    : '-'}
                </TD>
                <TD muted>{TYPE_LABELS[r.type]}</TD>
                <TD>
                  <Badge tone={priorityTone[r.priority]}>{r.priority}</Badge>
                </TD>
                <TD>
                  <Badge tone={statusTone[r.status]}>
                    {r.status.replace('_', ' ')}
                  </Badge>
                </TD>
                <TD muted>
                  <span className="text-[11px]">
                    {formatDate(r.submittedAt.slice(0, 10))}
                  </span>
                </TD>
              </TR>
            ))}
            {filtered.length === 0 && (
              <EmptyRow colSpan={6} text="No submissions" />
            )}
          </TBody>
        </Table>

        {selected ? (
          <aside className="geist-panel h-fit p-4">
            <p className="text-[11px] text-gray-900">{selected.id}</p>
            <h2 className="mt-1 text-[15px] font-semibold text-gray-1000">
              {selected.subject}
            </h2>
            <p className="mt-1 text-[11px] text-gray-900">
              {selected.customerName} · {selected.channel} ·{' '}
              {TYPE_LABELS[selected.type]} ·{' '}
              {formatDateTime(selected.submittedAt)}
            </p>
            {selected.merchantId && (
              <button
                type="button"
                className="mt-2 text-[12px] font-medium text-blue-900 hover:underline"
                onClick={() => onOpenMerchant(selected.merchantId!)}
              >
                Open organization
              </button>
            )}
            <p className="mt-3 whitespace-pre-wrap text-[13px] text-gray-900">
              {selected.body}
            </p>

            <div className="mt-4 border-t border-gray-400 pt-3">
              <label className="block text-[11px] text-gray-900">
                Priority
                <select
                  value={selected.priority}
                  onChange={(e) =>
                    store.updateSupportPriority(
                      selected.id,
                      e.target.value as SupportPriority,
                    )
                  }
                  className="geist-input mt-1"
                >
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </label>
              <label className="mt-3 block text-[11px] text-gray-900">
                Resolution notes
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={3}
                  className="geist-input mt-1"
                />
              </label>
              <Button
                size="small"
                variant="secondary"
                className="mt-2 w-full"
                onClick={() => store.updateSupportNotes(selected.id, noteDraft)}
              >
                Save notes
              </Button>
              {selected.resolvedAt && (
                <p className="mt-2 text-[11px] text-gray-900">
                  Resolved {formatDateTime(selected.resolvedAt)}
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-400 pt-3">
              {selected.status !== 'in_progress' &&
                selected.status !== 'resolved' && (
                  <Button
                    size="tiny"
                    variant="secondary"
                    onClick={() =>
                      store.updateSupportStatus(selected.id, 'in_progress')
                    }
                  >
                    Mark in progress
                  </Button>
                )}
              {selected.status !== 'resolved' && (
                <Button
                  size="tiny"
                  onClick={() => {
                    if (noteDraft !== selected.resolutionNotes) {
                      store.updateSupportNotes(selected.id, noteDraft)
                    }
                    store.updateSupportStatus(selected.id, 'resolved')
                  }}
                >
                  Resolve
                </Button>
              )}
              {selected.status === 'resolved' && (
                <Button
                  size="tiny"
                  variant="tertiary"
                  onClick={() => store.updateSupportStatus(selected.id, 'open')}
                >
                  Reopen
                </Button>
              )}
            </div>
          </aside>
        ) : (
          <div className="rounded-[12px] border border-dashed border-gray-400 p-6 text-[13px] text-gray-900">
            Select a submission
          </div>
        )}
      </div>
    </div>
  )
}
