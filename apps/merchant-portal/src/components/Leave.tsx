'use client'

import { useMemo, useState } from 'react'
import type { VerticalLabels } from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import {
  useLeave,
  type LeaveApplication,
  type LeaveCategory,
  type LeaveStatus,
} from '../data/leaveStore'
import { EditGate, PageEditControls, usePageEditMode } from './PageEditControls'

type LeaveTab = 'applications' | 'types' | 'balances'

const tabs: { id: LeaveTab; label: string }[] = [
  { id: 'applications', label: 'Applications' },
  { id: 'balances', label: 'Balances' },
  { id: 'types', label: 'Leave types' },
]

const inputClass =
  'w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none'

const statusTone: Record<LeaveStatus, string> = {
  pending: 'bg-mist text-carbon',
  approved: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-rose-50 text-rose-800',
  cancelled: 'bg-linen text-ash',
}

const categoryLabel: Record<LeaveCategory, string> = {
  annual: 'Annual',
  medical: 'Medical',
  unpaid: 'Unpaid',
  other: 'Other',
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, d))
}

type LeaveProps = {
  vertical: VerticalLabels
}

export function Leave({ vertical }: LeaveProps) {
  const { staff } = useBookings()
  const { leaveTypes, applications, addType, toggleType, apply, decide, cancel } =
    useLeave()

  const [tab, setTab] = useState<LeaveTab>('applications')
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'all'>('all')
  const [draft, setDraft] = useState({
    staffId: staff[0]?.id ?? '',
    leaveTypeId: leaveTypes.find((t) => t.active)?.id ?? '',
    startDate: '',
    endDate: '',
    reason: '',
  })
  const [typeDraft, setTypeDraft] = useState({
    name: '',
    category: 'other' as LeaveCategory,
    maxDaysPerYear: 5,
  })
  const [showApply, setShowApply] = useState(false)
  const {
    editing: pageEditing,
    savedFlash,
    startEdit,
    save,
    cancel: cancelEdit,
  } = usePageEditMode()

  const staffName = (id: string) =>
    staff.find((s) => s.id === id)?.name ?? id

  const typeName = (id: string) =>
    leaveTypes.find((t) => t.id === id)?.name ?? id

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return applications
    return applications.filter((a) => a.status === statusFilter)
  }, [applications, statusFilter])

  const pendingCount = applications.filter((a) => a.status === 'pending').length

  const balances = useMemo(() => {
    const yearPrefix = new Date().getFullYear().toString()
    return staff.map((member) => {
      const rows = leaveTypes
        .filter((t) => t.active)
        .map((type) => {
          const used = applications
            .filter(
              (a) =>
                a.staffId === member.id &&
                a.leaveTypeId === type.id &&
                a.status === 'approved' &&
                a.startDate.startsWith(yearPrefix),
            )
            .reduce((sum, a) => sum + a.totalDays, 0)
          const pending = applications
            .filter(
              (a) =>
                a.staffId === member.id &&
                a.leaveTypeId === type.id &&
                a.status === 'pending',
            )
            .reduce((sum, a) => sum + a.totalDays, 0)
          return {
            typeId: type.id,
            typeName: type.name,
            max: type.maxDaysPerYear,
            used,
            pending,
            remaining: Math.max(0, type.maxDaysPerYear - used),
          }
        })
      return { member, rows }
    })
  }, [staff, leaveTypes, applications])

  function submitApply() {
    if (!draft.staffId || !draft.leaveTypeId || !draft.startDate || !draft.endDate) return
    apply({
      staffId: draft.staffId,
      leaveTypeId: draft.leaveTypeId,
      startDate: draft.startDate,
      endDate: draft.endDate,
      reason: draft.reason.trim(),
    })
    setShowApply(false)
    setDraft((d) => ({ ...d, startDate: '', endDate: '', reason: '' }))
  }

  function submitType() {
    if (!typeDraft.name.trim()) return
    addType({
      name: typeDraft.name.trim(),
      category: typeDraft.category,
      maxDaysPerYear: typeDraft.maxDaysPerYear,
    })
    setTypeDraft({ name: '', category: 'other', maxDaysPerYear: 5 })
  }

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">People</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Leave
          </h1>
          <p className="mt-1 text-sm text-ash">
            Local tracking only · {pendingCount} pending · no gov filing
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pageEditing && tab === 'applications' && (
            <button
              type="button"
              className="btn-primary px-4 py-2"
              onClick={() => setShowApply(true)}
            >
              New application
            </button>
          )}
          <PageEditControls
            editing={pageEditing}
            savedFlash={savedFlash}
            onEdit={startEdit}
            onSave={save}
            onCancel={cancelEdit}
          />
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-fog pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'rounded-t-lg px-3 py-2 text-sm transition-colors',
              tab === t.id
                ? 'bg-mist font-medium text-carbon'
                : 'text-graphite hover:bg-linen hover:text-carbon',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <EditGate editing={pageEditing}>
      {tab === 'applications' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'rejected', 'cancelled'] as const).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={[
                    'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                    statusFilter === s
                      ? 'bg-carbon text-paper-white'
                      : 'bg-linen text-graphite hover:bg-mist',
                  ].join(' ')}
                >
                  {s}
                </button>
              ),
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-fog">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    {vertical.staffSingular}
                  </th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Days</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ash">
                      No applications
                    </td>
                  </tr>
                )}
                {filtered.map((app) => (
                  <ApplicationRow
                    key={app.id}
                    app={app}
                    staffLabel={staffName(app.staffId)}
                    typeLabel={typeName(app.leaveTypeId)}
                    onApprove={() => decide(app.id, 'approved')}
                    onReject={() => decide(app.id, 'rejected', 'Declined by owner')}
                    onCancel={() => cancel(app.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'balances' && (
        <div className="space-y-4">
          {balances.map(({ member, rows }) => (
            <div
              key={member.id}
              className="overflow-x-auto rounded-xl border border-fog"
            >
              <div className="border-b border-fog bg-linen/60 px-4 py-3">
                <p className="text-sm font-medium text-carbon">{member.name}</p>
                <p className="text-xs text-ash">
                  {new Date().getFullYear()} entitlement (approved counts against balance)
                </p>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-ash">
                  <tr>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Used</th>
                    <th className="px-4 py-2 font-medium">Pending</th>
                    <th className="px-4 py-2 font-medium">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.typeId} className="border-t border-fog">
                      <td className="px-4 py-2.5 text-carbon">{r.typeName}</td>
                      <td className="px-4 py-2.5 text-graphite">
                        {r.used} / {r.max}
                      </td>
                      <td className="px-4 py-2.5 text-graphite">{r.pending}</td>
                      <td className="px-4 py-2.5 font-medium text-carbon">
                        {r.remaining}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab === 'types' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="overflow-x-auto rounded-xl border border-fog">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Max / year</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((t) => (
                  <tr key={t.id} className="border-t border-fog">
                    <td className="px-4 py-3 text-carbon">{t.name}</td>
                    <td className="px-4 py-3 text-graphite">
                      {categoryLabel[t.category]}
                    </td>
                    <td className="px-4 py-3 text-graphite">{t.maxDaysPerYear}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleType(t.id)}
                        className={[
                          'rounded-lg px-2.5 py-1 text-xs font-medium',
                          t.active
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-linen text-ash',
                        ].join(' ')}
                      >
                        {t.active ? 'On' : 'Off'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-fog p-4">
            <h2 className="font-display text-sm font-medium text-carbon">
              Add leave type
            </h2>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-ash">Name</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={typeDraft.name}
                  onChange={(e) =>
                    setTypeDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="e.g. Compassionate"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Category</span>
                <select
                  className={`${inputClass} mt-1`}
                  value={typeDraft.category}
                  onChange={(e) =>
                    setTypeDraft((d) => ({
                      ...d,
                      category: e.target.value as LeaveCategory,
                    }))
                  }
                >
                  {(Object.keys(categoryLabel) as LeaveCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel[c]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Max days / year</span>
                <input
                  type="number"
                  min={1}
                  className={`${inputClass} mt-1`}
                  value={typeDraft.maxDaysPerYear}
                  onChange={(e) =>
                    setTypeDraft((d) => ({
                      ...d,
                      maxDaysPerYear: Number(e.target.value) || 1,
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="btn-primary w-full px-4 py-2"
                onClick={submitType}
                disabled={!typeDraft.name.trim()}
              >
                Add type
              </button>
            </div>
          </div>
        </div>
      )}

      {showApply && (
        <div className="fixed inset-0 z-40 flex justify-end bg-carbon/20">
          <button
            type="button"
            className="flex-1"
            aria-label="Close"
            onClick={() => setShowApply(false)}
          />
          <aside className="flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-xl">
            <header className="border-b border-fog px-5 py-4">
              <h2 className="font-display text-base font-medium text-carbon">
                New leave application
              </h2>
              <p className="mt-1 text-xs text-ash">
                Owner can apply on behalf of a {vertical.staffSingular.toLowerCase()}
              </p>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
              <label className="block">
                <span className="text-xs font-medium text-ash">
                  {vertical.staffSingular}
                </span>
                <select
                  className={`${inputClass} mt-1`}
                  value={draft.staffId}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, staffId: e.target.value }))
                  }
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Leave type</span>
                <select
                  className={`${inputClass} mt-1`}
                  value={draft.leaveTypeId}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, leaveTypeId: e.target.value }))
                  }
                >
                  {leaveTypes
                    .filter((t) => t.active)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-ash">Start</span>
                  <input
                    type="date"
                    className={`${inputClass} mt-1`}
                    value={draft.startDate}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, startDate: e.target.value }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ash">End</span>
                  <input
                    type="date"
                    className={`${inputClass} mt-1`}
                    value={draft.endDate}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, endDate: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-ash">Reason</span>
                <textarea
                  className={`${inputClass} mt-1 min-h-[88px]`}
                  value={draft.reason}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, reason: e.target.value }))
                  }
                  placeholder="Optional note"
                />
              </label>
            </div>
            <footer className="flex gap-2 border-t border-fog px-5 py-4">
              <button
                type="button"
                className="flex-1 rounded-lg border border-fog px-4 py-2 text-sm text-graphite hover:bg-linen"
                onClick={() => setShowApply(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 px-4 py-2"
                onClick={submitApply}
                disabled={
                  !draft.staffId ||
                  !draft.leaveTypeId ||
                  !draft.startDate ||
                  !draft.endDate
                }
              >
                Submit
              </button>
            </footer>
          </aside>
        </div>
      )}
      </EditGate>
    </div>
  )
}

function ApplicationRow({
  app,
  staffLabel,
  typeLabel,
  onApprove,
  onReject,
  onCancel,
}: {
  app: LeaveApplication
  staffLabel: string
  typeLabel: string
  onApprove: () => void
  onReject: () => void
  onCancel: () => void
}) {
  return (
    <tr className="border-t border-fog align-top">
      <td className="px-4 py-3">
        <p className="font-medium text-carbon">{staffLabel}</p>
        {app.reason && (
          <p className="mt-0.5 text-xs text-ash line-clamp-2">{app.reason}</p>
        )}
      </td>
      <td className="px-4 py-3 text-graphite">{typeLabel}</td>
      <td className="px-4 py-3 text-graphite">
        {formatDate(app.startDate)}
        {app.startDate !== app.endDate && (
          <>
            <span className="text-ash"> → </span>
            {formatDate(app.endDate)}
          </>
        )}
      </td>
      <td className="px-4 py-3 text-graphite">{app.totalDays}</td>
      <td className="px-4 py-3">
        <span
          className={[
            'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
            statusTone[app.status],
          ].join(' ')}
        >
          {app.status}
        </span>
        {app.remarks && (
          <p className="mt-1 text-[11px] text-ash">{app.remarks}</p>
        )}
      </td>
      <td className="px-4 py-3">
        {app.status === 'pending' ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onApprove}
              className="rounded-md bg-mist px-2 py-1 text-xs font-medium text-carbon hover:bg-lavender/30"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded-md px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-2 py-1 text-xs text-ash hover:bg-linen"
            >
              Cancel
            </button>
          </div>
        ) : (
          <span className="text-xs text-ash">-</span>
        )}
      </td>
    </tr>
  )
}
