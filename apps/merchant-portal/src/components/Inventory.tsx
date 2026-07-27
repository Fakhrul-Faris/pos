'use client'

import { useMemo, useState } from 'react'
import {
  useInventory,
  type InventoryProduct,
  type PurchaseOrder,
  type Vendor,
} from '../data/inventoryStore'
import { IconX } from './icons'
import { PageEditControls, usePageEditMode } from './PageEditControls'

type InvTab = 'products' | 'movements' | 'orders' | 'vendors'

const tabs: { id: InvTab; label: string }[] = [
  { id: 'products', label: 'Products' },
  { id: 'movements', label: 'Stock movements' },
  { id: 'orders', label: 'Purchase orders' },
  { id: 'vendors', label: 'Vendors' },
]

const inputClass =
  'w-full rounded-lg border border-fog bg-paper-white px-3 py-2 text-sm text-carbon focus:border-lavender focus:outline-none'

function formatRM(n: number) {
  return `RM ${n.toLocaleString('en-MY')}`
}

function ProductEditor({
  initial,
  vendors,
  onClose,
  onSave,
}: {
  initial: Omit<InventoryProduct, 'id'> & { id?: string }
  vendors: Vendor[]
  onClose: () => void
  onSave: (input: Omit<InventoryProduct, 'id'>) => void
}) {
  const [form, setForm] = useState(initial)
  const valid = form.name.trim() && form.sku.trim()

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-carbon/20">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-fog bg-paper-white shadow-xl">
        <header className="flex items-center justify-between border-b border-fog px-5 py-4">
          <h2 className="font-display text-base font-medium text-carbon">
            {initial.id ? 'Edit product' : 'Add product'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-ash hover:bg-linen">
            <IconX />
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {(
            [
              ['name', 'Name'],
              ['sku', 'SKU'],
              ['category', 'Category'],
              ['unit', 'Unit'],
              ['location', 'Location'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs font-medium text-ash">{label}</span>
              <input
                className={`${inputClass} mt-1`}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </label>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-ash">Unit price</span>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={form.unitPrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unitPrice: Number(e.target.value) || 0 }))
                }
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ash">Min stock</span>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={form.minStockLevel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minStockLevel: Number(e.target.value) || 0 }))
                }
              />
            </label>
          </div>
          {!initial.id && (
            <label className="block">
              <span className="text-xs font-medium text-ash">Opening stock</span>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={form.stockQuantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stockQuantity: Number(e.target.value) || 0 }))
                }
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-medium text-ash">Vendor</span>
            <select
              className={`${inputClass} mt-1`}
              value={form.vendorId ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, vendorId: e.target.value || null }))
              }
            >
              <option value="">-</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded border-fog"
            />
            <span className="text-sm text-carbon">Active</span>
          </label>
        </div>
        <footer className="flex gap-2 border-t border-fog px-5 py-4">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2.5">
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            className="btn-primary flex-1 py-2.5 disabled:opacity-40"
            onClick={() => {
              const { id: _id, ...rest } = form as InventoryProduct
              onSave(rest)
            }}
          >
            Save
          </button>
        </footer>
      </aside>
    </div>
  )
}

export function Inventory() {
  const {
    products,
    vendors,
    movements,
    purchaseOrders,
    addProduct,
    updateProduct,
    adjustStock,
    addVendor,
    receivePurchaseOrder,
    getVendor,
    getProduct,
    addPurchaseOrder,
  } = useInventory()

  const [tab, setTab] = useState<InvTab>('products')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<InventoryProduct | null>(null)
  const { editing: pageEditing, savedFlash, startEdit, save, cancel } = usePageEditMode()
  const [creating, setCreating] = useState(false)
  const [adjustId, setAdjustId] = useState<string | null>(null)
  const [adjustDelta, setAdjustDelta] = useState(1)
  const [adjustNotes, setAdjustNotes] = useState('Manual adjust')
  const [vendorDraft, setVendorDraft] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
  })
  const [poDraft, setPoDraft] = useState({
    vendorId: vendors[0]?.id ?? '',
    productId: products[0]?.id ?? '',
    quantity: 10,
    notes: '',
  })

  const lowStock = useMemo(
    () => products.filter((p) => p.active && p.stockQuantity <= p.minStockLevel),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
  }, [products, query])

  return (
    <div className="h-full w-full rounded-xl border border-fog px-4 py-4 sm:px-6 sm:py-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-ui text-sky">Catalogue</p>
          <h1 className="font-display mt-1 text-xl font-medium tracking-ui text-carbon">
            Inventory
          </h1>
          <p className="mt-1 text-sm text-ash">
            {products.length} products · {lowStock.length} low stock
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pageEditing && tab === 'products' && (
            <button type="button" className="btn-primary px-4 py-2" onClick={() => setCreating(true)}>
              Add product
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

      {lowStock.length > 0 && (
        <div className="mb-4 rounded-xl border border-fog bg-linen px-4 py-3 text-sm text-graphite">
          Low stock:{' '}
          {lowStock.map((p) => p.name).join(', ')}
        </div>
      )}

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

      {tab === 'products' && (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, category"
            className={`${inputClass} mb-4 max-w-sm`}
          />
          <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 font-medium">SKU</th>
                  <th className="px-4 py-2.5 font-medium">Stock</th>
                  <th className="px-4 py-2.5 font-medium">Location</th>
                  <th className="px-4 py-2.5 font-medium">Vendor</th>
                  <th className="px-4 py-2.5 text-right font-medium">Price</th>
                  <th className="px-4 py-2.5 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const low = p.stockQuantity <= p.minStockLevel
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-fog last:border-0 hover:bg-linen"
                    >
                      <td
                        onClick={() => pageEditing && setEditing(p)}
                        className={[
                          'px-4 py-3',
                          pageEditing ? 'cursor-pointer' : '',
                        ].join(' ')}
                      >
                        <span className="font-medium text-carbon">{p.name}</span>
                        <span className="mt-0.5 block text-xs text-ash">{p.category}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-graphite">{p.sku}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'tabular-nums font-medium',
                            low ? 'text-sky' : 'text-carbon',
                          ].join(' ')}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                        {low && (
                          <span className="mt-0.5 block text-[11px] text-ash">
                            Min {p.minStockLevel}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-graphite">{p.location}</td>
                      <td className="px-4 py-3 text-graphite">
                        {p.vendorId ? getVendor(p.vendorId)?.name ?? '-' : '-'}
                      </td>
                      <td className="tabular-nums px-4 py-3 text-right font-medium text-carbon">
                        {formatRM(p.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-medium text-sky hover:underline disabled:opacity-40"
                          disabled={!pageEditing}
                          onClick={() => {
                            if (!pageEditing) return
                            setAdjustId(p.id)
                            setAdjustDelta(1)
                          }}
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'movements' && (
        <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Qty</th>
                <th className="px-4 py-2.5 font-medium">Ref</th>
                <th className="px-4 py-2.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-fog last:border-0">
                  <td className="px-4 py-3 text-graphite">{m.date}</td>
                  <td className="px-4 py-3 font-medium text-carbon">
                    {getProduct(m.productId)?.name ?? m.productId}
                  </td>
                  <td className="px-4 py-3 capitalize text-graphite">{m.type}</td>
                  <td className="tabular-nums px-4 py-3 text-carbon">{m.quantity}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ash">{m.reference}</td>
                  <td className="px-4 py-3 text-graphite">{m.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">New purchase order</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <select
                className={inputClass}
                value={poDraft.vendorId}
                onChange={(e) => setPoDraft((d) => ({ ...d, vendorId: e.target.value }))}
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <select
                className={inputClass}
                value={poDraft.productId}
                onChange={(e) => setPoDraft((d) => ({ ...d, productId: e.target.value }))}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                className={inputClass}
                value={poDraft.quantity}
                onChange={(e) =>
                  setPoDraft((d) => ({ ...d, quantity: Number(e.target.value) || 1 }))
                }
              />
              <button
                type="button"
                className="btn-primary px-4 py-2"
                onClick={() => {
                  const product = getProduct(poDraft.productId)
                  if (!product || !poDraft.vendorId) return
                  addPurchaseOrder({
                    vendorId: poDraft.vendorId,
                    orderDate: new Date().toISOString().slice(0, 10),
                    status: 'ordered',
                    totalAmount: poDraft.quantity * product.unitPrice,
                    notes: poDraft.notes || 'Reorder',
                    lines: [
                      {
                        productId: product.id,
                        quantity: poDraft.quantity,
                        unitPrice: product.unitPrice,
                      },
                    ],
                  })
                }}
              >
                Create PO
              </button>
            </div>
          </section>

          <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                  <th className="px-4 py-2.5 font-medium">PO</th>
                  <th className="px-4 py-2.5 font-medium">Vendor</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po: PurchaseOrder) => (
                  <tr key={po.id} className="border-b border-fog last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-carbon">
                      {po.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-graphite">
                      {getVendor(po.vendorId)?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-graphite">{po.orderDate}</td>
                    <td className="px-4 py-3 capitalize text-graphite">{po.status}</td>
                    <td className="tabular-nums px-4 py-3 text-right font-medium text-carbon">
                      {formatRM(po.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {po.status === 'ordered' && (
                        <button
                          type="button"
                          onClick={() => pageEditing && receivePurchaseOrder(po.id)}
                          disabled={!pageEditing}
                          className="text-xs font-medium text-sky hover:underline disabled:opacity-40"
                        >
                          Mark received
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'vendors' && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-fog bg-paper-white p-5">
            <h2 className="font-display text-sm font-medium text-carbon">Add vendor</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ['name', 'Vendor name'],
                  ['contactPerson', 'Contact'],
                  ['phone', 'Phone'],
                  ['email', 'Email'],
                ] as const
              ).map(([key, label]) => (
                <input
                  key={key}
                  className={inputClass}
                  placeholder={label}
                  value={vendorDraft[key]}
                  onChange={(e) =>
                    setVendorDraft((d) => ({ ...d, [key]: e.target.value }))
                  }
                />
              ))}
            </div>
            <button
              type="button"
              className="btn-primary mt-3 px-4 py-2"
              disabled={!pageEditing || !vendorDraft.name.trim()}
              onClick={() => {
                if (!pageEditing) return
                addVendor(vendorDraft)
                setVendorDraft({ name: '', contactPerson: '', phone: '', email: '' })
              }}
            >
              Save vendor
            </button>
          </section>
          <div className="overflow-hidden rounded-2xl border border-fog bg-paper-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-fog bg-linen/50 text-xs text-ash">
                  <th className="px-4 py-2.5 font-medium">Vendor</th>
                  <th className="px-4 py-2.5 font-medium">Contact</th>
                  <th className="px-4 py-2.5 font-medium">Phone</th>
                  <th className="px-4 py-2.5 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} className="border-b border-fog last:border-0">
                    <td className="px-4 py-3 font-medium text-carbon">{v.name}</td>
                    <td className="px-4 py-3 text-graphite">{v.contactPerson || '-'}</td>
                    <td className="px-4 py-3 text-graphite">{v.phone || '-'}</td>
                    <td className="px-4 py-3 text-graphite">{v.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {creating && (
        <ProductEditor
          vendors={vendors}
          initial={{
            name: '',
            sku: '',
            category: 'Retail',
            unit: 'unit',
            unitPrice: 0,
            stockQuantity: 0,
            minStockLevel: 5,
            vendorId: vendors[0]?.id ?? null,
            location: 'Store room',
            active: true,
          }}
          onClose={() => setCreating(false)}
          onSave={(input) => {
            addProduct(input)
            setCreating(false)
          }}
        />
      )}

      {editing && (
        <ProductEditor
          vendors={vendors}
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(input) => {
            updateProduct(editing.id, input)
            setEditing(null)
          }}
        />
      )}

      {adjustId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-carbon/20 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-fog bg-paper-white p-5 shadow-xl">
            <h2 className="font-display text-base font-medium text-carbon">Adjust stock</h2>
            <p className="mt-1 text-sm text-ash">
              {getProduct(adjustId)?.name} · current{' '}
              {getProduct(adjustId)?.stockQuantity}
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-medium text-ash">Change (+/−)</span>
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value) || 0)}
              />
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-medium text-ash">Notes</span>
              <input
                className={`${inputClass} mt-1`}
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1 py-2"
                onClick={() => setAdjustId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 py-2"
                onClick={() => {
                  adjustStock(adjustId, adjustDelta, adjustNotes)
                  setAdjustId(null)
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
