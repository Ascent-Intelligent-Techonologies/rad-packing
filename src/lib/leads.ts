import { z } from "zod";
import { getDb } from "@/lib/db";
import { scoreLead } from "@/lib/crm/score";
import { products } from "@/lib/site";

export const leadSchema = z.object({
  source: z.enum(["contact", "quote", "chat"]),
  name: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
  email: z.string().trim().max(200).pipe(z.email("Please enter a valid email address.")),
  phone: z.string().trim().max(40).optional(),
  industry: z.string().trim().max(120).optional(),
  products: z.array(z.string().trim().max(60)).max(10).default([]),
  message: z.string().trim().max(4000).optional(),
  transcript: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(40)
    .optional(),
  pageUrl: z.string().max(200).optional(),
  /** honeypot: bots fill it, humans never see it */
  website: z.string().max(200).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export async function saveLead(input: LeadInput) {
  const db = getDb();
  if (!db) return null;

  const { score } = scoreLead({
    phone: input.phone,
    email: input.email,
    company: input.company,
    industry: input.industry,
    products: input.products,
    message: input.message,
    source: input.source,
    hasTranscript: !!input.transcript?.length,
  });

  // Link to an existing customer / contact when we recognise them.
  const [account, person] = await Promise.all([
    input.company
      ? db.company.findFirst({ where: { name: { equals: input.company, mode: "insensitive" } }, select: { id: true } })
      : null,
    db.contact.findFirst({ where: { email: { equals: input.email, mode: "insensitive" } }, select: { id: true, companyId: true } }),
  ]);

  const productTitles = input.products.map((slug) => products.find((p) => p.slug === slug)?.title ?? slug);
  const title =
    productTitles.length > 0
      ? productTitles.join(", ")
      : input.message
        ? input.message.replace(/\s+/g, " ").slice(0, 70)
        : null;
  const who = input.name || input.company || input.email;
  const via = input.source === "chat" ? "the website chat" : input.source === "quote" ? "the quote form" : "the contact form";

  return db.lead.create({
    data: {
      source: input.source,
      stage: "new",
      title,
      priority: score >= 70 ? "high" : "normal",
      score,
      name: input.name || null,
      company: input.company || null,
      email: input.email,
      phone: input.phone || null,
      industry: input.industry || null,
      products: input.products,
      message: input.message || null,
      transcript: input.transcript ?? undefined,
      pageUrl: input.pageUrl || null,
      companyId: account?.id ?? person?.companyId ?? null,
      contactId: person?.id ?? null,
      activities: { create: { kind: "system", body: `Enquiry received via ${via}.` } },
      tasks: {
        create: {
          title: `Respond to new enquiry from ${who}`,
          kind: input.phone ? "call" : "email",
          priority: score >= 70 ? "high" : "normal",
          dueAt: new Date(Date.now() + 4 * 3600_000),
        },
      },
    },
  });
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Optional email alert to the RAD team through Resend.
 * Enabled only when RESEND_API_KEY and LEAD_NOTIFY_EMAIL are set.
 */
export async function notifyTeam(lead: LeadInput) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!key || !to) return;

  const rows: [string, string | undefined][] = [
    ["Source", lead.source],
    ["Name", lead.name],
    ["Company", lead.company],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Industry", lead.industry],
    ["Interested in", lead.products.join(", ")],
    ["Message", lead.message],
    ["Page", lead.pageUrl],
  ];
  const html =
    `<h2>New website enquiry</h2><table cellpadding="6">` +
    rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v!)}</td></tr>`)
      .join("") +
    `</table>` +
    (lead.transcript?.length
      ? `<h3>Chat transcript</h3>` +
        lead.transcript.map((m) => `<p><b>${m.role === "user" ? "Visitor" : "Assistant"}:</b> ${esc(m.content)}</p>`).join("")
      : "");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL ?? "RAD Website <onboarding@resend.dev>",
        to: to.split(",").map((s) => s.trim()),
        reply_to: lead.email,
        subject: `New ${lead.source} enquiry${lead.company ? ` from ${lead.company}` : ""}`,
        html,
      }),
    });
  } catch (e) {
    console.error("Lead email failed", e);
  }
}
