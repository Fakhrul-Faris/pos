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
    <div className="flex flex-col gap-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="page-title">
            Marketing
          </h1>
          <p className="page-desc">
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
            data-active={tab === id ? 'true' : 'false'}
            className="geist-chip"
          >
            {label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="geist-panel p-4">
          <h2 className="text-sm font-semibold text-gray-1000">Create experiment</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-xs text-gray-900">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Week 3: pain-point hooks"
                className="mt-1 w-full rounded-[6px] border border-gray-400 px-3 py-2 text-sm outline-none focus:border-gray-600"
              />
            </label>
            <label className="col-span-2 text-xs text-gray-900">
              Hypothesis
              <textarea
                value={form.hypothesis}
                onChange={(e) => setForm({ ...form, hypothesis: e.target.value })}
                rows={2}
                placeholder="What angle are we testing, on which audience?"
                className="mt-1 w-full rounded-[6px] border border-gray-400 px-3 py-2 text-sm outline-none focus:border-gray-600"
              />
            </label>
            <label className="text-xs text-gray-900">
              Start date
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="geist-input mt-1"
              />
            </label>
            <label className="text-xs text-gray-900">
              End date (optional)
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="geist-input mt-1"
              />
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-red-900">{error}</p>}
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

      <div className="geist-panel overflow-hidden">
        <table className="geist-table">
          <thead>
            <tr>
              <th className="px-3 py-2 font-medium">Experiment</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Dates</th>
              <th className="px-3 py-2 font-medium">Posts</th>
              <th className="px-3 py-2 font-medium">Created by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-400">
            {rows.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer "
                onClick={() => onOpenExperiment(e.id)}
              >
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-1000">{e.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-900">
                    {e.hypothesis}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={[
                      'inline-flex rounded-[6px] px-1.5 py-0.5 text-xs font-medium',
                      e.status === 'active'
                        ? 'bg-green-100 text-green-900'
                        : 'bg-gray-200 text-gray-900',
                    ].join(' ')}
                  >
                    {e.status === 'active' ? 'Active' : 'Concluded'}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-900">
                  {formatDate(e.startDate)}
                  {e.endDate ? ` → ${formatDate(e.endDate)}` : ' → …'}
                </td>
                <td className="px-3 py-2 tabular-nums text-gray-900">
                  {postCount(e.id)}
                </td>
                <td className="px-3 py-2 capitalize text-gray-900">
                  {e.createdBy}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-900">
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
