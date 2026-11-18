import { getNews, getProducts, getSettings } from "@/lib/data";
import { HeaderBar } from "./header-bar";
import { buildSearchIndex, navCategories } from "./search-index";

/**
 * Server half of the header: loads cached catalog data and hands the
 * client header a slim search index for the command palette.
 */
export async function SiteHeader() {
  const [products, news, settings] = await Promise.all([getProducts(), getNews(), getSettings()]);
  return <HeaderBar index={buildSearchIndex(products, news, settings)} categories={navCategories()} />;
}
