'use client'

import { BookingsProvider } from '@/data/bookingsStore'
import { ServicesProvider } from '@/data/servicesStore'
import { SettingsProvider } from '@/data/settingsStore'
import { InventoryProvider } from '@/data/inventoryStore'
import { RosterProvider } from '@/data/rosterStore'
import { LeaveProvider } from '@/data/leaveStore'
import { ReportsProvider } from '@/data/reportsStore'
import { PayrollProvider } from '@/data/payrollStore'
import { AccountingProvider } from '@/data/accountingStore'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ServicesProvider>
        <InventoryProvider>
          <RosterProvider>
            <LeaveProvider>
              <ReportsProvider>
                <PayrollProvider>
                  <AccountingProvider>
                    <BookingsProvider>{children}</BookingsProvider>
                  </AccountingProvider>
                </PayrollProvider>
              </ReportsProvider>
            </LeaveProvider>
          </RosterProvider>
        </InventoryProvider>
      </ServicesProvider>
    </SettingsProvider>
  )
}
