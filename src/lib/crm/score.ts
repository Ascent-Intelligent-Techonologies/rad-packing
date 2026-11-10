/**
 * Simple, explainable lead score (0-100). Not machine learning: just a checklist of
 * signals that correlate with a serious enquiry, so the team knows who to call first.
 */
export function scoreLead(l: {
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  industry?: string | null;
  products?: string[];
  message?: string | null;
  source?: string;
  hasTranscript?: boolean;
}) {
  let s = 10;
  const why: string[] = [];
  const add = (n: number, reason: string) => {
    s += n;
    why.push(reason);
  };
  if (l.phone) add(20, "Gave a phone number");
  if (l.company) add(15, "Named their company");
  if ((l.message?.length ?? 0) > 80) add(20, "Detailed requirement");
  else if ((l.message?.length ?? 0) > 20) add(8, "Described the need");
  if (l.products?.length) add(15, "Chose product lines");
  if (l.industry) add(10, "Shared their industry");
  if (l.source === "quote") add(15, "Asked for a quote");
  if (l.hasTranscript) add(5, "Chatted with the AI first");
  const score = Math.min(100, s);
  return { score, why };
}

export const scoreTone = (n: number) => (n >= 70 ? "green" : n >= 40 ? "amber" : "slate") as "green" | "amber" | "slate";
