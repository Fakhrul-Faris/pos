# Miki Admin Portal

Internal ops console for founders (Super Admin). Mock frontend v1.

**SSOT:** requirements [`BRD`](../../docs/platform/Miki%20Admin%20Portal%20BRD.md) · flows [`user flow`](../../docs/platform/Miki%20admin%20portal%20user%20flow.md) · **IA (sole)** [`Designer IA Brief`](../../docs/platform/Miki%20Admin%20Portal%20%E2%80%94%20Designer%20IA%20Brief.md) · schema gaps [`Schema Gaps`](../../docs/platform/Miki%20Admin%20Portal%20%E2%80%94%20Schema%20Gaps.md)

**UI:** Dark-only [Geist](https://vercel.com/geist/introduction)-aligned shell (Geist Sans/Mono + `--ds-*` tokens). `@vercel/geistcn` is documented but not on public npm — local `Button` mirrors its API.

**Nav (IA):** Dashboard · Merchants · Subscriptions · Finance (Refunds / Transactions / Reconciliation) · Support · Accounting · Audit Log. Marketing deferred.

```bash
npm run dev:admin
```

Runs on http://localhost:3002
