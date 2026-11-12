/**
 * Renders the plain-text description staff type in the admin:
 *   blank line  -> new paragraph
 *   "- item"    -> bullet list
 *   **bold**    -> bold
 * Everything else is escaped by React, so nothing typed there can become markup.
 */
function Inline({ text }: { text: string }) {
  // with one capture group, split() puts the bold contents at the odd indexes
  const parts = text.split(/\*\*([\s\S]+?)\*\*/);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

export function RichText({ text, className = "" }: { text: string | null | undefined; className?: string }) {
  if (!text?.trim()) return null;
  const blocks = text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/);
  return (
    <div className={`space-y-4 text-[17px] leading-relaxed text-text/85 ${className}`}>
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length && lines.every((l) => /^[-•*]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-brand">
              {lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l.replace(/^[-•*]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            <Inline text={lines.join("\n")} />
          </p>
        );
      })}
    </div>
  );
}
