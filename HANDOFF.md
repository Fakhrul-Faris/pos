# Miki — developer handoff

UI prototypes for barbershop POS. **Client-side only** (no API / auth / DB yet). Refresh resets demo data.

## Run

1. Install **Node.js 20+**.
2. From the repo root:

```bash
npm install
```

3. Each app in its **own** terminal tab:

```bash
npm run dev:landing  # http://localhost:3000
npm run dev:portal   # http://localhost:3001
npm run dev:pos      # http://localhost:3002
npm run dev:order    # http://localhost:3003  customer book + queue
npm run dev:admin    # admin portal (optional)
```

Do **not** run `npm install` inside a single `apps/*` folder. Always install at the **repo root** (workspaces + `@miki/ui`).

### Build check (optional)

```bash
npm run build
```

## Git

```bash
git clone https://github.com/Fakhrul-Faris/pos.git
cd pos
npm install
```

## What to read

| Need | Document |
| :--- | :--- |
| This page | How to run |
| Engineering PRD (behaviour, HitPay, billing) | [`docs/requirements.md`](docs/requirements.md) |
| HitPay items still open | [`docs/open-hitpay.md`](docs/open-hitpay.md) |
| Screens (C / P / O) | [`docs/modules/barbershop/ui.md`](docs/modules/barbershop/ui.md) |
| Product rules (barbershop UX) | [`docs/modules/barbershop/spec.md`](docs/modules/barbershop/spec.md) |
| Schema dump | [`docs/db-schema.json`](docs/db-schema.json) |
| Doc map | [`docs/README.md`](docs/README.md) |

## Layout

```
package.json
apps/
  landing/            :3000
  merchant-portal/    :3001
  staff-pos/          :3002
  order-app/          :3003
  admin-portal/       optional
packages/ui/          shared tokens — required
docs/                 product + engineering SSOT
prototype/motion/     motion gallery only
```

## Demo phones (order-app)

| Phone | Behaviour |
| :--- | :--- |
| `01161209203` | Returning guest (loyalty), one editable booking today |
| `0123456789` | Two bookings today; one **IN_SERVICE** (no edit/cancel), one editable |

## Troubleshooting

| Issue | Fix |
| :--- | :--- |
| `Cannot find module '@miki/ui'` | `npm install` at the **root**, not inside one app |
| Port already in use | Stop the other process, or change the port in that app's `package.json` |
| Wrong Node version | `node -v` should be v20+ |
| `npm install` fails | Delete `node_modules` and retry |

`.agents/` and `.cursor/` are internal AI skills — ignore them when building the product.
