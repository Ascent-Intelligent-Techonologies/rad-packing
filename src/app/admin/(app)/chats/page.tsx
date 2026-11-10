import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, MessageSquare } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";
import { fmtDateTime, timeAgo } from "@/lib/crm/format";
import { Badge, EmptyState, PageHeader, Panel, StatCard } from "@/components/crm/ui";

export const metadata: Metadata = { title: "Website chat" };

export default async function ChatsPage() {
  await requireUser("view");
  const db = getDb()!;

  // Start of today in Dubai (UTC+4).
  const now = new Date();
  const DUBAI = 4 * 3600_000;
  const todayStart = new Date(Math.floor((now.getTime() + DUBAI) / 86_400_000) * 86_400_000 - DUBAI);
  const weekStart = new Date(now.getTime() - 7 * 86_400_000);

  const [today, week, total, sessions] = await Promise.all([
    db.chatSession.count({ where: { createdAt: { gte: todayStart } } }),
    db.chatSession.count({ where: { createdAt: { gte: weekStart } } }),
    db.chatSession.count(),
    db.chatSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        _count: { select: { messages: true } },
        messages: {
          where: { role: "user" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Website chat"
        subtitle="What visitors ask the website assistant. Read-only: enquiries it captures appear under Enquiries."
      />

      <section aria-label="Conversation totals" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:gap-4">
        <StatCard label="Today" value={today.toLocaleString("en-GB")} hint="Conversations started" />
        <StatCard label="Last 7 days" value={week.toLocaleString("en-GB")} hint="Conversations started" />
        <StatCard label="All time" value={total.toLocaleString("en-GB")} hint="Conversations recorded" />
      </section>

      <Panel title="Latest conversations" flush className="mt-6" actions={sessions.length ? <span className="text-xs text-muted">Latest {sessions.length}</span> : undefined}>
        {sessions.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            body="When visitors use the chat assistant on the website, their conversations will show up here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {sessions.map((s) => {
              const preview = s.messages[0]?.content;
              return (
                <li key={s.id}>
                  <Link
                    href={`/admin/chats/${s.id}`}
                    className="flex min-h-[64px] items-center gap-3 px-5 py-3.5 transition hover:bg-[#f8f9ff]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand" aria-hidden="true">
                      <MessageSquare size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block line-clamp-2 break-words text-[15px] font-semibold leading-snug">
                        {preview ?? <span className="font-normal text-muted">No visitor message</span>}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span>{fmtDateTime(s.createdAt)}</span>
                        <span>{timeAgo(s.createdAt)}</span>
                        <Badge tone={s._count.messages > 2 ? "blue" : "slate"}>
                          {s._count.messages} {s._count.messages === 1 ? "message" : "messages"}
                        </Badge>
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
