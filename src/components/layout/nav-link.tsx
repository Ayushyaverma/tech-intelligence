"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { cn } from "@/lib/format";

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** classes added when the link matches the current route */
  activeClassName?: string;
  onClick?: () => void;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ActiveAwareLink({ active, href, children, className, activeClassName, onClick }: NavLinkProps & { active: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClassName)}
    >
      {children}
    </Link>
  );
}

function PathAwareLink(props: NavLinkProps) {
  const pathname = usePathname();
  return <ActiveAwareLink {...props} active={isActive(pathname, props.href)} />;
}

/**
 * Link with active-route styling. usePathname can suspend under Cache
 * Components (unknown dynamic params), so the inactive link is the fallback
 * and the rest of the header stays in the static shell.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<ActiveAwareLink {...props} active={false} />}>
      <PathAwareLink {...props} />
    </Suspense>
  );
}
