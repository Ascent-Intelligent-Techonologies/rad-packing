import { ChevronDown } from "lucide-react";

/** A native <details> disclosure styled as a button; no client JS. */
export function Disclosure({
  summary,
  children,
  variant = "outline",
  className = "",
  defaultOpen = false,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  variant?: "outline" | "brand" | "link";
  className?: string;
  defaultOpen?: boolean;
}) {
  const style =
    variant === "brand"
      ? "btn btn-brand !min-h-[42px] !px-4 text-sm"
      : variant === "outline"
        ? "btn btn-outline !min-h-[42px] !px-4 text-sm"
        : "inline-flex min-h-[40px] items-center gap-1.5 text-sm font-bold text-brand hover:underline";
  return (
    <details className={`group ${className}`} open={defaultOpen}>
      <summary className={`${style} cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden`}>
        {summary}
        <ChevronDown size={15} className="transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
