'use client'

import { useMemo, useState } from 'react'
import type { ServiceOption } from '../data/mock'
import { useServices, type ServiceInput } from '../data/servicesStore'
import { IconX } from './icons'
import { PageEditControls, usePageEditMode } from './PageEditControls'

const CATEGORIES = ['Cuts', 'Combos', 'Grooming', 'Other'] as const

function formatPrice(price: number) {
  return `RM ${price.toLocaleString('en-MY')}`
}

function emptyForm(): ServiceInput {
  return {
    label: '',
    durationMinutes: 45,
    bufferMinutes: 5,
    price: 45,
    category: 'Cuts',
    active: true,
  }
}

function formFromService(s: ServiceOption): ServiceInput {
  return {
    label: s.label,
    durationMinutes: s.durationMinutes,
    bufferMinutes: s.bufferMinutes,
    price: s.price,
    category: s.category,
    active: s.active,
  }
}

type EditorProps = {
  title: string
  initial: ServiceInput
  onClose: () => void
  onSave: (input: ServiceInput) => void
}

function ServiceEditor({ title, initial, onClose, onSave }: EditorProps) {
  const [form, setForm] = useState(initial)
  const valid =
    form.label.trim().length > 0 &&
    form.durationMinutes > 0 &&
    form.price >= 0 &&
    form.bufferMinutes >= 0

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-carbon/20">
      <button type="button" className="flex-1 cursor-default" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-xl">
        <header className="flex items-center justify-between border-b border-fog px-5 py-4">
          <h2 className="font-display text-base font-medium tracking-ui text-carbon">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-ash hover:bg-linen hover:text-carbon"
          >
            <IconX />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <label className="block">
            <span className="text-xs font-medium text-ash">Name</span>
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none"
              placeholder="e.g. Skin fade"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ash">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {!CATEGORIES.includes(form.category as (typeof CATEGORIES)[number]) && (
                <option value={form.category}>{form.category}</option>
              )}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-ash">Duration (min)</span>
              <input
                type="number"
                min={5}
                step={5}
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) || 0 }))
                }
                className="mt-1 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ash">Buffer (min)</span>
              <input
                type="number"
                min={0}
                step={5}
                value={form.bufferMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bufferMinutes: Number(e.target.value) || 0 }))
                }
                className="mt-1 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-ash">Price (RM)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-fog text-carbon"
            />
            <span className="text-sm text-carbon">Active (bookable)</span>
          </label>
        </div>

        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2.5">
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave({ ...form, label: form.label.trim() })}
            className="btn-primary flex-1 py-2.5 disabled:opacity-40"
          >
            Save
          </button>
        </footer>
      </aside>
    </div>
  )
}

export function Services() {
  const { services, addService, updateService, toggleActive } = useServices()
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [editing, setEditing] = useState<ServiceOption | null>(null)
  const { editing: pageEditing, savedFlash, startEdit, save, cancel } = usePageEditMode()
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return services.filter((s) => {
      if (!showInactive && !s.active) return false
      if (!q) return true
      return (
        s.label.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      )
    })
  }, [services, query, showInactive])

  const byCategory = useMemo(() => {
    const map = new Map<string, ServiceOption[]>()
    for (const s of filtered) {
      const list = map.get(s.category) ?? []
      list.push(s)
      map.set(s.category, list)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Catalogue</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Services
          </h1>
          <p className="mt-1 text-sm text-ash">
            {services.filter((s) => s.active).length} active · {services.length} total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services"
            className="w-full max-w-xs rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon placeholder:text-ash focus:border-lavender focus:outline-none"
          />
          {pageEditing && (
            <button type="button" onClick={() => setCreating(true)} className="btn-primary px-4 py-2">
              Add service
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

      <label className="mb-4 flex items-center gap-2 text-sm text-graphite">
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          className="h-4 w-4 rounded border-fog"
        />
        Show inactive
      </label>

      {byCategory.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-fog py-12 text-center text-sm text-ash">
          No services match
        </p>
      ) : (
        <div className="space-y-6">
          {byCategory.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-ui text-ash">
                {category}
              </h2>
              <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                      <th className="px-4 py-2.5 font-medium">Service</th>
                      <th className="px-4 py-2.5 font-medium">Duration</th>
                      <th className="px-4 py-2.5 font-medium">Buffer</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => pageEditing && setEditing(s)}
                        className={[pageEditing ? 'cursor-pointer hover:bg-linen' : '', 'border-b border-fog last:border-0'].join(' ')}
                      >
                        <td className="px-4 py-3 font-medium text-carbon">{s.label}</td>
                        <td className="tabular-nums px-4 py-3 text-graphite">
                          {s.durationMinutes} min
                        </td>
                        <td className="tabular-nums px-4 py-3 text-graphite">
                          {s.bufferMinutes} min
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!pageEditing) return
                              toggleActive(s.id)
                            }}
                            disabled={!pageEditing}
                            className={[
                              'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                              s.active
                                ? 'bg-mist text-sky'
                                : 'bg-linen text-ash',
                            ].join(' ')}
                          >
                            {s.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="tabular-nums px-4 py-3 text-right font-medium text-carbon">
                          {formatPrice(s.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {creating && (
        <ServiceEditor
          title="Add service"
          initial={emptyForm()}
          onClose={() => setCreating(false)}
          onSave={(input) => {
            addService(input)
            setCreating(false)
          }}
        />
      )}

      {editing && (
        <ServiceEditor
          title="Edit service"
          initial={formFromService(editing)}
          onClose={() => setEditing(null)}
          onSave={(input) => {
            updateService(editing.id, input)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
