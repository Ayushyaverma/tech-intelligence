"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the
 * whole document, so global CSS/fonts aren't available — styles are inline.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#f6f6f3",
          color: "#15171c",
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          colorScheme: "light",
        }}
      >
        <title>Something went wrong · Tech Intelligence</title>
        <main style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b707b" }}>
            Tech Intelligence
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: "12px 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b707b", lineHeight: 1.6, margin: "0 0 24px" }}>
            The site hit an unexpected error while loading. Please try again.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{
                height: 44,
                padding: "0 22px",
                borderRadius: 999,
                border: "1px solid #15171c",
                background: "#15171c",
                color: "#f6f6f3",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* Plain anchor on purpose: a full reload is the safest recovery here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                height: 44,
                padding: "0 22px",
                borderRadius: 999,
                border: "1px solid rgba(20,22,28,0.14)",
                background: "#fff",
                color: "#15171c",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Go home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
