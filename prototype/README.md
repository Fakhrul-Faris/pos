# Miki Prototypes

Coded prototypes for design validation before production. **Next.js apps** in [`apps/`](../apps/) are the current home for all interactive UI; legacy Vite setups here remain for motion reference and archived POS/portal only.

## Active (Next.js)

| Prototype | App | Port | Docs |
| :--- | :--- | :--- | :--- |
| **Landing** (hub `/`) | [`apps/landing`](../apps/landing) | 3000 | [`apps/landing/README.md`](../apps/landing/README.md) |
| **Staff POS** (P-xx) | [`apps/staff-pos`](../apps/staff-pos) | 3002 | [`staff-pos/README.md`](staff-pos/README.md) |
| **Merchant portal** (O-xx) | [`apps/merchant-portal`](../apps/merchant-portal) | 3001 | [`merchant-portal/README.md`](merchant-portal/README.md) |

```bash
# From repo root
npm install
npm run dev:landing  # → :3000
npm run dev:pos      # → :3002
npm run dev:portal   # → :3001
```

See [`apps/README.md`](../apps/README.md) for monorepo structure.

## Legacy (Vite)

| Folder | Purpose | Run |
| :--- | :--- | :--- |
| [`motion/`](motion/) | Motion gallery — feel SSOT | `cd prototype/motion && npm run dev` → :5173 |
| [`staff-pos/`](staff-pos/) | Deprecated Vite POS | See README — use `apps/staff-pos` |
| [`merchant-portal/`](merchant-portal/) | Deprecated Vite portal | See README — use `apps/merchant-portal` |

**Removed:** `prototype/landing` — migrated to [`apps/landing`](../apps/landing).

## Design references

- **Theme specs:** [`docs/design/themes/`](../docs/design/themes/)
- **Motion clips:** [`docs/design/references/motion/`](../docs/design/references/motion/)
- **Screen specs:** [`docs/modules/barbershop/ui.md`](../docs/modules/barbershop/ui.md)
