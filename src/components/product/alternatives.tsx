import { GitCompareArrows } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui/button";
import { StaggerItem, Stagger } from "@/components/ui/reveal";
import { compareHref } from "@/lib/product-utils";
import type { Product } from "@/lib/types";

interface AlternativesProps {
  product: Product;
  alternatives: { product: Product; score: number }[];
}

/** Same-category products closest in price, with a one-click comparison of all of them. */
export function Alternatives({ product, alternatives }: AlternativesProps) {
  const slugs = [product.slug, ...alternatives.map((a) => a.product.slug)].slice(0, 5);
  return (
    <div>
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {alternatives.map((a) => (
          <StaggerItem key={a.product.id} className="h-full">
            <ProductCard product={a.product} score={a.score} />
          </StaggerItem>
        ))}
      </Stagger>
      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <ButtonLink href={compareHref(slugs)} variant="ink" size="lg">
          <GitCompareArrows aria-hidden /> Compare these {slugs.length}
        </ButtonLink>
        <p className="text-xs text-muted">Opens a side-by-side comparison with this product and the alternatives above.</p>
      </div>
    </div>
  );
}
