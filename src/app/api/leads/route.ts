import { after } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { dbConfigured } from "@/lib/db";
import { leadSchema, notifyTeam, saveLead } from "@/lib/leads";

export async function POST(req: Request) {
  const rl = rateLimit(`lead:${clientIp(req)}`, 6, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: "Too many submissions. Please try again shortly or call us." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Please check your details.";
    return Response.json({ error: msg }, { status: 400 });
  }
  const lead = parsed.data;

  // Honeypot tripped: pretend success so bots learn nothing.
  if (lead.website) return Response.json({ ok: true });

  if (!dbConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error("Lead received but no database is configured");
      return Response.json({ error: "We couldn't save your enquiry right now." }, { status: 503 });
    }
    console.warn("[dev] No database configured. Lead not stored:", lead.email);
    return Response.json({ ok: true, stored: false });
  }

  try {
    const saved = await saveLead(lead);
    after(() => notifyTeam(lead));
    return Response.json({ ok: true, id: saved?.id });
  } catch (e) {
    console.error("Failed to save lead", e);
    return Response.json({ error: "We couldn't save your enquiry right now." }, { status: 500 });
  }
}
