import Image from "next/image";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/format";
import { DeviceArt, deviceVariant } from "./device-art";

export { deviceVariant };

const SIZES = {
  sm: { pad: "p-1.5", radius: "rounded-xl", img: "96px" },
  md: { pad: "p-4", radius: "rounded-card", img: "(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw" },
  lg: { pad: "p-6 sm:p-8", radius: "rounded-panel", img: "(min-width: 1024px) 520px, 90vw" },
  xl: { pad: "p-8 sm:p-12", radius: "rounded-hero", img: "(min-width: 1024px) 720px, 95vw" },
} as const;

interface ProductVisualProps {
  product: Pick<Product, "category" | "art" | "name" | "specs">;
  className?: string;
  size?: keyof typeof SIZES;
  /** soft tinted backdrop behind the device (default true) */
  backdrop?: boolean;
  /** eager-load a real photo (above-the-fold heroes) */
  priority?: boolean;
  /** set false when a visible product name sits right next to the visual */
  labelled?: boolean;
}

/**
 * Product imagery: the real photo when `art.image` is set, otherwise the
 * generated DeviceArt render on a soft radial backdrop tinted by the accent.
 */
export function ProductVisual({
  product,
  className,
  size = "md",
  backdrop = true,
  priority = false,
  labelled = true,
}: ProductVisualProps) {
  const s = SIZES[size];
  const { art } = product;
  const title = labelled ? `${product.name} (illustration)` : undefined;

  return (
    <div
      className={cn("relative isolate overflow-hidden", backdrop && s.radius, s.pad, className)}
      style={
        backdrop
          ? {
              background: `radial-gradient(70% 60% at 50% 42%, color-mix(in oklab, ${art.accent} 20%, transparent), transparent 72%), radial-gradient(120% 80% at 50% 120%, color-mix(in oklab, ${art.primary} 10%, transparent), transparent 60%), linear-gradient(180deg, var(--surface-2), color-mix(in oklab, var(--surface-2) 40%, var(--surface)))`,
            }
          : undefined
      }
    >
      {art.image ? (
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={art.image}
            alt={labelled ? product.name : ""}
            fill
            sizes={s.img}
            className="object-contain drop-shadow-[0_18px_24px_rgba(16,18,24,0.18)]"
            {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
          />
        </div>
      ) : (
        <DeviceArt
          category={product.category}
          primary={art.primary}
          accent={art.accent}
          variant={deviceVariant(product)}
          title={title}
        />
      )}
    </div>
  );
}
