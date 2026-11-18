import { cn } from "@/lib/format";
import { headingId, headingText, isHeading } from "./build";

interface ArticleBodyProps {
  /** stored paragraphs; a paragraph starting with "## " becomes a sub-heading */
  paragraphs: string[];
  /** render the first paragraph as a larger lead-in */
  lead?: boolean;
  className?: string;
}

/** Long-form article typography: comfortable measure, generous leading, anchored sub-heads. */
export function ArticleBody({ paragraphs, lead = true, className }: ArticleBodyProps) {
  const leadIndex = paragraphs.findIndex((p) => !isHeading(p));
  return (
    <div className={cn("max-w-[68ch] text-ink-2", className)}>
      {paragraphs.map((p, i) => {
        if (isHeading(p)) {
          const text = headingText(p);
          return (
            <h2
              key={i}
              id={headingId(text)}
              className="mb-4 mt-12 scroll-mt-28 text-2xl font-semibold tracking-tight text-ink first:mt-0 sm:text-[1.65rem]"
            >
              {text}
            </h2>
          );
        }
        const isLead = lead && i === leadIndex;
        return (
          <p
            key={i}
            className={cn(
              "mt-6 first:mt-0",
              isLead
                ? "text-lg leading-[1.7] text-ink sm:text-xl sm:leading-[1.65]"
                : "text-[16.5px] leading-[1.8] sm:text-[17px]",
            )}
          >
            {p}
          </p>
        );
      })}
    </div>
  );
}
