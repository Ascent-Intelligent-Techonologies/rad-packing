/**
 * Single source of truth for the RAD Packing website content.
 * Company facts and the five product lines follow RAD's own company profile ("Company Introduction &
 * Website Content"); the remaining copy is taken from the current radpacking.com. Nothing is invented.
 */

export const site = {
  name: "RAD Packing Solutions",
  legalName: "RAD Packing Solutions L.L.C",
  tagline: "Industrial Preservation Solutions",
  url: "https://www.radpacking.com",
  phones: [
    { label: "+971 6 579 2505", tel: "+97165792505", kind: "Office" },
    { label: "+971 58 531 2077", tel: "+971585312077", kind: "Mobile" },
  ],
  whatsapp: "971585312077",
  location: "Sharjah, United Arab Emirates",
  /** where RAD supplies, as stated in the company profile */
  serviceArea: "the UAE and GCC",
  copyrightYear: 2026,
} as const;

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Contact", href: "/contact" },
] as const;

export type ProductIcon =
  | "shield"
  | "box"
  | "layers"
  | "truck"
  | "leaf"
  | "wrench"
  | "package"
  | "wrap";

export type Product = {
  slug: string;
  title: string;
  short: string;
  description: string;
  highlights: string[];
  icon: ProductIcon;
};

/**
 * The five product & service lines, in the order and wording of RAD's company profile.
 * The slugs are also the top-level catalogue categories (/products/category/<slug>).
 */
export const products: Product[] = [
  {
    slug: "wooden-pallets",
    title: "Wooden Pallets",
    short: "Standard, custom-made, Euro and CP pallets, new or used, with recycling, pooling and rental.",
    description:
      "Wooden pallets for storage, handling and transport: standard and custom-made sizes, Euro and CP pallets, supplied new or used. We also take pallets back for recycling and run pooling and rental for recurring flows.",
    highlights: [
      "Standard & custom-made wooden pallets",
      "Euro & CP pallets",
      "New & used pallets",
      "Pallet recycling, pooling & rental",
    ],
    icon: "layers",
  },
  {
    slug: "industrial-packaging",
    title: "Industrial Packaging",
    short: "Wooden crates and boxes, heavy-duty skids and custom packaging, packed on-site or off-site.",
    description:
      "Durable, customized packaging that protects industrial goods, machinery and materials during transportation and storage: wooden crates and boxes, heavy-duty skids and made-to-measure packaging, with packing carried out on-site at your premises or off-site at ours.",
    highlights: [
      "Wooden crates & boxes",
      "Heavy-duty skids",
      "On-site & off-site packaging",
      "Custom industrial packaging",
    ],
    icon: "package",
  },
  {
    slug: "heat-shrink-wrapping",
    title: "Heat Shrink Wrapping",
    short: "Industrial shrink wrapping that shields equipment from weather, UV, dust and moisture.",
    description:
      "Industrial shrink wrapping for machinery, equipment and materials in transport or storage. The heat-shrunk cover fits tightly around the load and protects it from weather and UV, dust and moisture.",
    highlights: [
      "Industrial shrink wrapping",
      "Weather & UV protection",
      "Dust & moisture protection",
    ],
    icon: "wrap",
  },
  {
    slug: "preservation",
    title: "Preservation & VCI Packaging",
    short: "VCI, vacuum and moisture barrier packaging that stops corrosion before it starts.",
    description:
      "Specialized industrial preservation packaging that protects valuable machinery, equipment, components and materials against corrosion, moisture, humidity, dust and environmental deterioration. VCI packaging, vacuum packaging, moisture barrier materials and desiccants maintain asset integrity and extend product lifespan during storage, handling and transportation.",
    highlights: [
      "VCI packaging solutions",
      "Vacuum packaging",
      "Moisture barrier packaging",
      "Corrosion protection",
    ],
    icon: "shield",
  },
  {
    slug: "export-packaging",
    title: "Export Packaging Solutions",
    short: "ISPM-15 heat-treated, export-ready wooden packaging that protects cargo in international transit.",
    description:
      "Export packaging built for the journey: ISPM-15 heat-treated timber, export-ready wooden crates, cases, pallets and skids, and protection against the handling, humidity and salt air of international transit.",
    highlights: [
      "ISPM-15 heat-treated packaging",
      "Export-ready wooden packaging",
      "International transit protection",
    ],
    icon: "truck",
  },
];

/**
 * Sectors offered in the optional "Industry" field of the enquiry forms. They only help the team
 * sort enquiries; they are not a statement about who RAD supplies.
 */
export const industries = [
  { id: "manufacturing", title: "Manufacturing & Engineering" },
  { id: "heavy-machinery", title: "Heavy Machinery & Industrial Equipment" },
  { id: "energy", title: "Oil, Gas & Energy" },
  { id: "construction", title: "Construction & Building Materials" },
  { id: "logistics", title: "Logistics, Shipping & Freight" },
  { id: "trading", title: "Trading & Distribution" },
];

/** How an on-site or off-site packing job runs, from first look to export-ready. */
export const process = [
  {
    title: "Assess",
    body: "We look at your goods and your site, then plan the packaging each item needs.",
  },
  {
    title: "Supply",
    body: "Pallets, skids, crates and boxes, VCI and barrier materials, matched to the goods.",
  },
  {
    title: "Preserve & Pack",
    body: "We wrap, seal and pack on-site at your premises or off-site at ours.",
  },
  {
    title: "Crate",
    body: "Custom crating and skids built for strength, stability and cargo security.",
  },
  {
    title: "Export-ready",
    body: "ISPM-15 heat-treated, export-ready packing so shipments leave ready to move.",
  },
];

/** The points RAD's company profile makes about itself. */
export const whyRad = [
  {
    title: "Quality & durability",
    body: "Packaging built to protect industrial goods, machinery and materials through transportation and storage.",
  },
  {
    title: "Customized to your goods",
    body: "Standard sizes where they fit, custom-made packaging where they do not.",
  },
  {
    title: "On-site or off-site",
    body: "We pack at your facility or at ours, whichever suits the job.",
  },
  {
    title: "Dependable & cost-effective",
    body: "Solutions sized to your industrial and export requirements, across the UAE and GCC.",
  },
];

export const faqs = [
  {
    q: "What is preservation packaging and how is it different from normal packaging?",
    a: "Standard packaging simply covers a product. Preservation packaging protects its condition: VCI, vacuum and moisture barrier packaging keep corrosion and moisture away, so goods arrive, or sit in storage, as they left your facility.",
  },
  {
    q: "Can you pack our machinery at our own site?",
    a: "Yes. We offer both on-site and off-site packaging: our teams come to your facility, workshop or port to pack machinery on location, or we pack it at our own premises.",
  },
  {
    q: "Do you supply wooden packaging that meets export rules?",
    a: "Yes. We supply ISPM-15 heat-treated packaging and export-ready wooden crates, boxes, cases, pallets and skids, built to protect cargo in international transit.",
  },
  {
    q: "What kinds of pallets do you supply?",
    a: "Standard and custom-made wooden pallets, Euro and CP pallets, new and used. We also offer pallet recycling, pooling and rental.",
  },
  {
    q: "Do you do heat shrink wrapping?",
    a: "Yes. Our industrial shrink wrapping covers machinery, equipment and materials for transport or storage and protects them from weather and UV, dust and moisture.",
  },
  {
    q: "Where do you supply?",
    a: "We are based in Sharjah and provide packaging solutions across the UAE and GCC.",
  },
  {
    q: "How do I get a quote?",
    a: "Use the quote form, chat with our smart assistant, or call us on +971 6 579 2505 / +971 58 531 2077. Tell us what you are shipping or storing and we will recommend the right solution.",
  },
];
