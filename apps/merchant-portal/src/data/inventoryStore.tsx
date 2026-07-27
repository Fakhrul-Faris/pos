'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type InventoryProduct = {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  unitPrice: number
  stockQuantity: number
  minStockLevel: number
  vendorId: string | null
  location: string
  active: boolean
}

export type Vendor = {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
}

export type StockMovement = {
  id: string
  productId: string
  date: string
  type: 'in' | 'out' | 'adjust'
  quantity: number
  notes: string
  reference: string
}

export type PurchaseOrder = {
  id: string
  orderNumber: string
  vendorId: string
  orderDate: string
  status: 'draft' | 'ordered' | 'received' | 'cancelled'
  totalAmount: number
  notes: string
  lines: { productId: string; quantity: number; unitPrice: number }[]
}

type InventoryContextValue = {
  products: InventoryProduct[]
  vendors: Vendor[]
  movements: StockMovement[]
  purchaseOrders: PurchaseOrder[]
  addProduct: (input: Omit<InventoryProduct, 'id'>) => InventoryProduct
  updateProduct: (id: string, patch: Partial<InventoryProduct>) => void
  adjustStock: (productId: string, delta: number, notes: string) => void
  addVendor: (input: Omit<Vendor, 'id'>) => Vendor
  updateVendor: (id: string, patch: Partial<Vendor>) => void
  addPurchaseOrder: (input: Omit<PurchaseOrder, 'id' | 'orderNumber'>) => void
  receivePurchaseOrder: (id: string) => void
  getVendor: (id: string) => Vendor | undefined
  getProduct: (id: string) => InventoryProduct | undefined
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

const seedVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'HairPro Supply MY',
    contactPerson: 'Lim Wei',
    phone: '+60 12-888 2200',
    email: 'orders@hairpro.my',
  },
  {
    id: 'v2',
    name: 'CleanCut Distributors',
    contactPerson: 'Siti Nora',
    phone: '+60 16-441 0099',
    email: 'sales@cleancut.my',
  },
]

const seedProducts: InventoryProduct[] = [
  {
    id: 'p1',
    name: 'Pomade - strong hold',
    sku: 'POM-001',
    category: 'Retail',
    unit: 'jar',
    unitPrice: 38,
    stockQuantity: 24,
    minStockLevel: 8,
    vendorId: 'v1',
    location: 'Front shelf',
    active: true,
  },
  {
    id: 'p2',
    name: 'Shampoo refill 5L',
    sku: 'SHP-5L',
    category: 'Backbar',
    unit: 'bottle',
    unitPrice: 85,
    stockQuantity: 4,
    minStockLevel: 3,
    vendorId: 'v1',
    location: 'Store room',
    active: true,
  },
  {
    id: 'p3',
    name: 'Disposable neck strips',
    sku: 'NS-100',
    category: 'Consumable',
    unit: 'pack',
    unitPrice: 12,
    stockQuantity: 2,
    minStockLevel: 5,
    vendorId: 'v2',
    location: 'Store room',
    active: true,
  },
  {
    id: 'p4',
    name: 'Blade cartridges (100)',
    sku: 'BLD-100',
    category: 'Consumable',
    unit: 'box',
    unitPrice: 45,
    stockQuantity: 11,
    minStockLevel: 4,
    vendorId: 'v2',
    location: 'Counter',
    active: true,
  },
]

const seedMovements: StockMovement[] = [
  {
    id: 'm1',
    productId: 'p1',
    date: '2026-07-20',
    type: 'in',
    quantity: 12,
    notes: 'Restock',
    reference: 'PO-1042',
  },
  {
    id: 'm2',
    productId: 'p3',
    date: '2026-07-22',
    type: 'out',
    quantity: 3,
    notes: 'Weekly use',
    reference: 'USE-0722',
  },
]

const seedPOs: PurchaseOrder[] = [
  {
    id: 'po1',
    orderNumber: 'PO-1042',
    vendorId: 'v1',
    orderDate: '2026-07-18',
    status: 'received',
    totalAmount: 12 * 38,
    notes: 'Pomade restock',
    lines: [{ productId: 'p1', quantity: 12, unitPrice: 38 }],
  },
  {
    id: 'po2',
    orderNumber: 'PO-1048',
    vendorId: 'v2',
    orderDate: '2026-07-23',
    status: 'ordered',
    totalAmount: 10 * 12,
    notes: 'Neck strips low',
    lines: [{ productId: 'p3', quantity: 10, unitPrice: 12 }],
  },
]

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState(seedProducts)
  const [vendors, setVendors] = useState(seedVendors)
  const [movements, setMovements] = useState(seedMovements)
  const [purchaseOrders, setPurchaseOrders] = useState(seedPOs)

  const getVendor = useCallback(
    (id: string) => vendors.find((v) => v.id === id),
    [vendors],
  )
  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  )

  const addProduct = useCallback((input: Omit<InventoryProduct, 'id'>) => {
    const created: InventoryProduct = { ...input, id: uid('p') }
    setProducts((prev) => [...prev, created])
    return created
  }, [])

  const updateProduct = useCallback((id: string, patch: Partial<InventoryProduct>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])

  const adjustStock = useCallback((productId: string, delta: number, notes: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + delta) }
          : p,
      ),
    )
    const type: StockMovement['type'] =
      delta > 0 ? 'in' : delta < 0 ? 'out' : 'adjust'
    setMovements((prev) => [
      {
        id: uid('m'),
        productId,
        date: new Date().toISOString().slice(0, 10),
        type,
        quantity: Math.abs(delta),
        notes,
        reference: 'ADJ',
      },
      ...prev,
    ])
  }, [])

  const addVendor = useCallback((input: Omit<Vendor, 'id'>) => {
    const created: Vendor = { ...input, id: uid('v') }
    setVendors((prev) => [...prev, created])
    return created
  }, [])

  const updateVendor = useCallback((id: string, patch: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)))
  }, [])

  const addPurchaseOrder = useCallback(
    (input: Omit<PurchaseOrder, 'id' | 'orderNumber'>) => {
      const orderNumber = `PO-${1040 + purchaseOrders.length + 1}`
      setPurchaseOrders((prev) => [
        { ...input, id: uid('po'), orderNumber },
        ...prev,
      ])
    },
    [purchaseOrders.length],
  )

  const receivePurchaseOrder = useCallback((id: string) => {
    const po = purchaseOrders.find((p) => p.id === id)
    if (!po || po.status === 'received') return

    setProducts((productsPrev) =>
      productsPrev.map((product) => {
        const line = po.lines.find((l) => l.productId === product.id)
        if (!line) return product
        return {
          ...product,
          stockQuantity: product.stockQuantity + line.quantity,
        }
      }),
    )
    setMovements((movPrev) => [
      ...po.lines.map((line) => ({
        id: uid('m'),
        productId: line.productId,
        date: new Date().toISOString().slice(0, 10),
        type: 'in' as const,
        quantity: line.quantity,
        notes: 'PO received',
        reference: po.orderNumber,
      })),
      ...movPrev,
    ])
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'received' as const } : p)),
    )
  }, [purchaseOrders])

  const value = useMemo(
    () => ({
      products,
      vendors,
      movements,
      purchaseOrders,
      addProduct,
      updateProduct,
      adjustStock,
      addVendor,
      updateVendor,
      addPurchaseOrder,
      receivePurchaseOrder,
      getVendor,
      getProduct,
    }),
    [
      products,
      vendors,
      movements,
      purchaseOrders,
      addProduct,
      updateProduct,
      adjustStock,
      addVendor,
      updateVendor,
      addPurchaseOrder,
      receivePurchaseOrder,
      getVendor,
      getProduct,
    ],
  )

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  )
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider')
  return ctx
}
