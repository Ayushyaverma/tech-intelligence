"use client";

import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "@/components/ui/toast";
import { deleteMessage, deleteSubscriber } from "@/lib/admin/actions";
import { formatDateTimeIst } from "@/lib/admin/dates";
import type { ActionResult } from "@/lib/admin/templates";
import type { ContactMessage, Subscriber } from "@/lib/types";
import { Panel } from "./panel";

function useRunner() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast(r.message ?? "Done", { tone: "positive" });
        router.refresh();
      } else toast(r.error ?? "Something went wrong", { tone: "warning" });
    });
  return { pending, run };
}

export function MessagesList({ messages }: { messages: ContactMessage[] }) {
  const { pending, run } = useRunner();
  return (
    <Panel title="Contact messages" description={`${messages.length} message${messages.length === 1 ? "" : "s"}`} flush>
      {messages.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted">No messages yet.</p>
      ) : (
        <ul className={`divide-y divide-line ${pending ? "opacity-70" : ""}`}>
          {messages.map((m) => (
            <li key={m.id} className="px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {m.name} <span className="font-normal text-muted">· {m.email}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink-2">{m.topic}</span> · {formatDateTimeIst(m.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => run(() => deleteMessage(m.id))}
                  aria-label={`Delete message from ${m.name}`}
                  className="grid size-8 place-items-center rounded-lg text-muted hover:bg-negative-soft hover:text-negative"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-2">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function SubscribersList({ subscribers }: { subscribers: Subscriber[] }) {
  const { pending, run } = useRunner();

  async function copyCsv() {
    const csv = ["email,subscribed_at", ...subscribers.map((s) => `${s.email},${s.createdAt}`)].join("\n");
    try {
      await navigator.clipboard.writeText(csv);
      toast(`Copied ${subscribers.length} subscribers as CSV`, { tone: "positive" });
    } catch {
      toast("Clipboard is unavailable in this browser", { tone: "warning" });
    }
  }

  return (
    <Panel
      title="Newsletter subscribers"
      description={`${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"}`}
      flush
      actions={
        subscribers.length > 0 && (
          <button type="button" onClick={copyCsv} className="btn-glass inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium text-ink">
            <Copy className="size-3.5" aria-hidden /> Copy CSV
          </button>
        )
      }
    >
      {subscribers.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted">No subscribers yet.</p>
      ) : (
        <ul className={`max-h-[32rem] divide-y divide-line overflow-y-auto ${pending ? "opacity-70" : ""}`}>
          {subscribers.map((s) => (
            <li key={s.email} className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{s.email}</p>
                <p className="text-xs text-muted">{formatDateTimeIst(s.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => run(() => deleteSubscriber(s.email))}
                aria-label={`Remove ${s.email}`}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-negative-soft hover:text-negative"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
