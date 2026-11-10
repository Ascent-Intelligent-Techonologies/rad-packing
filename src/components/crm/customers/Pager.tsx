import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Prev / next links that keep the current filters in the query string. */
export function Pager({
  basePath,
  params,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  params: Record<string, string>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const href = (p: number) => {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
    if (p > 1) usp.set("page", String(p));
    const qs = usp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = "btn btn-outline !min-h-[40px] !px-4 text-sm";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-sm text-muted">
        {from}–{to} of {total}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={btn}>
            <ChevronLeft size={16} /> Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className={btn}>
            Next <ChevronRight size={16} />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
