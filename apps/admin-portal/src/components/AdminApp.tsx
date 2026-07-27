'use client'

import { useMemo, useState } from 'react'
import { Login } from './Login'
import { Shell } from './Shell'
import { Dashboard } from './screens/Dashboard'
import { Merchants } from './screens/Merchants'
import { MerchantDetail } from './screens/MerchantDetail'
import { Refunds } from './screens/Refunds'
import { Subscriptions } from './screens/Subscriptions'
import { Transactions } from './screens/Transactions'
import { Reconciliation } from './screens/Reconciliation'
import { Support } from './screens/Support'
import { Accounting } from './screens/Accounting'
import { AuditLog } from './screens/AuditLog'
import { useAdminStore } from '@/data/store'
import type { AdminScreen } from '@/data/types'

export function AdminApp() {
  const store = useAdminStore()
  const [screen, setScreen] = useState<AdminScreen>('dashboard')
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(
    null,
  )

  const queueCounts = useMemo(() => {
    const refunds = store.refunds.filter(
      (r) => r.status === 'pending_first' || r.status === 'pending_second',
    ).length
    const suspensions = store.merchants.filter(
      (m) => m.status === 'suspension_pending',
    ).length
    const flagged = store.transactions.filter((t) => t.status === 'flagged').length
    const dualApprovals = store.payoutOverrides.filter(
      (p) => p.status === 'pending_first' || p.status === 'pending_second',
    ).length
    const support = store.support.filter((s) => s.status !== 'resolved').length
    return { refunds, suspensions, flagged, dualApprovals, support }
  }, [
    store.refunds,
    store.merchants,
    store.transactions,
    store.payoutOverrides,
    store.support,
  ])

  const openMerchant = (id: string) => {
    setSelectedMerchantId(id)
    setScreen('merchant-detail')
  }

  const navigate = (next: AdminScreen) => {
    if (next !== 'merchant-detail') setSelectedMerchantId(null)
    setScreen(next)
  }

  if (!store.currentAdmin) {
    return <Login onLogin={store.login} />
  }

  return (
    <Shell
      admin={store.currentAdmin}
      activeScreen={screen}
      queueCounts={queueCounts}
      onNavigate={navigate}
      onSwitchAdmin={store.switchAdmin}
      onLogout={store.logout}
    >
      {screen === 'dashboard' && (
        <Dashboard
          queueCounts={queueCounts}
          onNavigate={navigate}
          onOpenMerchant={openMerchant}
        />
      )}
      {screen === 'merchants' && (
        <Merchants onOpenMerchant={openMerchant} />
      )}
      {screen === 'merchant-detail' && selectedMerchantId && (
        <MerchantDetail
          merchantId={selectedMerchantId}
          onBack={() => navigate('merchants')}
          onNavigate={navigate}
        />
      )}
      {screen === 'refunds' && <Refunds onOpenMerchant={openMerchant} />}
      {screen === 'subscriptions' && (
        <Subscriptions onOpenMerchant={openMerchant} />
      )}
      {screen === 'transactions' && (
        <Transactions onOpenMerchant={openMerchant} />
      )}
      {screen === 'reconciliation' && (
        <Reconciliation onOpenMerchant={openMerchant} />
      )}
      {screen === 'support' && <Support onOpenMerchant={openMerchant} />}
      {screen === 'accounting' && <Accounting />}
      {screen === 'audit' && <AuditLog onOpenMerchant={openMerchant} />}
    </Shell>
  )
}
