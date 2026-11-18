# Tech Intelligence Platform — Requirements

Source: `../Plan Business Idea.pdf` (the business owner's blueprint). This file is the condensed, buildable version.

## Vision
A premium technology research and product-comparison website (India-first, prices in ₹) where people discover new electronics, understand specifications, compare up to five devices, see price history, and decide what to buy. Simple, fast, visually premium, trustworthy, easy to update without code.

## R1 — Homepage (exact order)
1. Navigation bar — logo, search, categories
2. Latest technology news / new launches (hero)
3. Price updates — recent drops and changes
4. Featured technology — important reviews and editorials
5. Product categories — Phones, Laptops, TVs, Headphones, Tablets/iPads, Monitors (visible just below the first screen)
6. Trending comparisons — popular product match-ups ("compare up to five devices")
7. Buying guides — by budget and usage
8. Advertisement slot (reserved, off by default)
9. Latest reviews
10. Newsletter and footer (about, policies, contact)

## R2 — Category listing page (same layout for every category)
- Product cards: image, brand + model, platform score /100, latest verified price, small price-trend indicator, 3–4 key specs, compare checkbox, view-details.
- Tier chips (All / Flagship / Mid-range / Budget), search within category.
- Category-specific filters (dynamic — never show camera filters on laptops):
  - Phones: price, brand, processor, RAM, storage, camera, battery
  - Laptops: price, CPU, GPU, RAM, storage, display, battery
  - TVs: price, screen size, resolution, panel type, refresh rate, smart OS, HDR
  - Headphones: price, type, wireless/wired, noise cancellation, battery, sound quality, microphone
  - Tablets: price, screen size, processor, RAM, storage, stylus support, battery
  - Monitors: price, size, resolution, panel, refresh rate, HDR, connectivity
- Sort: recommended, price, score, popularity. Ad slot between groups of cards (off by default).
- "Compare your selection" bar: 0/5 selected.

## R3 — Comparison system (2–5 devices)
1. Minimum two products to open comparison; maximum five.
2. Users can remove and replace products.
3. Products must belong to the same/compatible category.
4. Highlight differences between specifications.
5. Identify the best option for particular needs, not one universal winner.
6. Product names and controls stay visible (sticky) when scrolling.
7. Criteria are category-specific (laptops compare laptop specs).
8. Includes scores, prices and an overlaid price-history chart with common date range/currency.

## R4 — Individual product page (the most important page)
Overview (image, name, score, tagline), price information (latest verified price, retailer, last-checked date), price-history line graph, then sections: general information, technical specifications (category template), performance/benchmarks, display & design, battery & power, expert reviews (linked + summarised), user experiences, pros & cons, where to buy (retailer prices + disclosed affiliate links), similar alternatives, scoring breakdown + methodology. Every fact carries sources and update dates. Ad slot below core specs (off by default).

## R5 — Scoring
Score out of 100, weighted per category with disclosed weights (e.g. phones: performance 20, display 15, cameras 20, battery 15, build 10, software 10, value 10). Label the score type: editorial, multi-source aggregate, or benchmark-derived. Public methodology page.

## R6 — Price tracking
INR by default. Each price entry: product, retailer, price, date checked, availability, URL. Price-history graphs only use recorded data points. Price-drop feed on homepage and a deals page.

## R7 — Admin dashboard (no code needed for routine updates)
Products (add/edit/delete/archive, specs, sources, scores, pros/cons), prices (add retailer price records), news (publish), buying guides, advertising (toggle each slot), affiliate links, analytics overview. Workflow: add product → specs → sources → prices → verify → publish.

## R8 — Monetisation infrastructure
Five reserved ad placements with IDs and on/off switch, disabled by default and never interfering with scores: home between news sections, category between listings, product below core specs, guides/articles, comparison below results. Affiliate disclosure everywhere links appear.

## R9 — Design
Premium minimal: warm-white / light-grey background, charcoal text, muted grey secondary, one restrained blue/indigo accent, clean cards with subtle shadows, translucent glass-like buttons with soft highlights (Liquid-Glass-inspired, not copied), rounded corners, clean sans-serif, high-quality product imagery, clear interactive graphs, subtle 150–200 ms transitions, hover = slight brightness/elevation, click = subtle press, no bouncing/spinning, accessible contrast + keyboard nav, reduced-motion support, optional dark mode, fully responsive. Avoid neon, heavy 3D, clutter.

## Phases (from plan)
- Phase 1 MVP: homepage, categories, listings, product pages, five-product comparison. ✅ in scope
- Phase 2: admin, research workflow, news publishing, price history, affiliate links. ✅ in scope
- Phase 3: ad infrastructure (placeholders + toggles). ✅ in scope (activation later)
- Phase 4: accounts, wishlists, automated tracking, AI. ⏭ later (wishlist stored locally is a bonus)

## Data honesty
All products, prices, scores and articles shipped with this build are **sample data** with fictional brands, clearly labelled by a site-wide "sample data" notice (toggle in admin settings). Replace through the admin dashboard before launch.
