'use client'

import { useMemo, useState } from 'react'
import { useAdminStore } from '@/data/store'
import { formatDate, formatDateTime } from '@/data/mock'
import type { ContentType, MarketingPost, SocialPlatform } from '@/data/types'
import {
  CONTENT_TYPE_LABELS,
  PLATFORM_LABELS,
} from '@/data/types'

type Props = {
  experimentId: string
  onBack: () => void
}

type SortKey = 'postedAt' | 'likes' | 'comments' | 'shares' | 'views' | 'platform'

function metricNum(n: number | null | undefined) {
  return n == null ? '—' : n.toLocaleString('en-MY')
}

function parseMetric(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function MarketingDetail({ experimentId, onBack }: Props) {
  const store = useAdminStore()
  const experiment = store.experiments.find((e) => e.id === experimentId)
  const [sort, setSort] = useState<SortKey>('postedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showPostForm, setShowPostForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [learnings, setLearnings] = useState(experiment?.learnings ?? '')
  const [showConclude, setShowConclude] = useState(false)
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    platform: 'facebook' as SocialPlatform,
    url: '',
    postedAt: new Date().toISOString().slice(0, 10),
    contentType: 'pain_point_rant' as ContentType,
    hook: '',
    likes: '',
    comments: '',
    shares: '',
    saves: '',
    views: '',
  })

  const posts = useMemo(() => {
    const list = store.posts.filter((p) => p.experimentId === experimentId)
    const dir = sortDir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => {
      if (sort === 'postedAt' || sort === 'platform') {
        const av = a[sort]
        const bv = b[sort]
        return av < bv ? -dir : av > bv ? dir : 0
      }
      const av = a.metrics[sort] ?? -1
      const bv = b.metrics[sort] ?? -1
      return (av - bv) * dir
    })
  }, [store.posts, experimentId, sort, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSort(key)
      setSortDir(key === 'postedAt' ? 'desc' : 'desc')
    }
  }

  const openEdit = (p: MarketingPost) => {
    setEditingId(p.id)
    setShowPostForm(true)
    setForm({
      platform: p.platform,
      url: p.url,
      postedAt: p.postedAt,
      contentType: p.contentType,
      hook: p.hook,
      likes: p.metrics.likes?.toString() ?? '',
      comments: p.metrics.comments?.toString() ?? '',
      shares: p.metrics.shares?.toString() ?? '',
      saves: p.metrics.saves?.toString() ?? '',
      views: p.metrics.views?.toString() ?? '',
    })
    setFormError('')
  }

  const openNew = () => {
    setEditingId(null)
    setShowPostForm(true)
    setForm({
      platform: 'facebook',
      url: '',
      postedAt: new Date().toISOString().slice(0, 10),
      contentType: 'pain_point_rant',
      hook: '',
      likes: '',
      comments: '',
      shares: '',
      saves: '',
      views: '',
    })
    setFormError('')
  }

  const submitPost = () => {
    if (!form.url.trim() || !form.hook.trim()) {
      setFormError('URL and hook are required')
      return
    }
    const metrics = {
      likes: parseMetric(form.likes),
      comments: parseMetric(form.comments),
      shares: parseMetric(form.shares),
      saves: parseMetric(form.saves),
      views: parseMetric(form.views),
    }
    if (editingId) {
      store.updatePost(editingId, {
        platform: form.platform,
        url: form.url,
        postedAt: form.postedAt,
        contentType: form.contentType,
        hook: form.hook,
        metrics,
      })
    } else {
      store.addPost({
        experimentId,
        platform: form.platform,
        url: form.url,
        postedAt: form.postedAt,
        contentType: form.contentType,
        hook: form.hook,
        metrics,
      })
    }
    setShowPostForm(false)
    setEditingId(null)
  }

  if (!experiment) {
    return (
      <div>
        <button type="button" onClick={onBack} className="text-sm text-lavender">
          ← Marketing
        </button>
        <p className="mt-4 text-sm text-ash">Experiment not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onBack}
        className="w-fit text-sm text-lavender hover:underline"
      >
        ← Marketing
      </button>

      <header className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-ui text-carbon">
                {experiment.name}
              </h1>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  experiment.status === 'active'
                    ? 'bg-mint-wash text-mint'
                    : 'bg-mist text-ash',
                ].join(' ')}
              >
                {experiment.status === 'active' ? 'Active' : 'Concluded'}
              </span>
            </div>
            <p className="mt-2 text-sm text-graphite">{experiment.hypothesis}</p>
            <p className="mt-2 text-xs text-ash">
              {formatDate(experiment.startDate)}
              {experiment.endDate ? ` → ${formatDate(experiment.endDate)}` : ' → ongoing'}{' '}
              · {posts.length} post{posts.length === 1 ? '' : 's'} · by{' '}
              {experiment.createdBy}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-ghost" onClick={openNew}>
              Log post
            </button>
            {experiment.status === 'active' && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setLearnings(experiment.learnings)
                  setShowConclude(true)
                }}
              >
                Conclude
              </button>
            )}
          </div>
        </div>
        {experiment.status === 'concluded' && experiment.learnings && (
          <div className="mt-4 rounded-lg bg-mist px-3 py-2 text-sm text-graphite">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-ash">
              Learnings
            </p>
            <p className="mt-1">{experiment.learnings}</p>
          </div>
        )}
      </header>

      {showPostForm && (
        <div className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
          <h2 className="text-sm font-semibold text-carbon">
            {editingId ? 'Edit post / metrics' : 'Log post'}
          </h2>
          <p className="mt-1 text-xs text-ash">
            Metrics are manual for v1 (`source: manual`). Same shape can be filled
            by API later.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="text-xs text-ash">
              Platform
              <select
                value={form.platform}
                onChange={(e) =>
                  setForm({ ...form, platform: e.target.value as SocialPlatform })
                }
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              >
                {(Object.keys(PLATFORM_LABELS) as SocialPlatform[]).map((p) => (
                  <option key={p} value={p}>
                    {PLATFORM_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ash">
              Content type
              <select
                value={form.contentType}
                onChange={(e) =>
                  setForm({ ...form, contentType: e.target.value as ContentType })
                }
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              >
                {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((c) => (
                  <option key={c} value={c}>
                    {CONTENT_TYPE_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="col-span-2 text-xs text-ash">
              Post URL
              <input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-lavender"
              />
            </label>
            <label className="text-xs text-ash">
              Date posted
              <input
                type="date"
                value={form.postedAt}
                onChange={(e) => setForm({ ...form, postedAt: e.target.value })}
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-ash">
              Hook / angle
              <input
                value={form.hook}
                onChange={(e) => setForm({ ...form, hook: e.target.value })}
                placeholder="queue-chaos"
                className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-lavender"
              />
            </label>
            {(
              [
                ['likes', 'Likes'],
                ['comments', 'Comments'],
                ['shares', 'Shares / reposts'],
                ['saves', 'Saves'],
                ['views', 'Views / impressions'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-xs text-ash">
                {label}
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="—"
                  className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm tabular-nums"
                />
              </label>
            ))}
          </div>
          {formError && <p className="mt-2 text-xs text-ember">{formError}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn-primary" onClick={submitPost}>
              {editingId ? 'Save' : 'Add post'}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setShowPostForm(false)
                setEditingId(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showConclude && (
        <div className="rounded-xl border border-fog bg-paper-white p-5 shadow-subtle-2">
          <h2 className="text-sm font-semibold text-carbon">Conclude experiment</h2>
          <label className="mt-3 block text-xs text-ash">
            Learnings / notes
            <textarea
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-lavender"
            />
          </label>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                store.concludeExperiment(experiment.id, learnings)
                setShowConclude(false)
              }}
            >
              Mark concluded
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowConclude(false)}
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
              {(
                [
                  ['platform', 'Platform'],
                  ['postedAt', 'Posted'],
                  ['likes', 'Likes'],
                  ['comments', 'Comments'],
                  ['shares', 'Shares'],
                  ['views', 'Views'],
                ] as const
              ).map(([key, label]) => (
                <th key={key} className="px-3 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="hover:text-carbon"
                  >
                    {label}
                    {sort === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </button>
                </th>
              ))}
              <th className="px-3 py-3 font-medium">Hook</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">By</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-fog">
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-mist/50">
                <td className="px-3 py-3 font-medium text-carbon">
                  {PLATFORM_LABELS[p.platform]}
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 block text-xs text-lavender hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open ↗
                  </a>
                </td>
                <td className="px-3 py-3 text-xs text-graphite">
                  {formatDate(p.postedAt)}
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {metricNum(p.metrics.likes)}
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {metricNum(p.metrics.comments)}
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {metricNum(p.metrics.shares)}
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {metricNum(p.metrics.views)}
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-full bg-mist px-2 py-0.5 text-xs text-graphite">
                    {p.hook}
                  </span>
                </td>
                <td className="px-3 py-3 text-xs text-ash">
                  {CONTENT_TYPE_LABELS[p.contentType]}
                </td>
                <td className="px-3 py-3 capitalize text-xs text-ash">
                  {p.postedBy}
                  {p.metrics.updatedAt && (
                    <span className="mt-0.5 block">
                      upd {formatDateTime(p.metrics.updatedAt)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="text-xs font-medium text-lavender hover:underline"
                    onClick={() => openEdit(p)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-ash">
                  No posts yet. Log the first organic post for this experiment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
