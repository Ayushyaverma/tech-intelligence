import Image from "next/image";
import { DeviceArt, deviceVariant } from "@/components/device-art";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/format";

interface ProductThumbProps {
  product: Pick<Product, "category" | "art" | "specs">;
  /** circle = avatar stacks; square = list thumbnails */
  shape?: "circle" | "square";
  className?: string;
}

/**
 * Small decorative product image on a tinted chip. Always sits next to the
 * product's visible name, so it is hidden from screen readers.
 */
export function ProductThumb({ product, shape = "square", className }: ProductThumbProps) {
  const { art } = product;
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden",
        // circles sit in overlapping stacks, so they get a "cut-out" ring in the card colour
        shape === "circle" ? "rounded-full shadow-sm ring-2 ring-surface" : "rounded-xl ring-1 ring-line",
        className,
      )}
      style={{
        background: `radial-gradient(80% 80% at 50% 40%, color-mix(in oklab, ${art.accent} 22%, transparent), transparent 75%), var(--surface-2)`,
      }}
    >
      {art.image ? (
        <Image src={art.image} alt="" fill sizes="64px" className="object-contain p-1" />
      ) : (
        <DeviceArt
          category={product.category}
          primary={art.primary}
          accent={art.accent}
          variant={deviceVariant(product)}
          className={shape === "circle" ? "w-[125%]! max-w-none" : "w-[112%]! max-w-none"}
        />
      )}
    </span>
  );
}

interface ProductStackProps {
  products: Pick<Product, "slug" | "category" | "art" | "specs">[];
  className?: string;
  /** Tailwind size class for each avatar */
  itemClassName?: string;
}

/** Overlapping circular avatars, e.g. for a 2–5 product comparison. */
export function ProductStack({ products, className, itemClassName = "size-14" }: ProductStackProps) {
  return (
    <span className={cn("flex items-center -space-x-3", className)} aria-hidden>
      {products.map((p, i) => (
        // --i fans the avatars apart a few pixels when the parent card (.group) is hovered
        <span
          key={p.slug}
          className="relative transition-transform duration-200 ease-out group-hover:translate-x-[calc(var(--i)*4px)]"
          style={{ zIndex: products.length - i, ["--i" as string]: i }}
        >
          <ProductThumb product={p} shape="circle" className={itemClassName} />
        </span>
      ))}
    </span>
  );
}
