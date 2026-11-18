# Tech Intelligence

A technology research and product-comparison website for Indian buyers. Visitors read tech news, browse six product categories, see scores and price history, and compare up to five devices side by side. Everything is managed from an admin dashboard, so routine updates need no code.

> **Sample data:** every brand, product, price, score and article in `data/` is fictional and exists only to demonstrate the site. Replace it before launch (see the [launch checklist](#before-launch)).

- Requirements: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md), condensed from the business plan PDF
- How it was built: [docs/PIPELINE.md](docs/PIPELINE.md)

---

## Quick start

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The admin is at http://localhost:3000/admin. The password is `admin` unless you set `ADMIN_PASSWORD`.

For a production run:

```bash
cp .env.example .env.local   # optional: set ADMIN_PASSWORD; always set ADMIN_SECRET
npm run build
npm start
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build. Prerenders every page |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run validate:data` | Checks every JSON file in `data/` against the category templates. Run it after editing JSON by hand |
| `npm run screenshots -- <name>` | After `npm run build`: starts the site, checks every route and the key interactions, and saves desktop/mobile/dark screenshots to `screenshots/<name>/` with a `report.json`. Data the tests touch is restored afterwards |

## What's on the site

| Page | Route |
|---|---|
| Homepage: launches, price drops, featured stories, categories, trending comparisons, guides, latest reviews | `/` |
| Category listings with dynamic filters, sort, tiers and search, all kept in the URL | `/category`, `/category/[slug]` |
| Product research page: score breakdown, price history, specs, benchmarks, reviews, where to buy, alternatives, sources | `/product/[slug]` |
| Comparison of 2–5 products, with "best for" verdicts, highlighted differences and an overlaid price chart | `/compare?ids=a,b,c` |
| Price drops | `/deals` |
| News and buying guides | `/news`, `/guides` |
| Search | `/search?q=` (also ⌘K / Ctrl+K anywhere) |
| Methodology, about, disclosure, privacy, terms, contact | `/methodology` … `/contact` |
| Admin dashboard | `/admin` |

## Project structure

```
data/                     JSON "database": products, news, guides, comparisons, settings, subscribers, messages
docs/                     requirements + development pipeline
scripts/                  validate-data.ts, screenshots.mjs
src/
  app/                    routes (App Router)
    admin/(panel)/        admin pages (sidebar shell); admin/login is outside the shell
  components/
    ui/                   design-system building blocks (Button, Badge, ScoreRing, Price, Reveal, Toast, AdSlot…)
    layout/               header, footer, command palette, theme toggle, sample-data banner
    device-art.tsx        generated SVG device artwork (used when a product has no photo)
    product-card.tsx      the product card used everywhere
    compare/              compare selection store, card toggle, floating tray
    charts/               price-history chart
    home/ catalog/ product/ compare-page/ editorial/ admin/   page-specific components
  lib/
    types.ts              the data contract, the place to start reading
    categories.ts         per-category specs, filters, score weights and buyer "needs"
    product-utils.ts      score, price, trend and formatting helpers
    data.ts               cached reads for pages
    store.ts              the only file that touches the filesystem
    admin/                auth, validation, server actions, dashboard helpers
  proxy.ts                redirects signed-out visitors away from /admin
```

## How data works

- **Reading:** pages call the functions in `src/lib/data.ts`. Each one is a `'use cache'` function tagged `catalog`, so pages are prerendered and fast.
- **Writing:** the admin's server actions (`src/lib/admin/actions.ts`) validate input, write JSON through `src/lib/store.ts`, then call `updateTag("catalog")`. The next visit to any page shows the change. No rebuild is needed.
- **Moving to a database later:** re-implement the three functions in `store.ts` (`readCollection`, `writeCollection`, `updateCollection`). Nothing else changes.

> Next.js 16 with Cache Components behaves differently from older versions. Read `node_modules/next/dist/docs/` before changing data loading. Two rules matter most here:
> 1. On dynamic routes, keep anything that reads `params` inside `<Suspense>`, as the existing pages do. Otherwise pages can't regenerate after admin edits.
> 2. Never call `Date.now()` or `new Date()` while rendering on the server.

## Admin dashboard

Sign in at `/admin`. The password is `admin` by default; set the `ADMIN_PASSWORD` environment variable to change it. Sessions use a signed, httpOnly cookie that lasts 7 days, and every server action re-checks it.

| Section | What it does |
|---|---|
| Dashboard | KPIs, products by category, score distribution, "needs attention" (stale prices, unverified products, drafts) |
| Products | Search, filter, edit, duplicate, archive. Deleting requires typing the product's slug |
| Product editor | Tabs follow the research workflow: Basics → Specs → Scores (live score) → Content → Prices (offers + price records) → Reviews & sources → Appearance → Verify & publish |
| Prices | Quick price update across all products; optionally records each saved price to the price history |
| News / Guides | Write, publish, unpublish, delete |
| Advertising | The five reserved ad slots: an on/off switch, sponsor content and a live preview. All off by default |
| Settings | Sample-data notice, newsletter, and score weights per category |
| Inbox | Contact messages and newsletter subscribers (copy as CSV) |

## Common changes

**Add a spec, filter or score criterion to a category:** edit that category in `src/lib/categories.ts`. Spec keys must also exist on every product of that category; `npm run validate:data` lists anything missing. Existing products can be filled in through the admin.

**Add a new category:** add a config to `CATEGORIES` in `categories.ts` and add its slug to `CategorySlug` in `types.ts`. Then add an icon mapping if you use a new lucide icon (`src/components/ui/category-icon.tsx`) and a drawing in `device-art.tsx`.

**Scoring:** each criterion is 0–100 and the platform score is the weighted average (`computeScore`). Default weights live in `categories.ts`; Admin → Settings can override them. Overrides are re-normalised to 100%.

**Ads:** components are `<AdSlot id="…" />`. Disabled slots render nothing. A slot can only be switched on once it has a sponsor and a headline, and every enabled ad is labelled "Sponsored".

**Product photos:** put the image in `public/products/` and set its path in the product editor's Appearance tab. Products without a photo use the generated artwork.

## Before launch

- [ ] Replace the sample products, news and guides with researched, verified data (admin, or edit `data/*.json` and run `npm run validate:data`)
- [ ] Turn off the sample-data notice (Admin → Settings)
- [ ] Set real retailer and affiliate URLs (currently `example.com` placeholders)
- [ ] Set `ADMIN_SECRET` and `NEXT_PUBLIC_SITE_URL` on the host (and `ADMIN_PASSWORD` to replace the default `admin`)
- [ ] Have the privacy policy and terms (template text) reviewed by a professional
- [ ] Replace `hello@example.com` on the contact page
- [ ] Connect the newsletter list to an email provider (subscribers are stored in `data/subscribers.json`)

## Deployment

The JSON store needs a **writable filesystem**, so admin edits work as-is on any Node.js server or VPS (`npm run build && npm start`, behind a reverse proxy) with persistent disk. Keep `data/` backed up.

On serverless platforms such as Vercel the filesystem is read-only. There, swap `src/lib/store.ts` for a database (Postgres, Supabase, etc.) before using the admin. The public site works anywhere.

## Roadmap (plan phase 4)

User accounts and wishlists, automated price tracking from retailer feeds, personalised and AI-assisted recommendations, analytics, and YouTube integration.
