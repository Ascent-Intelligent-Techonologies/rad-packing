export type ChatLink = { label: string; href: string };

/** What every assistant turn looks like, whether it came from Claude or the built-in engine. */
export type ChatReply = {
  message: string;
  links: ChatLink[];
  suggestions: string[];
  showLeadForm: boolean;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Pages the assistant is allowed to link to. Anything else is dropped. */
export const ALLOWED_LINKS: ChatLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products & Solutions", href: "/products" },
  { label: "Wooden Pallets", href: "/products/category/wooden-pallets" },
  { label: "Industrial Packaging", href: "/products/category/industrial-packaging" },
  { label: "On-Site & Off-Site Packaging", href: "/products/category/industrial-packaging/on-site-off-site-packaging" },
  { label: "Heat Shrink Wrapping", href: "/products/category/heat-shrink-wrapping" },
  { label: "Preservation & VCI Packaging", href: "/products/category/preservation" },
  { label: "Export Packaging", href: "/products/category/export-packaging" },
  { label: "Get a Quote", href: "/products#quote" },
  { label: "Contact", href: "/contact" },
];

export const GREETING: ChatReply = {
  message:
    "Hi! 👋 I'm the **RAD Packing** assistant. I can help with **wooden pallets**, **crates and skids**, **heat shrink wrapping**, **preservation packaging** and **export packing**. What do you need to move or store?",
  links: [],
  suggestions: [
    "Help me choose a solution",
    "What pallets do you supply?",
    "Tell me about onsite packing",
    "I want to contact you",
  ],
  showLeadForm: false,
};
