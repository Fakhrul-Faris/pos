'use client'

import { useEffect, useState } from 'react'
import {
  PLAN_LABELS,
  PLAN_PRICES,
  merchantPlanForTier,
  useShopSettings,
  type PlanTier,
} from '../data/settingsStore'
import { useBookings } from '../data/bookingsStore'
import { EditGate, PageEditControls, usePageEditMode } from './PageEditControls'

export type SettingsTab = 'shop' | 'rules' | 'qr' | 'billing' | 'account'

const tabs: { id: SettingsTab; label: string }[] = [
  { id: 'shop', label: 'Shop & locations' },
  { id: 'rules', label: 'Booking rules' },
  { id: 'qr', label: 'QR & devices' },
  { id: 'billing', label: 'Billing' },
  { id: 'account', label: 'Account' },
]

type SettingsProps = {
  initialTab?: SettingsTab
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ash">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none disabled:cursor-not-allowed'

export function Settings({ initialTab = 'shop' }: SettingsProps) {
  const { settings, update, setHours, addWalkInBlock, removeWalkInBlock, setPlan } =
    useShopSettings()
  const { upgradePlan } = useBookings()
  const [tab, setTab] = useState<SettingsTab>(initialTab)
  const [blockDraft, setBlockDraft] = useState({
    day: 'Sat',
    start: '12:00',
    end: '14:00',
    label: 'Walk-in only',
  })
  const { editing, savedFlash, startEdit, save, cancel } = usePageEditMode()

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Settings</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Shop setup
          </h1>
          <p className="mt-1 text-sm text-ash">
            Org → Brand → Branch · Billing attaches to Brand
          </p>
        </div>
        <PageEditControls
          editing={editing}
          savedFlash={savedFlash}
          onEdit={startEdit}
          onSave={save}
          onCancel={cancel}
        />
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

      <EditGate editing={editing}>
      {tab === 'shop' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">Hierarchy</h2>
            <p className="mt-1 text-xs text-ash">
              Organization owns Brand; Brand bills; Branch is the outlet.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label="Organization">
                <input
                  className={inputClass}
                  value={settings.organizationName}
                  onChange={(e) => update({ organizationName: e.target.value })}
                />
              </Field>
              <Field label="Brand (billable)">
                <input
                  className={inputClass}
                  value={settings.brandName}
                  onChange={(e) => update({ brandName: e.target.value })}
                />
              </Field>
              <Field label="Branch / outlet">
                <input
                  className={inputClass}
                  value={settings.branchName}
                  onChange={(e) => update({ branchName: e.target.value })}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">Branch contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Address">
                <input
                  className={inputClass}
                  value={settings.address}
                  onChange={(e) => update({ address: e.target.value })}
                />
              </Field>
              <Field label="Timezone">
                <input
                  className={inputClass}
                  value={settings.timezone}
                  onChange={(e) => update({ timezone: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={settings.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputClass}
                  value={settings.email}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">Operating hours</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="border-b border-fog text-xs text-ash">
                    <th className="py-2 pr-3 font-medium">Day</th>
                    <th className="py-2 pr-3 font-medium">Open</th>
                    <th className="py-2 pr-3 font-medium">Close</th>
                    <th className="py-2 font-medium">Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.hours.map((h) => (
                    <tr key={h.day} className="border-b border-fog last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-carbon">{h.day}</td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="time"
                          disabled={h.closed}
                          value={h.open}
                          onChange={(e) => setHours(h.day, { open: e.target.value })}
                          className={`${inputClass} disabled:opacity-40`}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="time"
                          disabled={h.closed}
                          value={h.close}
                          onChange={(e) => setHours(h.day, { close: e.target.value })}
                          className={`${inputClass} disabled:opacity-40`}
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={h.closed}
                          onChange={(e) => {
                            setHours(h.day, { closed: e.target.checked })
                          }}
                          className="h-4 w-4 rounded border-fog"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">Booking flags</h2>
            <ul className="mt-4 space-y-3">
              {(
                [
                  {
                    key: 'allowPickStaff' as const,
                    label: 'Customers can pick staff',
                    hint: 'Off = “Anyone” only on web',
                  },
                  {
                    key: 'allowPartyBookings' as const,
                    label: 'Party bookings',
                    hint: 'One queue #, per-person services',
                  },
                  {
                    key: 'enableQueue' as const,
                    label: 'Enable walk-in queue',
                    hint: 'Hybrid online + walk-in',
                  },
                  {
                    key: 'qrPaymentAllowed' as const,
                    label: 'Allow QR payment at checkout',
                    hint: 'POS HitPay / DuitNow QR',
                  },
                ] as const
              ).map((row) => (
                <li
                  key={row.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-fog px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-carbon">{row.label}</p>
                    <p className="text-xs text-ash">{row.hint}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[row.key]}
                    onChange={(e) => {
                      update({ [row.key]: e.target.checked })
                    }}
                    className="mt-1 h-4 w-4 rounded border-fog"
                  />
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Auto no-show (minutes)">
                <input
                  type="number"
                  min={5}
                  className={inputClass}
                  value={settings.autoNoShowMinutes}
                  onChange={(e) =>
                    update({ autoNoShowMinutes: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Early arrival grace (minutes)">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={settings.earlyArrivalGraceMinutes}
                  onChange={(e) =>
                    update({ earlyArrivalGraceMinutes: Number(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">
              Walk-in slot blocks
            </h2>
            <p className="mt-1 text-xs text-ash">
              Paint “walk-in only” windows on the timetable (prototype list).
            </p>
            <ul className="mt-4 space-y-2">
              {settings.walkInBlocks.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-fog px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-carbon">{b.label}</p>
                    <p className="text-xs text-ash">
                      {b.day} · {b.start}-{b.end}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeWalkInBlock(b.id)
                    }}
                    className="text-xs text-ash hover:text-carbon"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {settings.walkInBlocks.length === 0 && (
                <p className="text-sm text-ash">No walk-in blocks yet.</p>
              )}
            </ul>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <select
                className={inputClass}
                value={blockDraft.day}
                onChange={(e) => setBlockDraft((d) => ({ ...d, day: e.target.value }))}
              >
                {settings.hours.map((h) => (
                  <option key={h.day} value={h.day}>
                    {h.day}
                  </option>
                ))}
              </select>
              <input
                type="time"
                className={inputClass}
                value={blockDraft.start}
                onChange={(e) => setBlockDraft((d) => ({ ...d, start: e.target.value }))}
              />
              <input
                type="time"
                className={inputClass}
                value={blockDraft.end}
                onChange={(e) => setBlockDraft((d) => ({ ...d, end: e.target.value }))}
              />
              <input
                className={inputClass}
                value={blockDraft.label}
                onChange={(e) => setBlockDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Label"
              />
            </div>
            <button
              type="button"
              className="btn-primary mt-3 px-4 py-2"
              onClick={() => {
                addWalkInBlock(blockDraft)
              }}
            >
              Add block
            </button>
          </section>
        </div>
      )}

      {tab === 'qr' && (
        <div className="space-y-4">
          {[
            {
              title: 'Shop QR',
              hint: 'Customer landing - print for window / cards',
              url: settings.shopQrUrl,
              key: 'shopQrUrl' as const,
            },
            {
              title: 'Counter retrieve QR',
              hint: 'Lookup booking at the counter',
              url: settings.counterQrUrl,
              key: 'counterQrUrl' as const,
            },
          ].map((card) => (
            <section
              key={card.key}
              className="flex flex-wrap items-start gap-5 rounded-2xl border border-fog bg-paper-white p-5"
            >
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-fog bg-linen"
                aria-hidden
              >
                <span className="font-mono text-[10px] text-ash">QR</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-sm font-medium text-carbon">{card.title}</h2>
                <p className="mt-1 text-xs text-ash">{card.hint}</p>
                <input
                  className={`${inputClass} mt-3`}
                  value={card.url}
                  onChange={(e) => update({ [card.key]: e.target.value })}
                />
                <div className="mt-3 flex gap-2">
                  <button type="button" className="btn-ghost px-3 py-1.5 text-sm">
                    Print
                  </button>
                  <button
                    type="button"
                    className="btn-ghost px-3 py-1.5 text-sm"
                    onClick={() => {
                      void navigator.clipboard?.writeText(card.url)
                    }}
                  >
                    Copy link
                  </button>
                </div>
              </div>
            </section>
          ))}
          <p className="text-xs text-ash">
            Shared POS device pairing stays on the counter tablet - not configured here.
          </p>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-ash">Brand billing · {settings.brandName}</p>
                <h2 className="font-display mt-1 text-lg font-medium text-carbon">
                  {PLAN_LABELS[settings.plan]}
                </h2>
                <p className="mt-1 text-sm text-graphite">
                  {PLAN_PRICES[settings.plan]}
                  {settings.plan === 'trial'
                    ? ` · ends ${settings.trialEndsAt}`
                    : ` · ${settings.billingCycle}`}
                </p>
              </div>
              <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-sky">
                {settings.plan === 'trial' ? 'Trial' : 'Active'}
              </span>
            </div>
            {settings.plan === 'trial' && (
              <p className="mt-4 rounded-xl bg-linen px-4 py-3 text-sm text-graphite">
                After trial: subscribe to Ocelot+ or drop to Lite (free, capped).
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">Change plan</h2>
            <p className="mt-1 text-xs text-ash">Prototype - switches local state only.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(
                [
                  'lite',
                  'ocelot',
                  'mantis',
                  'patriot',
                ] as PlanTier[]
              ).map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => {
                    setPlan(plan)
                    upgradePlan(merchantPlanForTier(plan))
                  }}
                  className={[
                    'rounded-xl border px-4 py-3 text-left transition-colors',
                    settings.plan === plan
                      ? 'border-lavender bg-mist'
                      : 'border-fog hover:bg-linen',
                  ].join(' ')}
                >
                  <p className="text-sm font-medium text-carbon">{PLAN_LABELS[plan]}</p>
                  <p className="text-xs text-ash">{PLAN_PRICES[plan]}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className={[
                  'rounded-lg px-3 py-1.5 text-xs',
                  settings.billingCycle === 'monthly'
                    ? 'bg-mist font-medium text-carbon'
                    : 'text-ash hover:bg-linen',
                ].join(' ')}
                onClick={() => {
                  update({ billingCycle: 'monthly' })
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                className={[
                  'rounded-lg px-3 py-1.5 text-xs',
                  settings.billingCycle === 'annual'
                    ? 'bg-mist font-medium text-carbon'
                    : 'text-ash hover:bg-linen',
                ].join(' ')}
                onClick={() => {
                  update({ billingCycle: 'annual' })
                }}
              >
                Annual
              </button>
            </div>
          </section>
        </div>
      )}

      {tab === 'account' && (
        <section className="rounded-2xl border border-fog bg-paper-white p-5">
          <h2 className="font-display text-sm font-medium text-carbon">Owner account</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input
                className={inputClass}
                value={settings.ownerName}
                onChange={(e) => update({ ownerName: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <input
                className={inputClass}
                value={settings.ownerEmail}
                onChange={(e) => update({ ownerEmail: e.target.value })}
              />
            </Field>
            <Field label="Payout bank (masked)">
              <input
                className={inputClass}
                value={settings.payoutBankMasked}
                onChange={(e) => update({ payoutBankMasked: e.target.value })}
              />
            </Field>
          </div>
          <p className="mt-4 text-xs text-ash">
            Role: Owner · Merchant Portal access. Staff POS logins are separate.
          </p>
        </section>
      )}
      </EditGate>
    </div>
  )
}
