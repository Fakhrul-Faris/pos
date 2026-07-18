'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDate } from '@/data/mock'

type Props = {
  onOpenExperiment: (id: string) => void
}

export function Marketing({ onOpenExperiment }: Props) {
  const store = useAdminStore()
  const [tab, setTab] = useState<'all' | 'active' | 'concluded'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    hypothesis: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  })
  const [error, setError] = useState('')

  const rows = useMemo(() => {
    return store.experiments.filter((e) => {
      if (tab === 'all') return true
      return e.status === tab
    })
  }, [store.experiments, tab])

  const postCount = (id: string) =>
    store.posts.filter((p) => p.experimentId === id).length

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-ui text-carbon">
            Marketing
          </h1>
          <p className="mt-1 text-sm text-graphite">
            Organic experiment log — compare hooks and platforms, not vanity
            dashboards. Paid ads out of scope.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
          New experiment
        </button>
      </header>

      <div className="flex gap-2">
        {(
          [
            ['all', 'All'],
            ['active', 'Active'],
            ['concluded', 'Concluded'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium',
              tab === id
                ? 'bg-carbon text-paper-white'
                : 'bg-mist text-graphite hover:bg-fog',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
          <h2 className="text-sm font-semibold text-carbon">Create experiment</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-xs text-ash">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Week 3: pain-point hooks"
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-lavender"
              />
            </label>
            <label className="col-span-2 text-xs text-ash">
              Hypothesis
              <textarea
                value={form.hypothesis}
                onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
                rows={2}
                placeholder="What angle are we testing, on which audience?"
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-lavender"
              />
            </label>
            <label className="text-xs text-ash">
              Start date
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-ash">
              End date (optional)
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-ember">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const id = store.createExperiment({
                  name: form.name,
                  hypothesis: form.hypothesis,
                  startDate: form.startDate,
                  endDate: form.endDate || null,
                })
                if (!id) {
                  setError('Name and hypothesis are required')
                  return
                }
                setShowForm(false)
                setError('')
                setForm({
                  name: '',
                  hypothesis: '',
                  startDate: new Date().toISOString().slice(0, 10),
                  endDate: '',
                })
                onOpenExperiment(id)
              }}
            >
              Create
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setShowForm(false)
                setError('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-fog bg-paper-white shadow-subtle-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/60 text-xs uppercase tracking-[0.06em] text-ash">
            <tr>
              <th className="px-4 py-3 font-medium">Experiment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Posts</th>
              <th className="px-4 py-3 font-medium">Created by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {rows.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer hover:bg-mist"
                onClick={() => onOpenExperiment(e.id)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-carbon">{e.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ash">
                    {e.hypothesis}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={[
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      e.status === 'active'
                        ? 'bg-mint-wash text-mint'
                        : 'bg-mist text-ash',
                    ].join(' ')}
                  >
                    {e.status === 'active' ? 'Active' : 'Concluded'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-graphite">
                  {formatDate(e.startDate)}
                  {e.endDate ? ` → ${formatDate(e.endDate)}` : ' → …'}
                </td>
                <td className="px-4 py-3 tabular-nums text-graphite">
                  {postCount(e.id)}
                </td>
                <td className="px-4 py-3 capitalize text-graphite">
                  {e.createdBy}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ash">
                  No experiments yet. Create one to start logging posts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
