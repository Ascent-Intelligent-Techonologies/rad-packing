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
        "Pricing depends on the goods, volume, materials and destination, so our team prepares each quote individually 🧾 Tell us what you're shipping or storing and they'll come back shortly.",
      links: [L("/products#quote")],
      suggestions: ["What products do you offer?", "Tell me about onsite packing"],
      showLeadForm: true,
    },
  },
  {
    test: /\b(tailor|tailored|custom|customi[sz]ed|specific|special|bespoke|unique|my (equipment|machine|machinery|project|cargo))\b/,
    reply: {
      message:
        "Every job is different, so we customize the packaging to your goods 🛡️ I've opened a short form. Share what you need protected and our team will recommend the right approach.",
      links: [L("/products#quote")],
      suggestions: ["Tell me about onsite packing", "How do I protect machinery for sea shipping?"],
      showLeadForm: true,
    },
  },
  {
    test: /\b(on ?-?site|off ?-?site|mobile|at (our|my|your) (site|facility|factory|plant|workshop|port|premises)|come to|your team come|travel)\b/,
    reply: {
      message:
        "Yes! We offer both **on-site and off-site packaging** 🚚 Our team can pack at your **facility, workshop or port**, or we can pack your goods at our own premises.",
      links: [L("/products/category/industrial-packaging/on-site-off-site-packaging"), L("/contact")],
      suggestions: ["I want to contact you", "I need a tailored solution"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(pallets?|euro|epal|skids?|recycl\w*|pooling|rental|rent)\b/,
    reply: {
      message:
        "We supply **standard and custom-made wooden pallets**, **Euro and CP pallets**, both **new and used**, and offer **pallet recycling, pooling and rental** ♻️ We also build **heavy-duty skids** for machinery and heavy loads.",
      links: [L("/products/category/wooden-pallets"), L("/products/category/industrial-packaging"), L("/products#quote")],
      suggestions: ["I want a quote", "Do you do shrink wrapping?", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(shrink\w*|heat[- ]shrink|uv|weather\w*|dust)\b/,
    reply: {
      message:
        "Our **industrial heat shrink wrapping** covers machinery, equipment and materials in a tight wrap that protects against **weather and UV**, **dust and moisture** 🌦️ It suits transport as well as outdoor storage.",
      links: [L("/products/category/heat-shrink-wrapping"), L("/products#quote")],
      suggestions: ["Tell me about onsite packing", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(sea|ocean|marine|maritime|vessel|container|freight|shipping|ship|transit|salt|export|overseas|international|ispm|heat[- ]treated)\b/,
    reply: {
      message:
        "For export we supply **ISPM-15 heat-treated**, **export-ready wooden packaging** (crates, boxes, pallets and skids) 🚢 Inside, **VCI, vacuum and moisture barrier packaging** protect the goods through **international transit**.",
      links: [L("/products/category/export-packaging"), L("/products/category/preservation"), L("/products#quote")],
      suggestions: ["I want to contact you", "Tell me about onsite packing", "I need a tailored solution"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(vci|rust|corrosion|corrode|barrier|desiccant|moisture|humid|humidity|preserv\w*|storage|oxidation|foil|film|vacuum|vapou?r)\b/,
    reply: {
      message:
        "Our **preservation packaging** covers **VCI packaging**, **vacuum packaging** and **moisture barrier packaging** for **corrosion protection** 🛡️ VCI protects bare metal without greasy coatings, in storage and in transit.",
      links: [L("/products/category/preservation"), L("/about")],
      suggestions: ["How do I protect machinery for sea shipping?", "I need a tailored solution", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(wood|wooden|crate|crates|crating|plywood|timber|box|boxes|case|cases)\b/,
    reply: {
      message:
        "We build **wooden crates and boxes** to the size of your cargo, along with **heavy-duty skids** and **custom industrial packaging** 📦 For export they can be made **ISPM-15 heat-treated**.",
      links: [L("/products/category/industrial-packaging"), L("/products/category/export-packaging"), L("/products#quote")],
      suggestions: ["I want to contact you", "Tell me about onsite packing"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(turnkey|end[- ]to[- ]end|full service|complete|contracting|assessment|export prep\w*)\b/,
    reply: {
      message:
        "We can take on the whole job: **assessment**, **materials**, **on-site or off-site packing**, **preservation**, **crating** and **export preparation** ✅",
      links: [L("/products/category/industrial-packaging/on-site-off-site-packaging"), L("/products#quote")],
      suggestions: ["I want to contact you", "How do I protect machinery for sea shipping?"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(machinery|machines?|equipment|industrial goods|goods|materials?)\b/,
    reply: {
      message:
        "We protect **industrial goods, machinery and materials** during transportation and storage, with pallets, crates, skids, shrink wrapping and preservation packaging ✅ Tell me what you're moving and I'll point you to the right solution.",
      links: [L("/products"), L("/products#quote")],
      suggestions: ["Help me choose a solution", "I need a tailored solution", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(product|products|range|offer|offers|sell|supply|solutions?|services?|what do you (do|have))\b/,
    reply: {
      message:
        "We offer **wooden pallets**, **industrial packaging** (crates, boxes and heavy-duty skids), **heat shrink wrapping**, **preservation & VCI packaging** and **export packaging solutions** 📦 We pack **on-site or off-site**.",
      links: [L("/products"), L("/products#quote"), L("/about")],
      suggestions: ["What pallets do you supply?", "Tell me about onsite packing", "I want to contact you"],
      showLeadForm: false,
    },
  },
  {
    test: /\b(about (you|rad|the company)|who are you|who is rad|company|history|where are you|where (is|are) (rad|you)|where do you|location|located|sharjah|address|office|uae|gcc|deliver\w*|serve)\b/,
    reply: {
      message: `${site.legalName} is a **Sharjah-based industrial packaging company** providing reliable and customized packaging solutions across **${site.serviceArea}** 🏭 We specialize in wooden pallets, industrial skids, heavy-duty packaging, heat shrink wrapping and preservation packaging.`,
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
        "Hello! 👋 I can help with **wooden pallets**, **crates and skids**, **shrink wrapping**, **preservation packaging** and **export packing**. What would you like to move or store?",
      links: [L("/products")],
      suggestions: ["What pallets do you supply?", "Tell me about onsite packing", "I want to contact you"],
      showLeadForm: false,
    },
  },
];


/* ------------------------------------------------------------------ */
/* Guided flow: "Help me choose a solution"                            */
/* what it is → how it travels / is stored → a specific recommendation */
/* Every recommendation uses only what RAD's company profile lists.    */
/* ------------------------------------------------------------------ */

type Asset = { id: string; label: string; test: RegExp };
const assets: Asset[] = [
  { id: "machinery", label: "machinery & heavy equipment", test: /\b(machinery|machines?|heavy equipment|gearbox\w*|turbine\w*|generator\w*|pump\w*|compressor\w*|equipment)\b/ },
  { id: "parts", label: "metal parts & components", test: /\b(metal|spare parts?|spares|components?|bearings?|fasteners?)\b/ },
  { id: "goods", label: "palletised goods & materials", test: /\b(palleti[sz]ed|goods|cartons?|drums?|sacks?)\b/ },
];
const modes = [
  { id: "export", label: "export or sea freight", test: /\b(sea|ocean|marine|vessel|container|export|overseas|international|air|freight)\b/ },
  { id: "storage", label: "long-term storage", test: /\b(storage|store|stored|warehouse|outdoor|mothball\w*)\b/ },
  { id: "local", label: "local transport", test: /\b(local|road|truck|domestic|trucking)\b/ },
];

const parts: Record<string, Record<string, string>> = {
  machinery: {
    export: "**VCI and vacuum packaging** behind a **moisture barrier**, inside an **ISPM-15 heat-treated export crate** on a **heavy-duty skid**",
    storage: "**industrial heat shrink wrapping** for weather, UV, dust and moisture protection, with **VCI packaging** underneath for corrosion protection",
    local: "a **heavy-duty skid** or **wooden crate** sized to the machine, with **shrink wrapping** to keep dust and moisture off",
  },
  parts: {
    export: "**VCI packaging** with **vacuum or moisture barrier packaging**, packed in an **ISPM-15 heat-treated wooden box**",
    storage: "**VCI packaging** behind a **moisture barrier** for corrosion protection in storage",
    local: "**VCI packaging** in a **wooden box** on a **pallet**",
  },
  goods: {
    export: "**ISPM-15 heat-treated pallets** (standard, Euro or CP) with **shrink wrapping** for transit protection",
    storage: "**wooden pallets** with **heat shrink wrapping** against dust and moisture",
    local: "**standard or custom-made wooden pallets**, new or used, with **pallet pooling or rental** if the flow is regular",
  },
};

const assetQuestion: ChatReply = {
  message: "Happy to help you choose 🛡️ **What do you need to pack?**",
  links: [],
  suggestions: ["Machinery & heavy equipment", "Metal parts & components", "Palletised goods & materials"],
  showLeadForm: false,
};

function modeQuestion(assetLabel: string): ChatReply {
  return {
    message: `Got it: **${assetLabel}**. **How will it travel or be stored?**`,
    links: [],
    suggestions: ["Export or sea freight", "Long-term storage", "Local transport"],
    showLeadForm: false,
  };
}

function recommendation(asset: Asset, mode: (typeof modes)[number]): ChatReply {
  return {
    message: `For **${asset.label}** and **${mode.label}**, we'd recommend ${parts[asset.id][mode.id]} ✅ Our team will confirm the exact specification for your goods.`,
    links: [L("/products"), L("/products#quote")],
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
