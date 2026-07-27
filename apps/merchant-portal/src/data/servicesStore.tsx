'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { serviceOptions as seedServices, type ServiceOption } from './mock'

export type ServiceInput = {
  label: string
  durationMinutes: number
  bufferMinutes: number
  price: number
  category: string
  active: boolean
}

type ServicesContextValue = {
  services: ServiceOption[]
  activeServices: ServiceOption[]
  getById: (id: string) => ServiceOption | undefined
  addService: (input: ServiceInput) => ServiceOption
  updateService: (id: string, input: Partial<ServiceInput>) => void
  toggleActive: (id: string) => void
}

const ServicesContext = createContext<ServicesContextValue | null>(null)

/** Snapshot for non-React callers (e.g. bookingsStore). */
let servicesSnapshot: ServiceOption[] = seedServices.map((s) => ({ ...s }))

export function getServicesSnapshot() {
  return servicesSnapshot
}

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<ServiceOption[]>(() =>
    seedServices.map((s) => ({ ...s })),
  )

  const sync = useCallback((next: ServiceOption[]) => {
    servicesSnapshot = next
    setServices(next)
  }, [])

  const getById = useCallback(
    (id: string) => services.find((s) => s.id === id),
    [services],
  )

  const addService = useCallback(
    (input: ServiceInput) => {
      const base = slugify(input.label) || 'service'
      let id = base
      let n = 2
      while (servicesSnapshot.some((s) => s.id === id)) {
        id = `${base}-${n++}`
      }
      const created: ServiceOption = { id, ...input }
      sync([...servicesSnapshot, created])
      return created
    },
    [sync],
  )

  const updateService = useCallback(
    (id: string, input: Partial<ServiceInput>) => {
      sync(
        servicesSnapshot.map((s) => (s.id === id ? { ...s, ...input } : s)),
      )
    },
    [sync],
  )

  const toggleActive = useCallback(
    (id: string) => {
      sync(
        servicesSnapshot.map((s) =>
          s.id === id ? { ...s, active: !s.active } : s,
        ),
      )
    },
    [sync],
  )

  const value = useMemo<ServicesContextValue>(
    () => ({
      services,
      activeServices: services.filter((s) => s.active),
      getById,
      addService,
      updateService,
      toggleActive,
    }),
    [services, getById, addService, updateService, toggleActive],
  )

  return (
    <ServicesContext.Provider value={value}>{children}</ServicesContext.Provider>
  )
}

export function useServices() {
  const ctx = useContext(ServicesContext)
  if (!ctx) throw new Error('useServices must be used within ServicesProvider')
  return ctx
}
