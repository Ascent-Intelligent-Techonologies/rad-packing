import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";
import { fmtDateTime, timeAgo } from "@/lib/crm/format";
import { Badge, PageHeader, Panel } from "@/components/crm/ui";

export const metadata: Metadata = { title: "Chat transcript" };

/**
 * Renders **bold** markers as <strong>. Everything else is plain text: React escapes it,
 * so nothing a visitor typed can ever become markup.
 */
function Rich({ text }: { text: string }) {
  // split() with one capture group puts the bold contents at the odd indexes.
  const parts = text.split(/\*\*([\s\S]+?)\*\*/);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

export default async function ChatPage(props: PageProps<"/admin/chats/[id]">) {
  await requireUser("view");
  const { id } = await props.params;
  const db = getDb()!;

  const session = await db.chatSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 1000 } },
  });
  if (!session) notFound();

  const visitorCount = session.messages.filter((m) => m.role === "user").length;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/chats", label: "All chats" }}
        title="Chat transcript"
        subtitle={
          <>
            Started {fmtDateTime(session.createdAt)} ({timeAgo(session.createdAt)})
          </>
        }
        actions={
          <>
            <Badge tone="blue">
              {session.messages.length} {session.messages.length === 1 ? "message" : "messages"}
            </Badge>
            <Badge tone="slate">{visitorCount} from the visitor</Badge>
          </>
        }
      />

      <Panel>
        {session.messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">This conversation has no messages.</p>
        ) : (
          <ol className="mx-auto flex max-w-3xl flex-col gap-4" aria-label="Conversation">
            {session.messages.map((m) => {
              const visitor = m.role === "user";
              return (
                <li key={m.id} className={`flex flex-col ${visitor ? "items-end" : "items-start"}`}>
                  <span className="mb-1 px-1 text-xs font-bold text-muted">{visitor ? "Visitor" : "Assistant"}</span>
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[15px] leading-relaxed sm:max-w-[80%] ${
                      visitor
                        ? "rounded-br-md bg-brand text-white"
                        : "rounded-bl-md border border-line bg-slate-50 text-text"
                    }`}
                  >
                    <Rich text={m.content} />
                  </div>
                  <time dateTime={m.createdAt.toISOString()} className="mt-1 px-1 text-[11px] text-muted">
                    {fmtDateTime(m.createdAt)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </>
  );
}
