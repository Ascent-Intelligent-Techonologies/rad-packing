import { site } from "@/lib/site";
import { ALLOWED_LINKS, type ChatReply } from "./types";

/* ------------------------------------------------------------------ */
/* Structured chatbot: keyword intents map to curated answers, page    */
/* links and quick replies. No AI model, no external service.          */
/* ------------------------------------------------------------------ */

const allowed = new Map(ALLOWED_LINKS.map((l) => [l.href, l]));
const L = (href: string) => allowed.get(href)!;
const phones = site.phones.map((p) => p.label).join(" or ");

type Intent = {
  test: RegExp;
  reply: ChatReply;
};

const intents: Intent[] = [
  {
    test: /\b(contact|call|phone|number|reach|speak|talk|get in touch|call ?back|whatsapp|email|human|team|representative|sales)\b/,
    reply: {
      message: `Happy to connect you with our team 📞 I've opened a short form below. You can also call **${phones}** for anything urgent.`,
      links: [L("/contact")],
      suggestions: ["Tell me about onsite packing", "What products do you offer?"],
      showLeadForm: true,
    },
  },
  {
    test: /\b(quote|quotation|price|pricing|cost|how much|rate|estimate|budget)\b/,
    reply: {
      message:
        "Pricing depends on the asset, volume, materials and destination, so our team prepares each quote individually 🧾 Tell us what you're shipping or storing and they'll come back shortly.",
      links: [L("/products#quote")],
      suggestions: ["What products do you offer?", "Tell me about onsite packing"],
      showLeadForm: true,
    },
  },
  {
    test: /\b(tailor|tailored|custom|customi[sz]ed|specific|special|bespoke|unique|my (equipment|machine|machinery|project|cargo))\b/,
    reply: {
      message:
        "Every asset is different, so we engineer solutions around yours 🛡️ I've opened a short form. Share what you need protected and a RAD specialist will recommend the right approach.",
      links: [L("/products#quote")],
      suggestions: ["Tell me about onsite packing", "How do I protect machinery for sea shipping?"],
      showLeadForm: true,
    },
  },
  {
    test: /\b(on ?-?site|mobile|at (our|my) (site|facility|factory|plant|workshop|port)|come to|your team come|travel)\b/,
    reply: {
      message:
        "Yes! Our **onsite & mobile packing** teams come directly to your **facility, workshop or port** to preserve machinery on location 🚚 No need to move equipment before it's protected.",
      links: [L("/products/category/turnkey"), L("/products"), L("/contact")],
      suggestions: ["I want to contact you", "I need a tailored solution"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(sea|ocean|marine|maritime|vessel|container|freight|shipping|ship|transit|salt|export|overseas|international)\b/,
    reply: {
      message:
        "For sea shipping we use **heavy-duty barrier bags**, **desiccant integration** and **vacuum-sealed crating** against moisture, corrosion and salt air 🚢 We add **VCI films**, **wooden packaging** and custom protective packaging for rough ocean freight and long transit.",
      links: [L("/products"), L("/products/category/preservation"), L("/products/category/wooden")],
      suggestions: ["I want to contact you", "Tell me about onsite packing", "I need a tailored solution"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(vci|rust|corrosion|corrode|barrier|desiccant|moisture|humid|humidity|preserv\w*|storage|oxidation|foil|film|vapou?r)\b/,
    reply: {
      message:
        "Our **preservation packing** combines **VCI (Volatile Corrosion Inhibitor) films**, **high-barrier foils** and **desiccants** to stop rust and moisture damage before it starts 🛡️ VCI shields bare metal without greasy coatings, ideal for long-term storage and transit.",
      links: [L("/products/category/preservation"), L("/about")],
      suggestions: ["How do I protect machinery for sea shipping?", "I need a tailored solution", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(wood|wooden|crate|crates|crating|plywood|pallet|pallets|timber|box|boxes|nail|nailless|ispm|collapsible|case|cases)\b/,
    reply: {
      message:
        "We build **export crates**, **plywood boxes**, **timber cases** and **industrial pallets** to export standards 📦 Our **nail-less collapsible boxes** use E1-grade plywood (6, 9 or 12 mm) with galvanized steel strips, hinges and buckles. Eco-conscious options comply with regulations like **ISPM 15**.",
      links: [L("/products/category/nailless-boxes"), L("/products/category/wooden"), L("/products#quote")],
      suggestions: ["I want to contact you", "Tell me about onsite packing"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(turnkey|end[- ]to[- ]end|full service|complete|contracting|assessment|export prep\w*)\b/,
    reply: {
      message:
        "Our **turnkey contracting** covers everything: **site assessment**, planning, **material supply**, **on-site packing and preservation**, crating and **export preparation** ✅ One accountable partner from start to shipment-ready.",
      links: [L("/products/category/turnkey"), L("/products#quote")],
      suggestions: ["I want to contact you", "How do I protect machinery for sea shipping?"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(electronic\w*|esd|static|circuit|pharma\w*|healthcare|medical|drug|aerospace|aviation|aircraft|jet|automotive|engineering|industr(y|ies)|sector|machinery|equipment|gearbox)\b/,
    reply: {
      message:
        "We protect assets across **aerospace, automotive & engineering**, **heavy machinery**, **electronics** (ESD shielding), **pharmaceuticals & healthcare** and **shipping & maritime** ✅ Tell me your industry and I'll point you to the right solution.",
      links: [L("/products"), L("/about")],
      suggestions: ["How do I protect machinery for sea shipping?", "I need a tailored solution", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(product|products|range|offer|offers|sell|supply|solutions?|services?|what do you (do|have))\b/,
    reply: {
      message:
        "We offer **preservation packing**, **nail-less collapsible boxes**, **wooden packaging**, **traditional packaging** and **industrial packing turnkey contracting** 📦 Plus **onsite & mobile packing** teams that work at your facility or port.",
      links: [L("/products"), L("/products#quote"), L("/about")],
      suggestions: ["Tell me about onsite packing", "I need a tailored solution", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(about (you|rad|the company)|who are you|who is rad|company|experience|years|history|where are you|where (is|are) (rad|you)|location|located|sharjah|address|office)\b/,
    reply: {
      message: `RAD Packing Solutions is a specialist in **industrial packaging and preservation** with **over 25 years** of expertise, based in **${site.location}** 🏭 We protect valuable assets from corrosion, moisture and environmental damage during storage, handling and transport.`,
      links: [L("/about"), L("/products"), L("/contact")],
      suggestions: ["What products do you offer?", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(thanks|thank you|thx|great|perfect|awesome|ok(ay)?|cool)\b/,
    reply: {
      message: "You're welcome! 😊 Anything else I can help with, or would you like our team to follow up?",
      links: [],
      suggestions: ["I want to contact you", "What products do you offer?"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(hi|hello|hey|salam|salaam|marhaba|good (morning|afternoon|evening)|assalam\w*)\b/,
    reply: {
      message:
        "Hello! 👋 I can help with **preservation packaging**, **export crates**, **onsite packing** and more. What would you like to protect or ship?",
      links: [L("/products")],
      suggestions: ["How do I protect machinery for sea shipping?", "Tell me about onsite packing", "I want to contact you"],
      showLeadForm: false,
    },
  },
];


/* ------------------------------------------------------------------ */
/* Guided flow: "Help me choose a solution"                            */
/* asset type → how it travels / is stored → a specific recommendation */
/* ------------------------------------------------------------------ */

type Asset = { id: string; label: string; test: RegExp };
const assets: Asset[] = [
  { id: "machinery", label: "machinery & heavy equipment", test: /\b(machinery|heavy equipment|gearbox\w*|turbine\w*|generator\w*|pump\w*|compressor\w*|equipment)\b/ },
  { id: "electronics", label: "electronics & circuit boards", test: /\b(electronic\w*|circuit\w*|esd|pcb|controls?|automation)\b/ },
  { id: "aerospace", label: "aerospace & automotive parts", test: /\b(aerospace|aviation|aircraft|jet|avionics|automotive|engine parts?|landing gear)\b/ },
  { id: "pharma", label: "pharma & healthcare products", test: /\b(pharma\w*|healthcare|medical|drugs?|diagnostics?)\b/ },
];
const modes = [
  { id: "sea", label: "sea freight", test: /\b(sea|ocean|marine|vessel|container|sea freight)\b/ },
  { id: "air", label: "air freight", test: /\b(air|air freight|airfreight|flight)\b/ },
  { id: "storage", label: "long-term storage", test: /\b(storage|store|stored|warehouse|outdoor|mothball\w*)\b/ },
  { id: "local", label: "local transport", test: /\b(local|road|truck|domestic|trucking)\b/ },
];

const parts: Record<string, Record<string, string>> = {
  machinery: {
    sea: "**VCI films** and **vacuum-sealed barrier bags** with **desiccants**, inside an **export crate** built to export standards (ISPM 15 options)",
    air: "**VCI films** with **desiccant integration** and a light, strong **plywood box** to keep weight down",
    storage: "**heavy-duty VCI films**, **vacuum-sealed crating** and **desiccants** for long-term outdoor or warehouse storage",
    local: "**VCI wrapping** with **corrugated or plywood protection**, **pallets** and **strapping** for load stability",
  },
  electronics: {
    sea: "**ESD shielding** with **vapor-barrier films** and **desiccants**, in a cushioned **plywood box**",
    air: "**ESD barrier pouches** with **desiccants** and **protective foam** inside a strong outer carton",
    storage: "**ESD shielding** with **high-barrier foil bags** and **desiccants** to stop micro-corrosion and dust",
    local: "**ESD-safe barrier pouches** with **protective foam** and **corrugated cartons**",
  },
  aerospace: {
    sea: "**high-barrier foil bags**, **custom 3D liners** and **specialized desiccants**, inside an **export crate**",
    air: "**high-barrier foil bags** and **custom 3D liners** with **specialized desiccants** to handle pressure and humidity shifts",
    storage: "**high-barrier foil bags**, **3D liners** and **desiccants** for long-term preservation",
    local: "**custom 3D liners** with **barrier foil** and **protective foam**",
  },
  pharma: {
    sea: "**cleanroom-compatible barrier pouches** and **temperature-stable packaging** in a protective outer case",
    air: "**cleanroom-compatible barrier pouches** with **temperature-stable packaging** that protect against light, oxygen and moisture",
    storage: "**cleanroom-compatible barrier pouches** that maintain sterile barriers against light, oxygen and moisture",
    local: "**barrier pouches** with **temperature-stable packaging** and **corrugated cartons**",
  },
};

const assetQuestion: ChatReply = {
  message: "Happy to help you choose 🛡️ **What are you protecting?**",
  links: [],
  suggestions: ["Machinery & heavy equipment", "Electronics & circuit boards", "Aerospace & automotive parts", "Pharma & healthcare products"],
  showLeadForm: false,
};

function modeQuestion(assetLabel: string): ChatReply {
  return {
    message: `Got it: **${assetLabel}**. **How will it travel or be stored?**`,
    links: [],
    suggestions: ["Sea freight", "Air freight", "Long-term storage", "Local transport"],
    showLeadForm: false,
  };
}

function recommendation(asset: Asset, mode: (typeof modes)[number]): ChatReply {
  return {
    message: `For **${asset.label}** going by **${mode.label}**, we'd recommend ${parts[asset.id][mode.id]} ✅ Our team will tailor the exact specification to your asset.`,
    links: [L("/products/category/preservation"), L("/products#quote")],
    suggestions: ["I need a tailored solution", "Tell me about onsite packing", "I want to contact you"],
    showLeadForm: false,
  };
}

/** Returns a guided-flow reply when the visitor is in (or starting) the "choose a solution" flow. */
function guided(text: string, history: string[]): ChatReply | null {
  const t = text.toLowerCase();
  if (/\b(choose|recommend\w*|which (packaging|solution)|help me (pick|choose|find|decide)|find the right|not sure what)\b/.test(t)) {
    return assetQuestion;
  }
  const short = t.length <= 40;
  const asset = assets.find((a) => a.test.test(t));
  const mode = modes.find((m) => m.test.test(t));

  // answered the "how will it travel" question after choosing an asset earlier
  if (short && mode && !asset) {
    const past = history.map((h) => h.toLowerCase()).reverse();
    for (const h of past) {
      const a = assets.find((x) => x.test.test(h));
      if (a) return recommendation(a, mode);
    }
    return null;
  }
  // picked an asset chip: ask the next question (or recommend if the mode is in the same message)
  if (short && asset) return mode ? recommendation(asset, mode) : modeQuestion(asset.label);
  return null;
}

const fallback: ChatReply = {
  message: `Good question. I want you to get an accurate answer, so let me connect you with our team 🛡️ I've opened a short form, or call **${phones}**.`,
  links: [L("/products"), L("/contact")],
  suggestions: ["What products do you offer?", "Tell me about onsite packing"],
  showLeadForm: true,
};

export function fallbackReply(text: string, history: string[] = []): ChatReply {
  const g = guided(text, history);
  if (g) return g;
  const t = text.toLowerCase();
  for (const { test, reply } of intents) {
    if (test.test(t)) return reply;
  }
  return fallback;
}
