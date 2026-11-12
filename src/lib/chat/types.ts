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
  { label: "Preservation Packing", href: "/products/category/preservation" },
  { label: "Nail-Less Boxes", href: "/products/category/nailless-boxes" },
  { label: "Wooden Packaging", href: "/products/category/wooden" },
  { label: "Traditional Packaging", href: "/products/category/traditional" },
  { label: "Turnkey Contracting", href: "/products/category/turnkey" },
  { label: "Get a Quote", href: "/products#quote" },
  { label: "Contact", href: "/contact" },
];

export const GREETING: ChatReply = {
  message:
    "Hi! 👋 I'm the **RAD Packing** assistant. I can help with **preservation packaging**, **export crates**, **onsite packing** and more. What are you looking to protect?",
  links: [],
  suggestions: [
    "Help me choose a solution",
    "How do I protect machinery for sea shipping?",
    "Tell me about onsite packing",
    "I want to contact you",
  ],
  showLeadForm: false,
};
