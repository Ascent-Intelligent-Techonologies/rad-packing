"use client";

import { Sparkles } from "lucide-react";

/** Opens the chat widget, optionally with a first question already sent. */
export function openChat(prompt?: string) {
  window.dispatchEvent(new CustomEvent("rad:chat-open", { detail: prompt }));
}

export function OpenChatButton({
  prompt,
  className = "btn btn-glass",
  children,
}: {
  prompt?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" className={className} onClick={() => openChat(prompt)}>
      {children ?? (
        <>
          <Sparkles size={17} /> Chat with AI
        </>
      )}
    </button>
  );
}
