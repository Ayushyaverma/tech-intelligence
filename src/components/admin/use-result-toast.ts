"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/admin/templates";

/** Show a toast for each new action result (keyed on the server timestamp `at`). */
export function useResultToast(result: ActionResult | null | undefined, onSuccess?: (r: ActionResult) => void) {
  const seen = useRef<number | undefined>(undefined);
  const cb = useRef(onSuccess);
  useEffect(() => {
    cb.current = onSuccess;
  });
  useEffect(() => {
    if (!result?.at || result.at === seen.current) return;
    seen.current = result.at;
    if (result.ok) {
      toast(result.message ?? "Saved", { tone: "positive" });
      cb.current?.(result);
    } else if (result.error) {
      toast(result.error, { tone: "warning" });
    }
  }, [result]);
}
