'use client'

import { useMemo, useState } from 'react'
import type { VerticalLabels } from '../data/mock'
import { useBookings } from '../data/bookingsStore'
import {
  useRoster,
  type AttendanceStatus,
  type ShiftAssignment,
} from '../data/rosterStore'
import { EditGate, PageEditControls, usePageEditMode } from './PageEditControls'

type RosterTab = 'week' | 'attendance' | 'overtime' | 'templates'

const tabs: { id: RosterTab; label: string }[] = [
  { id: 'week', label: 'Week schedule' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'overtime', label: 'Overtime' },
  { id: 'templates', label: 'Templates' },
]

const inputClass =
  'w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none'

function dayLabel(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(y, m - 1, d))
}

type RosterProps = {
  vertical: VerticalLabels
}

export function Roster({ vertical }: RosterProps) {
  const { staff } = useBookings()
  const {
    templates,
    assignments,
    attendance,
    overtime,
    weekDates,
    assignShift,
    clearAssignment,
    publishWeek,
    setAttendance,
    addOvertime,
    decideOvertime,
    addTemplate,
  } = useRoster()

  const [tab, setTab] = useState<RosterTab>('week')
  const { editing: pageEditing, savedFlash, startEdit, save, cancel } = usePageEditMode()
  const [otDraft, setOtDraft] = useState({
    staffId: staff[0]?.id ?? '',
    date: weekDates[0] ?? '',
    start: '20:00',
    end: '21:00',
    reason: '',
  })
  const [tplDraft, setTplDraft] = useState({
    code: '',
    name: '',
    start: '10:00',
    end: '18:00',
    breakMinutes: 30,
  })

  const assignmentMap = useMemo(() => {
    const map = new Map<string, ShiftAssignment>()
    for (const a of assignments) {
      map.set(`${a.staffId}|${a.date}`, a)
    }
    return map
  }, [assignments])

  const unpublished = assignments.filter(
    (a) => weekDates.includes(a.date) && !a.published,
  ).length

  const activeTemplates = templates.filter((t) => t.active)

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">People</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Roster
          </h1>
          <p className="mt-1 text-sm text-ash">
            {staff.length} {vertical.staffPlural.toLowerCase()} · {unpublished} unpublished
            shifts this week
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pageEditing && tab === 'week' && (
            <button type="button" className="btn-primary px-4 py-2" onClick={publishWeek}>
              Publish week
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
      {tab === 'week' && (
        <div className="overflow-x-auto rounded-2xl border border-fog bg-paper-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                <th className="sticky left-0 bg-linen/50 px-3 py-2.5 font-medium">
                  {vertical.staffSingular}
                </th>
                {weekDates.map((d) => (
                  <th key={d} className="px-2 py-2.5 font-medium">
                    {dayLabel(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-fog last:border-0">
                  <td className="sticky left-0 bg-paper-white px-3 py-2 font-medium text-carbon">
                    {member.name}
                  </td>
                  {weekDates.map((date) => {
                    const key = `${member.id}|${date}`
                    const assignment = assignmentMap.get(key)
                    const tpl = templates.find((t) => t.id === assignment?.templateId)
                    return (
                      <td key={date} className="px-2 py-2 align-top">
                        <select
                          className={[
                            'w-full rounded-lg border px-2 py-1.5 text-xs',
                            assignment?.published
                              ? 'border-lavender/40 bg-mist'
                              : 'border-fog bg-paper-white',
                          ].join(' ')}
                          value={assignment?.templateId ?? ''}
                          onChange={(e) => {
                            const v = e.target.value
                            if (!v) clearAssignment(member.id, date)
                            else assignShift(member.id, date, v)
                          }}
                        >
                          <option value="">Off</option>
                          {activeTemplates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.code} {t.start}-{t.end}
                            </option>
                          ))}
                        </select>
                        {tpl && (
                          <p className="mt-1 text-[10px] text-ash">
                            {assignment?.published ? 'Published' : 'Draft'} · {tpl.name}
                          </p>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                <th className="px-4 py-2.5 font-medium">{vertical.staffSingular}</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Clock in</th>
                <th className="px-4 py-2.5 font-medium">Clock out</th>
                <th className="px-4 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const rec = attendance.find(
                  (a) => a.staffId === member.id && a.date === weekDates[0],
                )
                return (
                  <tr key={member.id} className="border-b border-fog last:border-0">
                    <td className="px-4 py-3 font-medium text-carbon">{member.name}</td>
                    <td className="px-4 py-3">
                      <select
                        className={inputClass}
                        value={rec?.status ?? 'absent'}
                        onChange={(e) =>
                          setAttendance(member.id, weekDates[0], {
                            status: e.target.value as AttendanceStatus,
                          })
                        }
                      >
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                        <option value="leave">Leave</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        className={inputClass}
                        value={rec?.clockIn ?? ''}
                        onChange={(e) =>
                          setAttendance(member.id, weekDates[0], {
                            clockIn: e.target.value || null,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        className={inputClass}
                        value={rec?.clockOut ?? ''}
                        onChange={(e) =>
                          setAttendance(member.id, weekDates[0], {
                            clockOut: e.target.value || null,
                          })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className={inputClass}
                        value={rec?.notes ?? ''}
                        onChange={(e) =>
                          setAttendance(member.id, weekDates[0], {
                            notes: e.target.value,
                          })
                        }
                        placeholder="Optional"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="border-t border-fog px-4 py-2 text-xs text-ash">
            Showing attendance for {dayLabel(weekDates[0])} (week start / today anchor).
          </p>
        </div>
      )}

      {tab === 'overtime' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">Request overtime</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              <select
                className={inputClass}
                value={otDraft.staffId}
                onChange={(e) => setOtDraft((d) => ({ ...d, staffId: e.target.value }))}
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className={inputClass}
                value={otDraft.date}
                onChange={(e) => setOtDraft((d) => ({ ...d, date: e.target.value }))}
              />
              <input
                type="time"
                className={inputClass}
                value={otDraft.start}
                onChange={(e) => setOtDraft((d) => ({ ...d, start: e.target.value }))}
              />
              <input
                type="time"
                className={inputClass}
                value={otDraft.end}
                onChange={(e) => setOtDraft((d) => ({ ...d, end: e.target.value }))}
              />
              <button
                type="button"
                className="btn-primary px-3 py-2"
                onClick={() => {
                  if (!otDraft.staffId || !otDraft.date) return
                  addOvertime(otDraft)
                  setOtDraft((d) => ({ ...d, reason: '' }))
                }}
              >
                Submit
              </button>
            </div>
            <input
              className={`${inputClass} mt-2`}
              placeholder="Reason"
              value={otDraft.reason}
              onChange={(e) => setOtDraft((d) => ({ ...d, reason: e.target.value }))}
            />
          </section>

          <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                  <th className="px-4 py-2.5 font-medium">{vertical.staffSingular}</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Time</th>
                  <th className="px-4 py-2.5 font-medium">Reason</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {overtime.map((o) => (
                  <tr key={o.id} className="border-b border-fog last:border-0">
                    <td className="px-4 py-3 font-medium text-carbon">
                      {staff.find((s) => s.id === o.staffId)?.name ?? o.staffId}
                    </td>
                    <td className="px-4 py-3 text-graphite">{o.date}</td>
                    <td className="tabular-nums px-4 py-3 text-graphite">
                      {o.start}-{o.end}
                    </td>
                    <td className="px-4 py-3 text-graphite">{o.reason || '-'}</td>
                    <td className="px-4 py-3 capitalize text-graphite">{o.status}</td>
                    <td className="px-4 py-3 text-right">
                      {o.status === 'pending' && (
                        <span className="inline-flex gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium text-sky hover:underline"
                            onClick={() => decideOvertime(o.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="text-xs text-ash hover:text-carbon"
                            onClick={() => decideOvertime(o.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">Add template</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              <input
                className={inputClass}
                placeholder="Code"
                value={tplDraft.code}
                onChange={(e) => setTplDraft((d) => ({ ...d, code: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Name"
                value={tplDraft.name}
                onChange={(e) => setTplDraft((d) => ({ ...d, name: e.target.value }))}
              />
              <input
                type="time"
                className={inputClass}
                value={tplDraft.start}
                onChange={(e) => setTplDraft((d) => ({ ...d, start: e.target.value }))}
              />
              <input
                type="time"
                className={inputClass}
                value={tplDraft.end}
                onChange={(e) => setTplDraft((d) => ({ ...d, end: e.target.value }))}
              />
              <button
                type="button"
                className="btn-primary px-3 py-2"
                disabled={!tplDraft.code.trim() || !tplDraft.name.trim()}
                onClick={() => {
                  addTemplate(tplDraft)
                  setTplDraft({
                    code: '',
                    name: '',
                    start: '10:00',
                    end: '18:00',
                    breakMinutes: 30,
                  })
                }}
              >
                Save
              </button>
            </div>
          </section>
          <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                  <th className="px-4 py-2.5 font-medium">Code</th>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Hours</th>
                  <th className="px-4 py-2.5 font-medium">Break</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-fog last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-carbon">{t.code}</td>
                    <td className="px-4 py-3 font-medium text-carbon">{t.name}</td>
                    <td className="tabular-nums px-4 py-3 text-graphite">
                      {t.start}-{t.end}
                    </td>
                    <td className="tabular-nums px-4 py-3 text-graphite">
                      {t.breakMinutes} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </EditGate>
    </div>
  )
}