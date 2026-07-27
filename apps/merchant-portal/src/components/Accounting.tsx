'use client'

import { useMemo, useState } from 'react'
import { calendarToday } from '../data/mock'
import {
  useAccounting,
  type AccountType,
  type GlAccount,
  type JournalEntry,
  type JournalStatus,
  type NormalBalance,
} from '../data/accountingStore'
import { EditGate, PageEditControls, usePageEditMode } from './PageEditControls'

type AccTab = 'overview' | 'journals' | 'accounts' | 'trial'

const tabs: { id: AccTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'journals', label: 'Journals' },
  { id: 'accounts', label: 'Chart of accounts' },
  { id: 'trial', label: 'Trial balance' },
]

const inputClass =
  'w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none'

const typeLabel: Record<AccountType, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
}

const statusTone: Record<JournalStatus, string> = {
  draft: 'bg-mist text-graphite',
  posted: 'bg-mint-wash text-mint',
  void: 'bg-linen text-ash',
}

function formatMoney(n: number) {
  return `RM ${n.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

type DraftLine = {
  accountId: string
  description: string
  debit: string
  credit: string
}

export function Accounting() {
  const {
    accounts,
    journals,
    addAccount,
    toggleAccount,
    addJournal,
    postJournal,
    voidJournal,
    accountBalances,
  } = useAccounting()

  const [tab, setTab] = useState<AccTab>('overview')
  const [selectedId, setSelectedId] = useState<string | null>(
    journals[0]?.id ?? null,
  )
  const [showNewJournal, setShowNewJournal] = useState(false)
  const [journalDraft, setJournalDraft] = useState({
    date: calendarToday,
    description: '',
    reference: '',
    lines: [
      {
        accountId: 'a-5200',
        description: '',
        debit: '',
        credit: '',
      },
      {
        accountId: 'a-1100',
        description: '',
        debit: '',
        credit: '',
      },
    ] as DraftLine[],
  })
  const [accountDraft, setAccountDraft] = useState({
    code: '',
    name: '',
    type: 'expense' as AccountType,
    normalBalance: 'debit' as NormalBalance,
    description: '',
  })
  const [journalError, setJournalError] = useState('')
  const { editing: pageEditing, savedFlash, startEdit, save, cancel } = usePageEditMode()

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.active).sort((a, b) => a.code.localeCompare(b.code)),
    [accounts],
  )

  const balances = useMemo(() => accountBalances(), [accountBalances])

  const balanceMap = useMemo(() => {
    const m = new Map(balances.map((b) => [b.accountId, b]))
    return m
  }, [balances])

  const selected = journals.find((j) => j.id === selectedId) ?? null

  const overview = useMemo(() => {
    const byType = (t: AccountType) =>
      accounts
        .filter((a) => a.type === t)
        .reduce((s, a) => s + (balanceMap.get(a.id)?.balance ?? 0), 0)
    return {
      assets: byType('asset'),
      liabilities: byType('liability'),
      equity: byType('equity'),
      revenue: byType('revenue'),
      expense: byType('expense'),
      drafts: journals.filter((j) => j.status === 'draft').length,
      posted: journals.filter((j) => j.status === 'posted').length,
    }
  }, [accounts, balanceMap, journals])

  const trialRows = useMemo(() => {
    return accounts
      .slice()
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((a) => {
        const b = balanceMap.get(a.id)
        return {
          account: a,
          debit: b?.debit ?? 0,
          credit: b?.credit ?? 0,
          balance: b?.balance ?? 0,
        }
      })
      .filter((r) => r.debit !== 0 || r.credit !== 0 || r.account.active)
  }, [accounts, balanceMap])

  const trialTotals = useMemo(
    () => ({
      debit: trialRows.reduce((s, r) => s + r.debit, 0),
      credit: trialRows.reduce((s, r) => s + r.credit, 0),
    }),
    [trialRows],
  )

  function accountLabel(id: string) {
    const a = accounts.find((x) => x.id === id)
    return a ? `${a.code} · ${a.name}` : id
  }

  function submitJournal() {
    setJournalError('')
    const lines = journalDraft.lines
      .map((l) => ({
        accountId: l.accountId,
        description: l.description.trim(),
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
      }))
      .filter((l) => l.debit > 0 || l.credit > 0)

    const id = addJournal({
      date: journalDraft.date,
      description: journalDraft.description.trim() || 'Manual entry',
      reference: journalDraft.reference.trim(),
      lines,
    })
    if (!id) {
      setJournalError('Entry must balance (debits = credits) with at least 2 lines.')
      return
    }
    setShowNewJournal(false)
    setSelectedId(id)
    setTab('journals')
    setJournalDraft({
      date: calendarToday,
      description: '',
      reference: '',
      lines: [
        { accountId: activeAccounts[0]?.id ?? '', description: '', debit: '', credit: '' },
        { accountId: activeAccounts[1]?.id ?? '', description: '', debit: '', credit: '' },
      ],
    })
  }

  function submitAccount() {
    if (!accountDraft.code.trim() || !accountDraft.name.trim()) return
    addAccount({
      code: accountDraft.code.trim(),
      name: accountDraft.name.trim(),
      type: accountDraft.type,
      normalBalance: accountDraft.normalBalance,
      description: accountDraft.description.trim(),
    })
    setAccountDraft({
      code: '',
      name: '',
      type: 'expense',
      normalBalance: 'debit',
      description: '',
    })
  }

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Money</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Accounting
          </h1>
          <p className="mt-1 text-sm text-ash">
            Merchant books only · not platform / Admin GL
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pageEditing && tab === 'journals' && (
            <button
              type="button"
              className="btn-primary px-4 py-2"
              onClick={() => setShowNewJournal(true)}
            >
              New journal
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
        This is the shop’s general ledger. Miki subscription billing stays in
        Settings → Billing; payment txs stay in Payments; KPIs stay in Reports.
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
      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ['Assets', overview.assets],
                ['Liabilities', overview.liabilities],
                ['Equity', overview.equity],
                ['Revenue', overview.revenue],
                ['Expenses', overview.expense],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-fog bg-paper-white px-4 py-3"
              >
                <p className="text-xs text-ash">{label}</p>
                <p className="font-display tabular-nums mt-1 text-lg font-medium text-carbon">
                  {formatMoney(value)}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-fog p-4">
              <h2 className="font-display text-sm font-medium text-carbon">
                Journal activity
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ash">Posted</dt>
                  <dd className="font-medium text-carbon">{overview.posted}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ash">Drafts</dt>
                  <dd className="text-graphite">{overview.drafts}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-fog p-4">
              <h2 className="font-display text-sm font-medium text-carbon">
                Quick check
              </h2>
              <p className="mt-2 text-sm text-graphite">
                Assets {formatMoney(overview.assets)} vs liabilities + equity{' '}
                {formatMoney(overview.liabilities + overview.equity)}
              </p>
              <p className="mt-1 text-xs text-ash">
                Prototype balances use posted journals only (simplified).
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'journals' && (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="overflow-x-auto rounded-xl border border-fog">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Debit</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {journals.map((j) => {
                  const debit = j.lines.reduce((s, l) => s + l.debit, 0)
                  return (
                    <tr
                      key={j.id}
                      className={[
                        'cursor-pointer border-t border-fog',
                        selected?.id === j.id ? 'bg-mist/40' : 'hover:bg-linen/50',
                      ].join(' ')}
                      onClick={() => setSelectedId(j.id)}
                    >
                      <td className="px-4 py-3 text-xs text-ash">{j.number}</td>
                      <td className="px-4 py-3 text-graphite">{j.date}</td>
                      <td className="px-4 py-3 font-medium text-carbon">
                        {j.description}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-graphite">
                        {formatMoney(debit)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize',
                            statusTone[j.status],
                          ].join(' ')}
                        >
                          {j.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {selected ? (
            <JournalDetail
              entry={selected}
              accountLabel={accountLabel}
              onPost={() => postJournal(selected.id)}
              onVoid={() => voidJournal(selected.id)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-fog p-6 text-sm text-ash">
              Select a journal
            </div>
          )}
        </div>
      )}

      {tab === 'accounts' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="overflow-x-auto rounded-xl border border-fog">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {accounts
                  .slice()
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map((a) => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      balance={balanceMap.get(a.id)?.balance ?? 0}
                      onToggle={() => toggleAccount(a.id)}
                    />
                  ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-fog p-4">
            <h2 className="font-display text-sm font-medium text-carbon">
              Add account
            </h2>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-ash">Code</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={accountDraft.code}
                  onChange={(e) =>
                    setAccountDraft((d) => ({ ...d, code: e.target.value }))
                  }
                  placeholder="5400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Name</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={accountDraft.name}
                  onChange={(e) =>
                    setAccountDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Type</span>
                <select
                  className={`${inputClass} mt-1`}
                  value={accountDraft.type}
                  onChange={(e) => {
                    const type = e.target.value as AccountType
                    setAccountDraft((d) => ({
                      ...d,
                      type,
                      normalBalance:
                        type === 'asset' || type === 'expense' ? 'debit' : 'credit',
                    }))
                  }}
                >
                  {(Object.keys(typeLabel) as AccountType[]).map((t) => (
                    <option key={t} value={t}>
                      {typeLabel[t]}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn-primary w-full px-4 py-2"
                onClick={submitAccount}
                disabled={!accountDraft.code.trim() || !accountDraft.name.trim()}
              >
                Add account
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'trial' && (
        <div className="overflow-x-auto rounded-xl border border-fog">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-fog bg-linen/60 text-xs uppercase tracking-wide text-ash">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 text-right font-medium">Debit</th>
                <th className="px-4 py-3 text-right font-medium">Credit</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {trialRows.map((r) => (
                <tr key={r.account.id} className="border-t border-fog">
                  <td className="px-4 py-2.5 tabular-nums text-ash">
                    {r.account.code}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-carbon">
                    {r.account.name}
                  </td>
                  <td className="px-4 py-2.5 text-graphite">
                    {typeLabel[r.account.type]}
                  </td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-graphite">
                    {r.debit ? formatMoney(r.debit) : '-'}
                  </td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-graphite">
                    {r.credit ? formatMoney(r.credit) : '-'}
                  </td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-medium text-carbon">
                    {formatMoney(r.balance)}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-fog bg-linen/40">
                <td className="px-4 py-3 font-medium text-carbon" colSpan={3}>
                  Totals (posted)
                </td>
                <td className="tabular-nums px-4 py-3 text-right font-medium text-carbon">
                  {formatMoney(trialTotals.debit)}
                </td>
                <td className="tabular-nums px-4 py-3 text-right font-medium text-carbon">
                  {formatMoney(trialTotals.credit)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showNewJournal && (
        <div className="fixed inset-0 z-40 flex justify-end bg-carbon/20">
          <button
            type="button"
            className="flex-1"
            aria-label="Close"
            onClick={() => setShowNewJournal(false)}
          />
          <aside className="flex h-full w-full max-w-lg flex-col border-l border-fog bg-paper-white shadow-xl">
            <header className="border-b border-fog px-5 py-4">
              <h2 className="font-display text-base font-medium text-carbon">
                New journal entry
              </h2>
              <p className="mt-1 text-xs text-ash">Debits must equal credits</p>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
              <label className="block">
                <span className="text-xs font-medium text-ash">Date</span>
                <input
                  type="date"
                  className={`${inputClass} mt-1`}
                  value={journalDraft.date}
                  onChange={(e) =>
                    setJournalDraft((d) => ({ ...d, date: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Description</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={journalDraft.description}
                  onChange={(e) =>
                    setJournalDraft((d) => ({
                      ...d,
                      description: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-ash">Reference</span>
                <input
                  className={`${inputClass} mt-1`}
                  value={journalDraft.reference}
                  onChange={(e) =>
                    setJournalDraft((d) => ({
                      ...d,
                      reference: e.target.value,
                    }))
                  }
                />
              </label>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-ash">
                    Lines
                  </p>
                  <button
                    type="button"
                    className="text-xs font-medium text-sky hover:underline"
                    onClick={() =>
                      setJournalDraft((d) => ({
                        ...d,
                        lines: [
                          ...d.lines,
                          {
                            accountId: activeAccounts[0]?.id ?? '',
                            description: '',
                            debit: '',
                            credit: '',
                          },
                        ],
                      }))
                    }
                  >
                    Add line
                  </button>
                </div>
                {journalDraft.lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 rounded-lg border border-fog p-3"
                  >
                    <select
                      className={inputClass}
                      value={line.accountId}
                      onChange={(e) =>
                        setJournalDraft((d) => {
                          const lines = [...d.lines]
                          lines[idx] = { ...lines[idx], accountId: e.target.value }
                          return { ...d, lines }
                        })
                      }
                    >
                      {activeAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} · {a.name}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Debit"
                        className={inputClass}
                        value={line.debit}
                        onChange={(e) =>
                          setJournalDraft((d) => {
                            const lines = [...d.lines]
                            lines[idx] = {
                              ...lines[idx],
                              debit: e.target.value,
                              credit: e.target.value ? '' : lines[idx].credit,
                            }
                            return { ...d, lines }
                          })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Credit"
                        className={inputClass}
                        value={line.credit}
                        onChange={(e) =>
                          setJournalDraft((d) => {
                            const lines = [...d.lines]
                            lines[idx] = {
                              ...lines[idx],
                              credit: e.target.value,
                              debit: e.target.value ? '' : lines[idx].debit,
                            }
                            return { ...d, lines }
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              {journalError && (
                <p className="text-xs text-ember">{journalError}</p>
              )}
            </div>
            <footer className="flex gap-2 border-t border-fog px-5 py-4">
              <button
                type="button"
                className="flex-1 rounded-lg border border-fog px-4 py-2 text-sm text-graphite hover:bg-linen"
                onClick={() => setShowNewJournal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 px-4 py-2"
                onClick={submitJournal}
              >
                Save draft
              </button>
            </footer>
          </aside>
        </div>
      )}
      </EditGate>
    </div>
  )
}

function AccountRow({
  account,
  balance,
  onToggle,
}: {
  account: GlAccount
  balance: number
  onToggle: () => void
}) {
  return (
    <tr className="border-t border-fog">
      <td className="px-4 py-3 tabular-nums text-ash">{account.code}</td>
      <td className="px-4 py-3 font-medium text-carbon">{account.name}</td>
      <td className="px-4 py-3 text-graphite">{typeLabel[account.type]}</td>
      <td className="tabular-nums px-4 py-3 text-carbon">
        {formatMoney(balance)}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className={[
            'rounded-lg px-2.5 py-1 text-xs font-medium',
            account.active ? 'bg-mint-wash text-mint' : 'bg-linen text-ash',
          ].join(' ')}
        >
          {account.active ? 'On' : 'Off'}
        </button>
      </td>
    </tr>
  )
}

function JournalDetail({
  entry,
  accountLabel,
  onPost,
  onVoid,
}: {
  entry: JournalEntry
  accountLabel: (id: string) => string
  onPost: () => void
  onVoid: () => void
}) {
  const debit = entry.lines.reduce((s, l) => s + l.debit, 0)
  const credit = entry.lines.reduce((s, l) => s + l.credit, 0)

  return (
    <aside className="rounded-xl border border-fog p-4">
      <p className="text-xs text-ash">{entry.number}</p>
      <h2 className="font-display mt-1 text-base font-medium text-carbon">
        {entry.description}
      </h2>
      <p className="mt-1 text-xs text-ash">
        {entry.date}
        {entry.reference ? ` · ${entry.reference}` : ''}
      </p>

      <ul className="mt-4 space-y-2 border-t border-fog pt-3 text-xs">
        {entry.lines.map((l) => (
          <li key={l.id} className="flex justify-between gap-2">
            <span className="text-graphite">{accountLabel(l.accountId)}</span>
            <span className="tabular-nums shrink-0 text-carbon">
              {l.debit > 0 ? `Dr ${formatMoney(l.debit)}` : `Cr ${formatMoney(l.credit)}`}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-between border-t border-fog pt-2 text-sm">
        <span className="text-ash">Totals</span>
        <span className="tabular-nums text-carbon">
          {formatMoney(debit)} / {formatMoney(credit)}
        </span>
      </div>

      {entry.status === 'draft' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={onPost}>
            Post
          </button>
          <button
            type="button"
            className="rounded-lg border border-fog px-3 py-1.5 text-xs text-ash hover:bg-linen"
            onClick={onVoid}
          >
            Void
          </button>
        </div>
      )}
    </aside>
  )
}
