# Miki Prototypes

Coded prototypes for design validation. **All product UI lives in [`apps/`](../apps/).** This folder only keeps the **motion gallery**.

## Product UI (Next.js)

| App | Port | Docs |
| :--- | :--- | :--- |
| Landing | 3000 | [`apps/landing`](../apps/landing) |
| Merchant portal | 3001 | [`apps/merchant-portal`](../apps/merchant-portal) |
| Staff POS | 3002 | [`apps/staff-pos`](../apps/staff-pos) |
| Order app (customer) | 3003 | [`apps/order-app`](../apps/order-app) |

```bash
# From repo root
npm install
npm run dev:landing
npm run dev:pos
npm run dev:portal
npm run dev:order
```

## Motion gallery (Vite)

| Folder | Purpose | Run |
| :--- | :--- | :--- |
| [`motion/`](motion/) | Motion / feel reference | `cd prototype/motion && npm install && npm run dev` → :5173 |

See [`docs/design/motion-prototype.md`](../docs/design/motion-prototype.md).
