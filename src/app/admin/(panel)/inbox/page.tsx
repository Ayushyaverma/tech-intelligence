import type { Metadata } from "next";
import { Suspense } from "react";
import { MessagesList, SubscribersList } from "@/components/admin/inbox-lists";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getMessagesFresh, getSubscribersFresh } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Inbox" };

export default function AdminInboxPage() {
  return (
    <>
      <AdminPageHeader eyebrow="Audience" title="Inbox" description="Contact form messages and newsletter subscribers." />
      <Suspense fallback={<div className="grid gap-6 xl:grid-cols-2"><div className="skeleton h-72" /><div className="skeleton h-72" /></div>}>
        <InboxContent />
      </Suspense>
    </>
  );
}

async function InboxContent() {
  const [messages, subscribers] = await Promise.all([getMessagesFresh(), getSubscribersFresh()]);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <MessagesList messages={messages} />
      <SubscribersList subscribers={subscribers} />
    </div>
  );
}
