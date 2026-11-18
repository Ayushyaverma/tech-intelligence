import { Megaphone, Newspaper, Star, TrendingDown, type LucideIcon } from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import type { NewsKind } from "@/lib/types";

/** Display metadata for each kind of news article. */
export const NEWS_KINDS: Record<NewsKind, { label: string; plural: string; tone: BadgeTone; icon: LucideIcon }> = {
  launch: { label: "Launch", plural: "Launches", tone: "accent", icon: Megaphone },
  price: { label: "Price watch", plural: "Price", tone: "positive", icon: TrendingDown },
  industry: { label: "Industry", plural: "Industry", tone: "neutral", icon: Newspaper },
  review: { label: "Review", plural: "Reviews", tone: "warning", icon: Star },
};

/** Order of the filter chips on /news. */
export const NEWS_KIND_ORDER: NewsKind[] = ["launch", "price", "industry", "review"];
