# Software Development Flow

This follows the "Complete website development pipeline" from the business plan (section 8), adapted to how it is actually executed here.

```mermaid
flowchart TD
  A[1. Requirement analysis] --> B[2. Architecture & data model]
  B --> C[3. Visual design system]
  C --> D1[4a. Seed / sample data]
  C --> D2[4b. UI kit, layout chrome, device art]
  D1 & D2 --> E1[5a. Homepage]
  D1 & D2 --> E2[5b. Category listings + filters]
  D1 & D2 --> E3[5c. Product detail + price history]
  D1 & D2 --> E4[5d. Comparison engine]
  D1 & D2 --> E5[5e. Editorial: news, guides, deals, search, policies]
  D1 & D2 --> E6[5f. Admin dashboard + ad toggles]
  E1 & E2 & E3 & E4 & E5 & E6 --> F[6. Integration build: typecheck, lint, next build]
  F --> G[7. Review: requirements, visual/UX, logic, a11y/perf, framework]
  G --> H{All checks pass?}
  H -- No --> I[8. Fix findings] --> F
  H -- Yes --> J[9. Final verification + handover docs]
  J --> K[Later: domain, hosting, real data, analytics]
```

## Stages

| # | Stage | Output | Status |
|---|-------|--------|--------|
| 1 | Requirement analysis | `docs/REQUIREMENTS.md` | done |
| 2 | Architecture & data model | `src/lib/types.ts`, `src/lib/categories.ts`, `src/lib/data.ts`, `src/lib/store.ts` | done |
| 3 | Design system | `src/app/globals.css` tokens + glass utilities | done |
| 4a | Sample data | `data/*.json` (42 products, 14 articles, 8 guides) + `npm run validate:data` | done |
| 4b | UI kit & chrome | `src/components/ui`, `src/components/layout`, `src/components/device-art.tsx`, compare store/tray | done |
| 5a–f | Pages | home, catalog, product, compare, editorial (news, guides, deals, search, methodology, policies, contact), admin | done |
| 6 | Integration build | `tsc`, `npm run lint`, `npm run build` all clean | done |
| 7 | Review | browser run of all 81 routes + 8 interaction tests (`npm run screenshots`), visual review of desktop/mobile/dark screenshots, admin end-to-end save test | done |
| 8 | Fix loop | fixed: compare grid column widths, scroll-reveal visibility (reduced motion + no-JS), React-compiler lint errors, admin shell Suspense, dynamic routes failing to regenerate after admin edits | done |
| 9 | Final verification | final screenshots in `screenshots/final/`, handover README | done |

## Architecture at a glance

- **Framework:** Next.js 16 (App Router, React 19, TypeScript), Tailwind CSS v4, `motion` for animation, `recharts` for graphs, `lucide-react` icons.
- **Rendering:** Cache Components are on. Public data is read through `'use cache'` functions tagged `catalog` in `src/lib/data.ts`; product/category/article routes are prerendered with `generateStaticParams`. Admin saves write JSON and call `updateTag('catalog')` so pages refresh immediately.
- **Data:** JSON files in `data/` (products, news, guides, settings). No database needed yet — swap `src/lib/store.ts` for a real DB later without touching pages.
- **Client state:** the comparison selection (max 5, same category) lives in a small store persisted to `localStorage`. Wishlists and accounts are a later phase.
- **Admin:** `/admin`, protected by `ADMIN_PASSWORD` (see README) via `src/proxy.ts` + a signed cookie.
- **Images:** product visuals are generated SVG device renders (`DeviceArt`) so no copyrighted photos ship; real photos can be added per product later via `image` field.
