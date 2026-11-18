"use client";

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** Route-level error boundary: friendly message plus retry. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;

  return (
    <Container className="py-20 sm:py-28">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-line bg-warning-soft text-warning shadow-xs">
          <TriangleAlert className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Something went wrong</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          An unexpected error interrupted this page. Trying again usually fixes it — if not, head back home
          and pick up from there.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="ink" onClick={() => retry()}>
            <RotateCw className="size-4" aria-hidden />
            Try again
          </Button>
          <ButtonLink href="/" variant="glass">
            Go home
          </ButtonLink>
        </div>
        {digest && (
          <p className="mt-8 font-mono text-xs text-subtle">
            Reference: <span className="select-all">{digest}</span>
          </p>
        )}
      </div>
    </Container>
  );
}
