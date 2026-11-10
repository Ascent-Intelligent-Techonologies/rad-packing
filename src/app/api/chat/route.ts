import { after } from "next/server";
import { z } from "zod";
import { fallbackReply } from "@/lib/chat/knowledge";
import { getDb } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  sessionId: z.string().max(64).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(1500) }))
    .min(1)
    .max(40),
});

/**
 * Structured chatbot: replies come from curated intents (src/lib/chat/knowledge.ts),
 * each with an answer, page links and quick-reply buttons, and can open the lead form.
 * No AI model is called.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`chat:${clientIp(req)}`, 40, 5 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "You're sending messages quickly. Please wait a moment or call us." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid message." }, { status: 400 });
  const { sessionId, messages } = parsed.data;

  const last = messages[messages.length - 1];
  if (last.role !== "user") return Response.json({ error: "Invalid message." }, { status: 400 });
  const question = last.content;
  const history = messages.slice(0, -1).filter((m) => m.role === "user").slice(-6).map((m) => m.content);
  const reply = fallbackReply(question, history);

  // Log the exchange so the team can see what customers ask (best effort).
  after(async () => {
    const db = getDb();
    if (!db) return;
    try {
      const id =
        sessionId && /^[a-z0-9]{10,40}$/i.test(sessionId)
          ? (await db.chatSession.upsert({ where: { id: sessionId }, create: { id: sessionId }, update: {} })).id
          : (await db.chatSession.create({ data: {} })).id;
      await db.chatMessage.createMany({
        data: [
          { sessionId: id, role: "user", content: question },
          { sessionId: id, role: "assistant", content: reply.message },
        ],
      });
    } catch (e) {
      console.error("chat log failed", e);
    }
  });

  return Response.json(reply);
}
