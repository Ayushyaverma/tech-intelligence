/**
 * Site-wide navigation + URL config shared by the header, mobile menu,
 * command palette, footer and sitemap. Edit links here, not in components.
 */

/** Public origin. Set NEXT_PUBLIC_SITE_URL in production (e.g. https://example.in). */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "Tech Intelligence";

export const SITE_DESCRIPTION =
  "Independent technology research for Indian buyers — compare phones, laptops, TVs, headphones, tablets and monitors with transparent scores and recorded price history.";

export interface NavLinkItem {
  href: string;
  label: string;
  /** one-liner used in the command palette and mobile menu */
  description?: string;
}

/** Primary header links (the "Categories" mega-menu is rendered separately). */
export const PRIMARY_NAV: NavLinkItem[] = [
  { href: "/compare", label: "Compare", description: "Line up to five devices side by side" },
  { href: "/deals", label: "Deals", description: "Recorded price drops across categories" },
  { href: "/news", label: "News", description: "Launches, price moves and industry news" },
  { href: "/guides", label: "Guides", description: "Buying advice by budget and use" },
];

export const FOOTER_NAV: { title: string; links: NavLinkItem[] }[] = [
  {
    title: "Explore",
    links: [
      { href: "/compare", label: "Compare" },
      { href: "/deals", label: "Deals" },
      { href: "/news", label: "News" },
      { href: "/guides", label: "Buying guides" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/methodology", label: "Methodology" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

/** Public, non-parameterised routes listed in the sitemap. */
export const STATIC_ROUTES = [
  "/",
  "/category",
  "/compare",
  "/deals",
  "/news",
  "/guides",
  "/search",
  "/about",
  "/methodology",
  "/contact",
  "/affiliate-disclosure",
  "/privacy",
  "/terms",
];

/** Admin routes get their own full-screen shell — public chrome hides there. */
export function isAdminPath(pathname: string | null): boolean {
  return !!pathname && (pathname === "/admin" || pathname.startsWith("/admin/"));
}
