'use client'

import { useMemo, useState } from 'react'
import type { VerticalLabels } from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import { useReports } from '../data/reportsStore'
import {
  usePayroll,
  type Payslip,
  type PayslipStatus,
  type PeriodStatus,
} from '../data/payrollStore'
import { EditGate, PageEditControls, usePageEditMode } from './PageEditControls'

type PayTab = 'periods' | 'payslips' | 'structures'

const tabs: { id: PayTab; label: string }[] = [
  { id: 'periods', label: 'Periods' },
  { id: 'payslips', label: 'Payslips' },
  { id: 'structures', label: 'Structures' },
]

const inputClass =
  'w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none'

function formatMoney(n: number) {
  return `RM ${n.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const periodTone: Record<PeriodStatus, string> = {
  open: 'bg-mist text-carbon',
  processing: 'bg-[#fff4e0] text-amber',
  closed: 'bg-mint-wash text-mint',
}

const slipTone: Record<PayslipStatus, string> = {
  draft: 'bg-mist text-graphite',
  approved: 'bg-[#fff4e0] text-amber',
  paid: 'bg-mint-wash text-mint',
}

type PayrollProps = {
  vertical: VerticalLabels
}

export function Payroll({ vertical }: PayrollProps) {
  const { staff, getAllRecords, events } = useBookings()
  const { getRate } = useReports()
  const {
    structures,
    periods,
    payslips,
    upsertStructure,
    setStructureActive,
    createPeriod,
    generateRun,
    approvePayslip,
    markPaid,
    closePeriod,
  } = usePayroll()

  const [tab, setTab] = useState<PayTab>('periods')
  const [selectedPeriodId, setSelectedPeriodId] = useState(
    periods.find((p) => p.status !== 'closed')?.id ?? periods[0]?.id ?? '',
  )
  const [selectedSlipId, setSelectedSlipId] = useState<string | null>(null)
  const { editing: pageEditing, savedFlash, startEdit, save, cancel } = usePageEditMode()
  const [periodDraft, setPeriodDraft] = useState({
    year: 2026,
    month: 8,
    paymentDate: '2026-09-05',
  })
  const [structDraft, setStructDraft] = useState({
    staffId: staff[0]?.id ?? '',
    name: '',
    basicSalary: 2500,
    allowance: 150,
    deduction: 0,
  })

  const bookings = useMemo(() => getAllRecords(), [getAllRecords, events])

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId)

  /** Commission for the selected pay period only (completed jobs × Reports rate) */
  const commissionByStaff = useMemo(() => {
    const map: Record<string, number> = {}
    const start = selectedPeriod?.startDate
    const end = selectedPeriod?.endDate
    for (const member of staff) {
      const revenue = bookings
        .filter((b) => {
          if (b.staffName !== member.name || b.status !== 'completed') return false
          if (start && b.date < start) return false
          if (end && b.date > end) return false
          return true
        })
        .reduce((s, b) => s + (b.amount ?? 0), 0)
      map[member.id] =
        Math.round(((revenue * getRate(member.id)) / 100) * 100) / 100
    }
    return map
  }, [staff, bookings, getRate, selectedPeriod?.startDate, selectedPeriod?.endDate])

  const periodSlips = useMemo(
    () => payslips.filter((s) => s.periodId === selectedPeriodId),
    [payslips, selectedPeriodId],
  )

  const selectedSlip =
    payslips.find((s) => s.id === selectedSlipId) ?? periodSlips[0] ?? null

  const staffName = (id: string) =>
    staff.find((s) => s.id === id)?.name ?? id

  function handleCreatePeriod() {
    const id = createPeriod(periodDraft)
    setSelectedPeriodId(id)
  }

  function handleGenerate() {
    if (!selectedPeriodId) return
    generateRun(selectedPeriodId, staff, commissionByStaff)
    setTab('payslips')
  }

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">People</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Payroll
          </h1>
          <p className="mt-1 text-sm text-ash">
            Local runs · no LHDN / KWSP / SOCSO filing
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pageEditing && tab === 'periods' && selectedPeriod?.status !== 'closed' && (
            <button
              type="button"
              className="btn-primary px-4 py-2"
              onClick={handleGenerate}
            >
              Generate payslips
            </button>
          )}
          <PageEditControls
            editing={pageEditing}
            savedFlash={savedFlash}
            onEdit={startEdit}
            onSave={save}
            onCancel={cancel}
          />
        </div>
      </header>

      <div className="mb-4 rounded-lg border border-fog bg-linen/80 px-3 py-2 text-xs text-graphite">
        Prototype only stores shop-side payroll. Statutory submissions stay
        outside Miki - commission rates come from Reports when you generate a
        run.
      </div>

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
      {tab === 'periods' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="overflow-x-auto rounded-xl border border-fog">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Pay date</th>
                  <th className="px-4 py-3 font-medium">Slips</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => {
                  const count = payslips.filter((s) => s.periodId === p.id).length
                  const active = p.id === selectedPeriodId
                  return (
                    <tr
                      key={p.id}
                      className={[
                        'border-t border-fog',
                        active ? 'bg-mist/50' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-medium text-carbon">
                        {p.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-graphite">
                        {p.startDate} → {p.endDate}
                      </td>
                      <td className="px-4 py-3 text-graphite">{p.paymentDate}</td>
                      <td className="px-4 py-3 text-graphite">{count}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                            periodTone[p.status],
                          ].join(' ')}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-medium text-sky hover:underline"
                          onClick={() => {
                            setSelectedPeriodId(p.id)
                            setTab('payslips')
                          }}
                        >
                          Open
                        </button>
                        {p.status !== 'closed' && count > 0 && (
                          <button
                            type="button"
                            className="ml-3 text-xs text-ash hover:text-carbon"
                            onClick={() => closePeriod(p.id)}
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-fog p-4">
            <h2 className="font-display text-sm font-medium text-carbon">
              New period
            </h2>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-xs font-medium text-ash">Year</span>
                  <input
                    type="number"
                    className={`${inputClass} mt-1`}
                    value={periodDraft.year}
                    onChange={(e) =>
                      setPeriodDraft((d) => ({
                        ...d,
                        year: Number(e.target.value) || d.year,
                      }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ash">Month</span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className={`${inputClass} mt-1`}
                    value={periodDraft.month}
                    onChange={(e) =>
                      setPeriodDraft((d) => ({
                        ...d,
                        month: Math.min(12, Math.max(1, Number(e.target.value) || 1)),
                      }))
                    }
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-ash">Payment date</span>
                <input
                  type="date"
                  className={`${inputClass} mt-1`}
                  value={periodDraft.paymentDate}
                  onChange={(e) =>
                    setPeriodDraft((d) => ({
                      ...d,
                      paymentDate: e.target.value,
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="btn-primary w-full px-4 py-2"
                onClick={handleCreatePeriod}
              >
                Create period
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ash">Period</span>
            <select
              className="rounded-lg border border-fog bg-paper-white px-3 py-1.5 text-sm text-carbon"
              value={selectedPeriodId}
              onChange={(e) => {
                setSelectedPeriodId(e.target.value)
                setSelectedSlipId(null)
              }}
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {selectedPeriod && selectedPeriod.status !== 'closed' && (
              <button
                type="button"
                className="rounded-lg bg-mist px-3 py-1.5 text-xs font-medium text-carbon hover:bg-fog"
                onClick={handleGenerate}
              >
                Regenerate from structures
              </button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="overflow-x-auto rounded-xl border border-fog">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
                  <tr>
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">
                      {vertical.staffSingular}
                    </th>
                    <th className="px-4 py-3 font-medium">Basic</th>
                    <th className="px-4 py-3 font-medium">Net</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {periodSlips.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-ash"
                      >
                        No payslips - generate a run from Periods
                      </td>
                    </tr>
                  )}
                  {periodSlips.map((s) => (
                    <tr
                      key={s.id}
                      className={[
                        'border-t border-fog',
                        selectedSlip?.id === s.id ? 'bg-mist/40' : '',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 text-xs text-ash">{s.number}</td>
                      <td className="px-4 py-3 font-medium text-carbon">
                        {staffName(s.staffId)}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-graphite">
                        {formatMoney(s.basicSalary)}
                      </td>
                      <td className="tabular-nums px-4 py-3 font-medium text-carbon">
                        {formatMoney(s.netPay)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                            slipTone[s.status],
                          ].join(' ')}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-medium text-sky hover:underline"
                          onClick={() => setSelectedSlipId(s.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSlip ? (
              <PayslipDetail
                slip={selectedSlip}
                staffLabel={staffName(selectedSlip.staffId)}
                onApprove={() => approvePayslip(selectedSlip.id)}
                onPaid={() => markPaid(selectedSlip.id)}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-fog p-6 text-sm text-ash">
                Select a payslip to view breakdown
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'structures' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="overflow-x-auto rounded-xl border border-fog">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    {vertical.staffSingular}
                  </th>
                  <th className="px-4 py-3 font-medium">Structure</th>
                  <th className="px-4 py-3 font-medium">Basic</th>
                  <th className="px-4 py-3 font-medium">Allowances</th>
                  <th className="px-4 py-3 font-medium">Deductions</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s) => {
                  const allow = s.lines
                    .filter((l) => l.kind === 'allowance')
                    .reduce((n, l) => n + l.amount, 0)
                  const deduct = s.lines
                    .filter((l) => l.kind === 'deduction')
                    .reduce((n, l) => n + l.amount, 0)
                  return (
                    <tr key={s.id} className="border-t border-fog">
                      <td className="px-4 py-3 font-medium text-carbon">
                        {staffName(s.staffId)}
                      </td>
                      <td className="px-4 py-3 text-graphite">{s.name}</td>
                      <td className="tabular-nums px-4 py-3 text-graphite">
                        {formatMoney(s.basicSalary)}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-graphite">
                        {formatMoney(allow)}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-graphite">
                        {formatMoney(deduct)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setStructureActive(s.id, !s.active)}
                          className={[
                            'rounded-lg px-2.5 py-1 text-xs font-medium',
                            s.active
                              ? 'bg-mint-wash text-mint'
                              : 'bg-linen text-ash',
                          ].join(' ')}
                        >
                          {s.active ? 'On' : 'Off'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-fog p-4">
            <h2 className="font-display text-sm font-medium text-carbon">
              Set structure
            </h2>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-ash">
                  {vertical.staffSingular}
                </span>
                <select
                  className={`${inputClass} mt-1`}
                  value={structDraft.staffId}
                  onChange={(e) =>
                    setStructDraft((d) => ({ ...d, staffId: e.target.value }))
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
                <span className="text-xs font-medium text-ash">Name</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={structDraft.name}
                  onChange={(e) =>
                    setStructDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="e.g. Standard"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Basic salary</span>
                <input
                  type="number"
                  className={`${inputClass} mt-1`}
                  value={structDraft.basicSalary}
                  onChange={(e) =>
                    setStructDraft((d) => ({
                      ...d,
                      basicSalary: Number(e.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Allowance</span>
                <input
                  type="number"
                  className={`${inputClass} mt-1`}
                  value={structDraft.allowance}
                  onChange={(e) =>
                    setStructDraft((d) => ({
                      ...d,
                      allowance: Number(e.target.value) || 0,
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Deduction</span>
                <input
                  type="number"
                  className={`${inputClass} mt-1`}
                  value={structDraft.deduction}
                  onChange={(e) =>
                    setStructDraft((d) => ({
                      ...d,
                      deduction: Number(e.target.value) || 0,
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="btn-primary w-full px-4 py-2"
                onClick={() =>
                  upsertStructure({
                    ...structDraft,
                    name:
                      structDraft.name ||
                      `${staffName(structDraft.staffId)} - standard`,
                  })
                }
              >
                Save structure
              </button>
            </div>
          </div>
        </div>
      )}
      </EditGate>
    </div>
  )
}

function PayslipDetail({
  slip,
  staffLabel,
  onApprove,
  onPaid,
}: {
  slip: Payslip
  staffLabel: string
  onApprove: () => void
  onPaid: () => void
}) {
  return (
    <aside className="rounded-xl border border-fog p-4">
      <p className="text-xs text-ash">{slip.number}</p>
      <h2 className="font-display mt-1 text-base font-medium text-carbon">
        {staffLabel}
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ash">Basic</dt>
          <dd className="tabular-nums text-carbon">
            {formatMoney(slip.basicSalary)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ash">Allowances</dt>
          <dd className="tabular-nums text-graphite">
            {formatMoney(slip.totalAllowance)}
          </dd>
        </div>
        {slip.commission > 0 && (
          <div className="flex justify-between text-xs">
            <dt className="pl-2 text-ash">incl. commission</dt>
            <dd className="tabular-nums text-ash">
              {formatMoney(slip.commission)}
            </dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ash">Deductions</dt>
          <dd className="tabular-nums text-graphite">
            −{formatMoney(slip.totalDeduction)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-fog pt-2">
          <dt className="font-medium text-carbon">Net pay</dt>
          <dd className="tabular-nums font-medium text-carbon">
            {formatMoney(slip.netPay)}
          </dd>
        </div>
      </dl>

      {slip.lines.length > 0 && (
        <div className="mt-4 border-t border-fog pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ash">
            Lines
          </p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {slip.lines.map((l) => (
              <li key={l.id} className="flex justify-between text-graphite">
                <span>
                  {l.kind === 'deduction' ? '− ' : '+ '}
                  {l.description}
                </span>
                <span className="tabular-nums">{formatMoney(l.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {slip.status === 'draft' && (
          <button
            type="button"
            className="btn-primary px-3 py-1.5 text-xs"
            onClick={onApprove}
          >
            Approve
          </button>
        )}
        {slip.status !== 'paid' && (
          <button
            type="button"
            className="rounded-lg border border-fog px-3 py-1.5 text-xs font-medium text-graphite hover:bg-linen"
            onClick={onPaid}
          >
            Mark paid
          </button>
        )}
      </div>
    </aside>
  )
}
