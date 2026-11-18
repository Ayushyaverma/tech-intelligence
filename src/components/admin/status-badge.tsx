import { BadgeCheck, CircleDashed, Archive, Globe, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublishStatus } from "@/lib/types";

const STATUS = {
  published: { tone: "positive", label: "Published", Icon: Globe },
  draft: { tone: "warning", label: "Draft", Icon: PenLine },
  archived: { tone: "neutral", label: "Archived", Icon: Archive },
} as const;

export function StatusBadge({ status, className }: { status: PublishStatus; className?: string }) {
  const s = STATUS[status];
  return (
    <Badge tone={s.tone} className={className}>
      <s.Icon aria-hidden />
      {s.label}
    </Badge>
  );
}

export function VerifiedBadge({ verified, className }: { verified: boolean; className?: string }) {
  return verified ? (
    <Badge tone="accent" className={className}>
      <BadgeCheck aria-hidden />
      Verified
    </Badge>
  ) : (
    <Badge tone="neutral" className={className}>
      <CircleDashed aria-hidden />
      Unverified
    </Badge>
  );
}
