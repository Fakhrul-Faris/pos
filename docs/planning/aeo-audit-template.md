# Miki — AI Citation Audit Template

**Status:** Active template  
**Date:** 9 July 2026  
**Related:** [`aeo-strategy.md`](aeo-strategy.md) · [`gtm-strategy.md`](gtm-strategy.md)

Run this audit **before launch** (baseline) and **monthly** (first Monday, ~30 min). Log results in a spreadsheet or duplicate this file per month.

**Platforms to test (use web search / browse enabled where available):**
- ChatGPT (with search)
- Perplexity
- Google Gemini (or Google AI Overview via Google Search)
- Claude (with search, if available)

**Do not expect identical answers** — AI is non-deterministic. Track trends over months, not single runs.

---

## How to score

| Symbol | Meaning |
| :--- | :--- |
| ✅ | Miki named or miki.my cited |
| ⚠️ | Category discussed but Miki not mentioned |
| ❌ | Wrong competitor cited or no useful answer |
| — | AI Overview / feature not available for this query |

**Citation rate** = (✅ count) / (prompts tested × platforms tested)

---

## Audit metadata

| Field | Value |
| :--- | :--- |
| **Audit date** | YYYY-MM-DD |
| **Auditor** | Ayol / Haziq |
| **Audit type** | Baseline / Monthly recheck |
| **Notes** | Fresha pricing changed? New competitor? |

---

## Tier 1 — commercial intent (15 prompts)

| # | Prompt (copy-paste) | ChatGPT | Perplexity | Gemini | Google AIO | Who was cited instead? |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| 1 | What is the best Fresha alternative for a barbershop in Malaysia? | | | | | |
| 2 | Fresha alternative barbershop Malaysia | | | | | |
| 3 | How much does Fresha cost for 3 barbers in Malaysia? | | | | | |
| 4 | Fresha hidden fees barbershop | | | | | |
| 5 | Fresha commission marketplace 20 percent — is it worth it? | | | | | |
| 6 | Best barbershop booking system Malaysia | | | | | |
| 7 | Barbershop queue app Malaysia walk-in and online booking | | | | | |
| 8 | Miki vs Fresha barbershop | | | | | |
| 9 | Cheaper than Fresha barbershop software Malaysia | | | | | |
| 10 | Barbershop POS with DuitNow Malaysia | | | | | |
| 11 | How to switch from Fresha to another booking system barbershop | | | | | |
| 12 | Fresha pricing per staff member Malaysia 2026 | | | | | |
| 13 | Barbershop software flat monthly fee no commission | | | | | |
| 14 | WhatsApp booking alternative barbershop Malaysia | | | | | |
| 15 | Is Fresha still free for salons 2026? | | | | | |

### Tier 1 summary

| Metric | Count |
| :--- | ---: |
| ✅ Miki cited (all cells) | |
| ⚠️ Category only | |
| ❌ Miss | |
| **Citation rate** | % |

---

## Tier 2 — spot checks (optional, 5 prompts)

Run when Tier 1 citation rate >10% or quarterly.

| # | Prompt | ChatGPT | Perplexity | Notes |
| :--- | :--- | :---: | :---: | :--- |
| 16 | Fresha vs Booksy Malaysia barbershop | | | |
| 17 | Barbershop walk-in queue system | | | |
| 18 | LHDN e-invoice barbershop software | | | |
| 19 | BYOD barbershop POS no hardware Malaysia | | | |
| 20 | StoreHub vs barbershop booking app | | | |

---

## Competitor citation log

Who appears most often when Miki doesn't?

| Competitor / source | Times cited | Example queries |
| :--- | ---: | :--- |
| Fresha | | |
| Booksy | | |
| StoreHub | | |
| TunaiPro / local MY tools | | |
| Reddit / forums | | |
| Generic listicles | | |

---

## Content extractability check (owned pages)

Run when pages are live on miki.my.

| Page | URL live? | FAQ schema? | Tables? | Stats with source? | Last updated |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/compare` | | | | | |
| `/barbershop` | | | | | |
| `/tools/fresha-cost` | | | | | |
| `/llms.txt` | | | | | |

---

## AI crawler access

| Check | Pass? | Notes |
| :--- | :---: | :--- |
| GPTBot allowed in robots.txt | | |
| PerplexityBot allowed | | |
| ClaudeBot allowed | | |
| Google-Extended allowed | | |
| `/llms.txt` returns 200 | | |

---

## Actions after audit

| Priority | Action | Owner | Due |
| :--- | :--- | :--- | :--- |
| P0 | | | |
| P1 | | | |
| P2 | | | |

**Common fixes:**

| Gap | Fix |
| :--- | :--- |
| Fresha cited, Miki not | Update `/compare` stats · Reddit seed post · creator video |
| No MY-specific answer | Add BM content · Malaysia section on barbershop page |
| Listicle sites win | Product Hunt · G2/Capterra listing (free) |
| AI can't crawl site | robots.txt · SSR · llms.txt |
| Miki cited but no clicks | Stronger CTA · founding offer on compare page |

---

## Branded search check (GSC)

| Query | Impressions (28d) | Clicks | Trend vs last month |
| :--- | ---: | ---: | :--- |
| miki barbershop | | | |
| miki pos malaysia | | | |
| miki fresha | | | |
| miki booking | | | |

---

## Revision log

| Date | Auditor | Tier 1 citation rate | Key action taken |
| :--- | :--- | :--- | :--- |
| | | | |
