import "server-only";
import { getDb } from "@/lib/db";
import { logActivity } from "./activity";
import { label, STAGES } from "./constants";

/**
 * The single place that moves an enquiry between pipeline stages.
 * Handles closedAt / lostReason bookkeeping, activating the customer on a win,
 * and writing the timeline entry. Use this from every module (never set Lead.stage directly).
 */
export async function changeLeadStage(
  leadId: string,
  stage: string,
  opts: { userId?: string | null; lostReason?: string | null } = {},
) {
  const db = getDb()!;
  if (!STAGES.some((s) => s.id === stage)) throw new Error("Unknown stage");
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { id: true, stage: true, companyId: true } });
  if (!lead || lead.stage === stage) return lead;

  const closed = stage === "won" || stage === "lost";
  await db.lead.update({
    where: { id: leadId },
    data: {
      stage,
      closedAt: closed ? new Date() : null,
      lostReason: stage === "lost" ? opts.lostReason?.trim() || "Not specified" : null,
      // working an enquiry counts as contact
      ...(stage !== "new" && stage !== "won" && stage !== "lost" ? { lastContactedAt: new Date() } : {}),
    },
  });
  if (stage === "won" && lead.companyId) {
    await db.company.updateMany({ where: { id: lead.companyId, status: "prospect" }, data: { status: "active" } });
  }
  await logActivity({
    kind: "stage_change",
    leadId,
    companyId: lead.companyId,
    authorId: opts.userId ?? null,
    body: `Stage changed from ${label(STAGES, lead.stage)} to ${label(STAGES, stage)}${
      stage === "lost" && opts.lostReason ? `. Reason: ${opts.lostReason}` : ""
    }.`,
  });
  return { ...lead, stage };
}
