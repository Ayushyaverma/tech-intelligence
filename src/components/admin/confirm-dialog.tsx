"use client";

import { AnimatePresence, motion } from "motion/react";
import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { CONTROL } from "./fields";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  /** when set, the user must type this exact text to enable the button */
  typeToConfirm?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-page confirmation (the admin never uses window.confirm). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  typeToConfirm,
  destructive,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const inputId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTyped("");
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    if (!typeToConfirm) cancelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, typeToConfirm]);

  const ready = !typeToConfirm || typed.trim() === typeToConfirm;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`${inputId}-title`}
            className="glass relative w-full max-w-md rounded-panel p-6"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-start gap-3">
              {destructive && (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-negative-soft text-negative">
                  <TriangleAlert className="size-5" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <h2 id={`${inputId}-title`} className="text-lg font-semibold tracking-tight text-ink">
                  {title}
                </h2>
                {description && <div className="mt-1.5 text-sm leading-relaxed text-muted">{description}</div>}
              </div>
            </div>
            {typeToConfirm && (
              <div className="mt-5">
                <label htmlFor={inputId} className="mb-1.5 block text-[13px] text-ink-2">
                  Type <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-ink">{typeToConfirm}</code> to confirm
                </label>
                <input
                  id={inputId}
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className={cn(CONTROL, "h-10 font-mono")}
                />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="h-10 rounded-full px-4 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!ready || pending}
                onClick={onConfirm}
                className={cn(
                  "h-10 rounded-full px-5 text-sm font-medium transition-[filter,opacity] disabled:opacity-50",
                  destructive ? "bg-negative text-white hover:brightness-110" : "btn-ink",
                )}
              >
                {pending ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
