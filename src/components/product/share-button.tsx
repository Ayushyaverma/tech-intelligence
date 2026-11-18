"use client";

import { Check, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";

/**
 * Shares the current page: the native share sheet on touch devices,
 * otherwise copies the link and confirms with a toast.
 */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function onClick() {
    const url = window.location.href.split("#")[0];
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // dismissed by the user — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied to clipboard", { tone: "positive" });
    } catch {
      toast("Couldn't copy the link — copy it from the address bar", { tone: "warning" });
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Link copied" : `Share ${title}`}
      className="btn-glass inline-grid size-11 shrink-0 place-items-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:size-4"
    >
      {copied ? <Check className="text-positive" aria-hidden /> : <Share2 aria-hidden />}
    </button>
  );
}
