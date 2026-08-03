# Miki apps - developer handoff

Prototype UIs for barbershop POS. Client-side only (no API / auth / DB yet).

## Apps

| App | Command | URL |
| --- | --- | --- |
| Landing | `npm run dev:landing` | http://localhost:3000 |
| Merchant portal | `npm run dev:portal` | http://localhost:3001 |
| Staff POS | `npm run dev:pos` | http://localhost:3002 |
| Order app (customer book + queue) | `npm run dev:order` | http://localhost:3003 |
| Admin portal (optional) | `npm run dev:admin` | see that app's console for port |

## Option A - from this zip

1. Install **Node.js 20+** ([nodejs.org](https://nodejs.org/) or `nvm install 20`).
2. Unzip this archive.
3. In Terminal:

```bash
cd miki-apps-handoff
npm install
```

4. Run each app in its **own** terminal tab (leave them running):

```bash
npm run dev:landing
npm run dev:portal
npm run dev:pos
npm run dev:order
```

5. Open the URLs in the table above.

### Build check (optional)

```bash
npm run build
```

## Option B - from GitHub (if you prefer git)

Repo: https://github.com/Fakhrul-Faris/pos.git

```bash
git clone https://github.com/Fakhrul-Faris/pos.git
cd pos
npm install
npm run dev:landing   # same commands as Option A
```

Pull latest later with `git pull`.

## Requirements

- **Node.js 20+** and npm (comes with Node)
- macOS / Windows / Linux
- Do **not** run `npm install` inside a single `apps/*` folder only. Always install at the **repo root** (workspaces + shared `@miki/ui`).

## Layout (what is in the zip)

```
package.json          # workspace scripts
package-lock.json
apps/
  landing/
  merchant-portal/
  staff-pos/
  order-app/
  admin-portal/       # included; optional to run
packages/
  ui/                 # shared design tokens - required
```

## Notes

- Prototypes use in-memory state; refresh resets demo data.
- Order-app demos: phone `01161209203` (loyalty + editable booking), `0123456789` (multi-match; one in-chair).
- More detail: `apps/README.md`

## Troubleshooting

| Issue | Fix |
| --- | --- |
| `Cannot find module '@miki/ui'` | Run `npm install` at the **root**, not inside one app |
| Port already in use | Stop the other process, or change the port in that app's `package.json` `dev` script |
| Wrong Node version | `node -v` should be v20+ |
| `npm install` fails | Delete `node_modules` and retry; check network / Node version |

Questions: send them back with the repo or this zip.
