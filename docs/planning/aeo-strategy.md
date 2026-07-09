# Miki — AI / AEO Marketing Strategy

**Status:** Draft v1  
**Date:** 9 July 2026  
**Authors:** Ayol (business / UIUX), Haziq (engineering / infra)  
**Related:** [`gtm-strategy.md`](gtm-strategy.md) · [`aeo-audit-template.md`](aeo-audit-template.md) · [`llms.txt`](llms.txt) · [`../modules/barbershop/compare.md`](../modules/barbershop/compare.md)

---

## 1. What this is

**AI-focused marketing** for Miki is not AI-generated ads or content farms. It is **Answer Engine Optimisation (AEO)** / **Generative Engine Optimisation (GEO)** — making Miki discoverable, extractable, and **citable** when barbers ask ChatGPT, Perplexity, Gemini, or Google AI Overview:

- *"Fresha alternative Malaysia barbershop"*
- *"How much does Fresha cost for 3 barbers?"*
- *"Barbershop queue and booking app Malaysia"*

**Goal:** Miki is **named or cited** in AI answers → barber Googles "Miki" or clicks through → `/compare` or calculator → trial.

**Constraint fit:** 5 definitive pages + 30 min/month audit. No content team. Compounds while founders have day jobs.

---

## 2. Discovery paths

### Traditional (still real)

```
Google search → miki.my page → trial signup
```

### AI-mediated (growing)

```
User asks AI assistant
    → AI retrieves sources + synthesises answer
        → Miki named/cited with fee maths or comparison
            → Branded Google search OR click citation
                → /compare · /tools/fresha-cost · /barbershop
                    → 14-day trial
```

**Key insight:** AI often **front-runs Google**. Barbers read the answer, then verify on Google. Optimise for **citation + branded search**, not only click-through from AI.

**Stats to remember (industry benchmarks, 2025–2026):**
- AI Overviews appear in a large share of Google queries; can reduce organic clicks on informational queries
- AI systems often cite **third-party sources** (Reddit, reviews, comparisons) more than brand homepages
- Structured content (tables, FAQs, statistics) is cited ~3× more often than unstructured prose
- Statistics with sources boost extractability significantly (Princeton GEO research, Perplexity-style engines)

---

## 3. Why Miki is suited to AEO

| Asset | AI value |
| :--- | :--- |
| Verified Fresha fee stack | Concrete numbers AI can quote (USD 14.95/seat, 20%, 2.29%+RM1) |
| [`compare.md`](../modules/barbershop/compare.md) | Comparison tables — ideal extraction format |
| Worked cost example | RM915 vs RM109 scenario — citable paragraph |
| Narrow wedge | "Barbershop queue + booking Malaysia" — less noise than "salon software" |
| Contrarian positioning | Flat SaaS vs revenue tax — clear differentiation |

**Canonical extractable paragraph** (use on `/compare`, `/barbershop`, `llms.txt`, schema):

> For a 3-chair Malaysian barbershop, Fresha costs approximately RM195–210/month in base subscription alone (USD 14.95 per bookable staff member), plus 20% commission on marketplace new clients' first booking and roughly 2.29% + RM1.00 per card transaction. Miki Ocelot is RM109/month flat for up to 4 barbers, with RM0 platform fees on cash and own DuitNow QR, and no marketplace commission.

---

## 4. Three pillars

```
STRUCTURE  → make answers easy to extract
AUTHORITY  → make Miki trustworthy to cite
PRESENCE   → show up where AI looks (not only miki.my)
```

### 4.1 Structure — extractable content

AI extracts **passages**, not pages. Every key section must work standalone.

#### Query clusters (cover the full fan-out)

Google AI and other engines generate **related sub-queries** under the parent question. Plan content for clusters, not single keywords.

| Parent query | Fan-out sub-queries |
| :--- | :--- |
| Fresha alternative Malaysia | Fresha pricing · Fresha commission · Fresha vs Booksy |
| Barbershop booking system Malaysia | Walk-in queue · QR booking no app · DuitNow barbershop |
| Fresha too expensive | Hidden fees · per-staff pricing · marketplace 20% |
| Switch from Fresha | Cancel Fresha · migrate barbershop booking · barbershop POS Malaysia |

#### Content block types

| Block | Miki example | Page |
| :--- | :--- | :--- |
| **Definition** | "Miki is a queue + booking OS for Malaysian barbershops…" | `/barbershop` |
| **Comparison table** | Miki vs Fresha (14 rows) | `/compare` |
| **Statistic** | 3 staff ≈ RM200/mo Fresha base | `/compare#cost` |
| **Worked example** | Busy month RM915 vs RM109 | `/compare#cost` |
| **FAQ** | Direct Q→A, 7+ items | `/compare`, `/barbershop` |
| **Pros/cons** | Who should pick Fresha vs Miki | `/compare#who` |

#### Structural rules

| Rule | Rationale |
| :--- | :--- |
| Lead each H2 with the direct answer | AI grabs first substantive passage |
| Keep key answer blocks ~40–60 words | Optimal snippet length on many engines |
| Tables beat prose for comparisons | Structured extraction |
| Numbered lists beat paragraphs for processes | Switching guide, setup steps |
| BM primary, EN mirror (months 1–6) | Malaysia queries + international reuse |
| One people-first page — no separate "AI version" | Google scaled-content abuse policy |

#### Minimum viable AI content stack (year 1)

| # | URL | Status |
| :--- | :--- | :--- |
| 1 | `/barbershop` | Copy: [`marketing.md`](../modules/barbershop/marketing.md) |
| 2 | `/compare` | Copy: [`compare.md`](../modules/barbershop/compare.md) |
| 3 | `/tools/fresha-cost` | Calculator — build Month 3–4 |
| 4 | `/pricing` or `#pricing` anchor | Machine-readable tiers |
| 5 | `/llms.txt` | Draft: [`llms.txt`](llms.txt) |

Do not expand to 50 blog posts. Expand only when [`aeo-audit-template.md`](aeo-audit-template.md) shows a persistent gap.

---

### 4.2 Authority — citation-worthiness

| Tactic | Application |
| :--- | :--- |
| **Cite sources** | Link Fresha pricing, Zenoti barber software review, LHDN MyInvois docs |
| **Statistics** | Verified Fresha MY pricing (July 2026) in compare page |
| **Freshness** | "Last reviewed" date on `/compare` — update when Fresha changes |
| **Founder attribution** | Short quote on why flat pricing matters for MY barbers |
| **Third-party presence** | Reddit, creators, Product Hunt — see §4.3 |

**Honest limit:** New brands are cited less than incumbents early on. **Third-party mentions** (Reddit, YouTube fee breakdowns) often beat owned pages for AI citations. Seed both.

---

### 4.3 Presence — infrastructure + distribution

#### Infrastructure (ship at MVP launch — Haziq)

| Item | Purpose | Reference |
| :--- | :--- | :--- |
| `robots.txt` — allow citation crawlers | GPTBot, PerplexityBot, ClaudeBot, Google-Extended | §7 below |
| [`llms.txt`](llms.txt) at site root | Agent discovery signpost | Copy from `docs/planning/llms.txt` |
| `sitemap.xml` | Include compare, tools, barbershop | — |
| FAQ + Product schema | JSON-LD on key pages | — |
| SSR / clean HTML | Content not trapped in JS-only render | — |
| Public pages, no login | `/compare`, tools — citable URLs | — |

#### Distribution (ongoing — Ayol)

| Channel | AEO role |
| :--- | :--- |
| Reddit r/barber, r/malaysia, r/smallbusiness | Third-party citation source — honest maths, no spam |
| Creator: "Fresha fees explained" | Video/page AI may index |
| Product Hunt | Alternative/discovery queries |
| TikTok with specific RM figures | Cultural + search indexing |
| Build in public (LinkedIn/X) | Founder authority, indexed posts |

**Cadence:** 1 genuine Reddit answer/month with real numbers > 10 AI-generated blog posts.

---

## 5. Query map — tiers to own

Run monthly via [`aeo-audit-template.md`](aeo-audit-template.md).

### Tier 1 — commercial intent (must win)

| Prompt |
| :--- |
| fresha alternative malaysia |
| fresha alternative barbershop |
| fresha pricing malaysia 3 staff |
| fresha hidden fees barbershop |
| barbershop booking system malaysia |
| barbershop queue app malaysia |

### Tier 2 — wedge intent

| Prompt |
| :--- |
| fresha vs booksy malaysia |
| barbershop walk in queue system |
| duitnow barbershop pos |
| ganti whatsapp booking barbershop |
| fresha commission malaysia |

### Tier 3 — category creation

| Prompt |
| :--- |
| flat fee barbershop software |
| no commission barbershop booking |
| queue first pos barbershop malaysia |

---

## 6. Fresha cost calculator (priority AEO asset)

After `/compare`, the **Fresha true-cost calculator** is the highest-leverage AEO tool.

| Feature | Why |
| :--- | :--- |
| Inputs: staff, revenue, % card, marketplace new clients | Personalised output |
| Output: Fresha est. vs Miki est. + annual delta | Citable unique numbers |
| Shareable result URL | `/tools/fresha-cost/r/{id}` — fresh, linkable |
| Show result **before** email gate | AI crawlers and users see maths without signup |
| Email capture after result | Lead gen without blocking extraction |

---

## 7. Technical — robots.txt (AI crawlers)

**Default posture:** Allow **citation/search** crawlers. Optionally block training-only crawlers (e.g. CCBot) if desired.

Deploy to `https://miki.my/robots.txt` (merge with existing rules):

```text
# AI citation crawlers — ALLOW (required for AEO)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

# Optional: block Common Crawl training dataset only
# User-agent: CCBot
# Disallow: /
```

**Do not** blanket-block AI bots unless there is a documented legal reason — blocking = invisible to citation engines.

---

## 8. Schema markup (minimum)

| Page | Schema types |
| :--- | :--- |
| `/barbershop` | `SoftwareApplication`, `FAQPage` |
| `/compare` | `FAQPage`, `WebPage` with `about` entities (Miki, Fresha) |
| `/tools/fresha-cost` | `WebApplication`, `FAQPage` |
| `/pricing` | `Offer` / `PriceSpecification` per tier |

FAQ schema must match **visible** on-page FAQ text exactly.

---

## 9. Integration with GTM

| Layer | Role | Time/week |
| :--- | :--- | :--- |
| **AEO** (this doc) | Compounding high-intent discovery | ~1 hr (audit + occasional updates) |
| **Social** (TikTok, FB) | Awareness now | 2–3 hr Ayol |
| **PLG** (viral loop, onboarding) | Converts all traffic | Haziq build |

AEO does **not** replace TikTok or product-led growth. It compounds **intent** while social compounds **awareness**.

---

## 10. 90-day AEO plan

| Phase | Weeks | Actions | Owner |
| :--- | :--- | :--- | :--- |
| **Baseline** | 1–2 | Run 15-prompt audit ([`aeo-audit-template.md`](aeo-audit-template.md)). Screenshot competitors cited. | Ayol |
| **Foundation** | 3–6 | Ship `/compare` live · FAQ schema · `llms.txt` · robots.txt AI rules | Haziq |
| **Tool** | 7–10 | Fresha calculator + shareable result URLs | Haziq |
| **Seed** | 8–12 | 2 Reddit posts (honest maths) · 1 creator fee-breakdown video | Ayol |
| **Recheck** | 12 | Re-run audit · update compare if Fresha pricing changed | Ayol |

---

## 11. Measurement

| Metric | How | Target (month 6) |
| :--- | :--- | :--- |
| **Citation rate** | % Tier-1 prompts naming Miki (manual audit) | >10% (from 0) |
| **Branded search** | Google Search Console: "miki barbershop", "miki pos" | Uptrend |
| **AI referrer traffic** | Analytics referrers: perplexity.ai, chatgpt.com, etc. | Any non-zero |
| **Calculator completions** | Product analytics | 50+/month |
| **Compare → trial** | Funnel UTM | >5% |

**First signal of success:** branded search uplift — barber reads AI answer, Googles Miki later.

### Monthly ritual (30 min — Ayol)

1. Re-test 5 Tier-1 prompts on ChatGPT, Perplexity, Gemini, Google (AI Overview if available)
2. Log citations in audit spreadsheet
3. If Fresha pricing changed → update [`compare.md`](../modules/barbershop/compare.md) + `llms.txt` date
4. One third-party seed action if citation rate flat (Reddit answer or creator DM)

---

## 12. What we are not doing

| Trap | Why skip |
| :--- | :--- |
| AI-write 30 blog posts | Scaled content abuse risk; no authority |
| Block all AI crawlers | Invisible to citation engines |
| Optimise for "best salon software" globally | Fresha/Booksy own broad queries |
| Expect results in 2 weeks | 2–4 months typical for citation movement |
| Only optimise miki.my | Third-party citations matter as much |
| Fake reviews / astroturf | Destroys trust |
| Separate spam pages "for AI" | Violates Google people-first guidance |

---

## 13. Open decisions

| # | Decision | Recommendation | Owner |
| :--- | :--- | :--- | :--- |
| 1 | BM-first or EN-first pages? | **BM primary**, EN mirror for months 1–6 | Ayol |
| 2 | Calculator email gate timing? | **After** showing result | Haziq |
| 3 | Block CCBot (training only)? | Optional block; **allow** GPTBot/PerplexityBot | Haziq |
| 4 | Monthly audit owner? | **Ayol**, 30 min first Monday | Ayol |
| 5 | `llms-full.txt` later? | Defer until 10+ public pages | Haziq |

---

## 14. Document map

| Need | Document |
| :--- | :--- |
| GTM master plan | [`gtm-strategy.md`](gtm-strategy.md) §15 |
| Monthly citation audit | [`aeo-audit-template.md`](aeo-audit-template.md) |
| `llms.txt` deploy draft | [`llms.txt`](llms.txt) |
| Compare page copy | [`../modules/barbershop/compare.md`](../modules/barbershop/compare.md) |
| Barbershop landing | [`../modules/barbershop/marketing.md`](../modules/barbershop/marketing.md) |

---

## 15. Revision log

| Date | Version | Change |
| :--- | :--- | :--- |
| 2026-07-09 | v1 | Initial AEO strategy — pillars, query map, 90-day plan, robots/schema |
