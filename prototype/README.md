# Miki Prototypes

Coded prototypes for design validation before production. **Next.js apps** in [`apps/`](../apps/) are the current home for merchant portal and staff POS; legacy Vite setups here remain for reference.

## Active (Next.js)

| Prototype | App | Port | Docs |
| :--- | :--- | :--- | :--- |
| **Staff POS** (P-xx) | [`apps/staff-pos`](../apps/staff-pos) | 3002 | [`staff-pos/README.md`](staff-pos/README.md) |
| **Merchant portal** (O-xx) | [`apps/merchant-portal`](../apps/merchant-portal) | 3001 | [`merchant-portal/README.md`](merchant-portal/README.md) |

```bash
# From repo root
npm install
npm run dev:pos      # → :3002
npm run dev:portal   # → :3001
```

See [`apps/README.md`](../apps/README.md) for monorepo structure.

## Legacy (Vite)

| Folder | Purpose | Run |
| :--- | :--- | :--- |
| [`motion/`](motion/) | Motion gallery — feel SSOT | `cd prototype/motion && npm run dev` → :5173 |
| [`landing/`](landing/) | Hub homepage editorial | `cd prototype/landing && npm run dev` → :5173 |
| [`staff-pos/`](staff-pos/) | Deprecated Vite POS | See README — use `apps/staff-pos` |
| [`merchant-portal/`](merchant-portal/) | Deprecated Vite portal | See README — use `apps/merchant-portal` |

## Design references

- **Theme specs:** [`docs/design/themes/`](../docs/design/themes/)
- **Motion clips:** [`docs/design/references/motion/`](../docs/design/references/motion/)
- **Screen specs:** [`docs/modules/barbershop/ui.md`](../docs/modules/barbershop/ui.md)
