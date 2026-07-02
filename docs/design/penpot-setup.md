# Penpot MCP — Setup & Design Library

**Design tokens SSOT:** [`../platform/design-system/tokens.json`](../platform/design-system/tokens.json)  
**Website structure:** [`web-structure.md`](web-structure.md)

---

## 1. Cursor MCP configuration

Penpot MCP is configured in your **user-level** Cursor config (not committed to git):

**File:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "penpot": {
      "url": "https://design.penpot.app/mcp/stream?userToken=YOUR_PENPOT_MCP_KEY",
      "type": "http"
    }
  }
}
```

Copy your key from **Penpot → Your account → Integrations → MCP Server**.

Project template (no secrets): [`.cursor/mcp.json.example`](../../.cursor/mcp.json.example)

### After adding the server

1. **Restart Cursor** or reload MCP servers (Settings → MCP → refresh).
2. In Penpot, create or open a design file for the marketing site.
3. **File → MCP Server → Connect** (plugin must show Connected).
4. Keep the Penpot tab active — MCP operates on the **currently focused page**.

---

## 2. Recommended Penpot file structure

Create a Penpot file named **POS — Design System** (or similar):

```
📁 POS — Design System
├── 📄 Cover / README page
├── 📄 Tokens (reference swatches)
├── 📄 Marketing — Barbershop ← landing wireframe (16 sections)
├── 📄 Components
│   ├── Logo / Miki wordmark
│   ├── Buttons
│   ├── Cards
│   ├── Badges (Available / Coming soon)
│   └── Nav + promo banner
└── 📄 Marketing — Home (hub wireframe — TBD)
```

### Shared library

1. In Penpot: **Libraries → Create library** → name it `POS Core`.
2. Publish colors and typography from the Tokens page into the library.
3. Link the marketing file to `POS Core` for shared components.

---

## 3. Design token sets (Penpot Tokens tab)

Import or create these **token sets** to mirror `platform/design-system/tokens.json`:

| Set | Purpose |
| :--- | :--- |
| `primitive/color` | Raw palette — green-500, ink, surface, muted, border |
| `primitive/spacing` | 4px base scale (4–96) |
| `primitive/radius` | sm → full |
| `primitive/typography` | Font families, sizes, weights |
| `semantic/color` | background, text, border, interactive, badge |
| `semantic/typography` | display, heading, body composites |
| `component` | button, card, logo-dot, promo-banner |

### Theme

| Theme | Notes |
| :--- | :--- |
| `light` | Default — all tokens above |
| `dark` | Phase 2 — invert surface/ink if needed |

### Key color values (quick reference) — v2 Notion-influenced

| Token | Hex | Notes |
| :--- | :--- | :--- |
| `primitive/color/green/500` | `#38CE87` | Brand primary |
| `primitive/color/green/200` | `#E8F9F0` | Secondary button bg |
| `primitive/color/green/700` | `#1A7A4C` | Secondary button text |
| `primitive/color/neutral/surface` | `#F9F9F8` | Warm page bg (Notion gray-100) |
| `primitive/color/neutral/100` | `#F6F5F4` | Neutral surface |
| `primitive/color/neutral/ink` | `#1C1C1C` | Headlines |
| `primitive/color/neutral/border` | `#0000001A` | Alpha border (10%) |
| `primitive/color/alpha/text-muted` | `#0000008A` | Captions (54%) |

### Typography

| Role | Family |
| :--- | :--- |
| Headlines | Instrument Sans (Inter fallback) |
| Body | IBM Plex Sans (Inter fallback) |

**Type scale (Notion-influenced):** Display XL 76px · H2 32px bold · H3 22px bold · Body 16px · Card body 14px

Load fonts in Penpot via Google Fonts or upload WOFF2 if needed.

---

## 4. Sync tokens to Penpot (via MCP)

Once MCP is connected, ask the agent:

> Run the Penpot token sync script from `docs/design/penpot-sync-tokens.js` using execute_code. Upserts all v2 token sets from `docs/platform/design-system/tokens.json`.

Or paste this prompt after connecting:

```
Create a Penpot design token library for our POS marketing site:
- Token sets: primitive/color, primitive/spacing, semantic/color, component
- Colors: primary #38CE87, ink #1C1C1C, surface #FAFAFA, muted #6B6B6B, border #E8E8E8
- Typography: Instrument Sans (headlines), IBM Plex Sans (body)
- Also create local library colors and typography styles matching these tokens
```

Script reference: [`penpot-sync-tokens.js`](penpot-sync-tokens.js)

---

## 5. Library assets to create manually (or via MCP)

| Asset | Spec |
| :--- | :--- |
| **Green dot logo** | 12×12 circle, fill `#38CE87` |
| **Color / Primary** | `#38CE87` |
| **Color / Ink** | `#1C1C1C` |
| **Color / Surface** | `#FAFAFA` |
| **Color / Muted** | `#6B6B6B` |
| **Color / Border** | `#E8E8E8` |
| **Typography / Display** | Instrument Sans 60px semibold |
| **Typography / H1** | Instrument Sans 36px semibold |
| **Typography / Body** | IBM Plex Sans 16px regular |
| **Component / Button Primary** | bg `#38CE87`, text `#1C1C1C`, radius 8px, px 24 py 12 |
| **Component / Card** | bg white, border `#E8E8E8`, radius 12px |

---

## 6. Security

- **Never commit** your MCP key to git.
- If the key was shared in chat or a screenshot, **regenerate** it in Penpot Integrations.
- Disabling MCP in Penpot stops agents from editing files even if Cursor still has the config.

---

## 7. Troubleshooting

| Issue | Fix |
| :--- | :--- |
| `penpot` server not listed in Cursor | Restart Cursor; verify `~/.cursor/mcp.json` |
| Tools fail / timeout | Reconnect plugin: File → MCP Server → Connect |
| Wrong page edited | Focus the correct Penpot page/tab before prompting |
| Token API errors | Requires Penpot 2.14+ and connected MCP plugin |

**Docs:** [Penpot MCP Help](https://help.penpot.app/technical-guide/integration/mcp-server/)
