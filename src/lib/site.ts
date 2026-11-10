/**
 * Single source of truth for the RAD Packing website content.
 * Copy is taken from the current radpacking.com so nothing is invented.
 */

export const site = {
  name: "RAD Packing Solutions",
  legalName: "RAD Packing LLC",
  tagline: "Industrial Preservation Solutions",
  url: "https://www.radpacking.com",
  phones: [
    { label: "+971 6 579 2505", tel: "+97165792505", kind: "Office" },
    { label: "+971 58 531 2077", tel: "+971585312077", kind: "Mobile" },
  ],
  whatsapp: "971585312077",
  location: "Sharjah, United Arab Emirates",
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
  | "package";

export type Product = {
  slug: string;
  title: string;
  short: string;
  description: string;
  highlights: string[];
  icon: ProductIcon;
};

/** The five product & solution lines on radpacking.com/services-4-1 */
export const products: Product[] = [
  {
    slug: "preservation",
    title: "Preservation Packing Solutions",
    short: "Barrier materials, corrosion inhibitors and desiccants engineered to stop degradation before it starts.",
    description:
      "Specialized industrial preservation packaging that protects valuable machinery, equipment, components and materials against corrosion, moisture, humidity, dust and environmental deterioration. Advanced barrier materials, corrosion-inhibiting technologies, desiccants and customized packaging systems maintain asset integrity and extend product lifespan during storage, handling and transportation.",
    highlights: [
      "High-barrier foils & films",
      "VCI corrosion protection",
      "Desiccant integration",
      "Custom 3D liners",
    ],
    icon: "shield",
  },
  {
    slug: "nailless-boxes",
    title: "Nail-Less Collapsible Boxes",
    short: "Plywood boxes secured with galvanized steel strips, hinges and buckles. No nails, no splinters.",
    description:
      "Typically constructed from high-quality plywood, including E1-grade options, in 6 mm, 9 mm and 12 mm thicknesses. Reinforced and secured with corrosion-resistant galvanized steel strips, hinges and fastening buckles for enhanced strength and durability.",
    highlights: [
      "E1-grade plywood options",
      "6 mm · 9 mm · 12 mm",
      "Galvanized steel strips",
      "Hinges & fastening buckles",
    ],
    icon: "box",
  },
  {
    slug: "wooden",
    title: "Wooden Packaging",
    short: "Export crates, plywood boxes, timber cases and industrial pallets for heavy and high-value cargo.",
    description:
      "Durable, customized wooden packaging including export crates, plywood boxes, timber cases and industrial pallets, engineered to protect heavy machinery, equipment and valuable components during handling, storage and international transportation. Designed for strength, stability and cargo security, meeting diverse industrial requirements and export packaging standards.",
    highlights: [
      "Export crates",
      "Timber cases",
      "Industrial pallets",
      "Export-standard builds",
    ],
    icon: "package",
  },
  {
    slug: "traditional",
    title: "Traditional Packaging",
    short: "Crates, cartons, pallets, stretch film, foams and strapping. The everyday essentials, supplied reliably.",
    description:
      "A comprehensive range of conventional industrial packaging materials, including wooden crates, plywood boxes, corrugated cartons, pallets, stretch films, protective foams and strapping materials. Designed to provide structural support, cushioning, load stability and reliable protection for goods during handling, storage and transportation.",
    highlights: [
      "Corrugated cartons",
      "Stretch film & strapping",
      "Protective foams",
      "Pallets & plywood boxes",
    ],
    icon: "layers",
  },
  {
    slug: "turnkey",
    title: "Industrial Packing Turnkey Contracting",
    short: "End-to-end: site assessment, materials, on-site packing, crating and export preparation.",
    description:
      "End-to-end industrial packing services, from site assessment, planning and material supply to on-site packing, preservation, crating and export preparation. Complete, customized packaging solutions that ensure asset protection, operational efficiency and shipment readiness.",
    highlights: [
      "Site assessment & planning",
      "On-site packing teams",
      "Crating & export prep",
      "One accountable partner",
    ],
    icon: "truck",
  },
];

/** The four "What We Do" services from the RAD home page */
export const services = [
  {
    title: "Industrial Preservation Supply",
    body: "Heavy-duty barrier bags, desiccant integration and vacuum-sealed crating for long-term outdoor or warehouse storage.",
    icon: "shield" as ProductIcon,
    interest: "preservation",
  },
  {
    title: "Custom Barrier Pouches & Roll Stock",
    body: "Flexible, multi-layer solutions designed for electronics, pharmaceuticals and critical spares.",
    icon: "layers" as ProductIcon,
    interest: "preservation",
  },
  {
    title: "Sustainable Protection Supply",
    body: "High-performance materials that reduce waste, feature recyclable or eco-conscious builds, and comply with global shipping regulations like ISPM 15.",
    icon: "leaf" as ProductIcon,
    interest: "wooden",
  },
  {
    title: "Onsite & Mobile Packing",
    body: "Specialized teams that come directly to your facility, workshop or port to preserve machinery on location.",
    icon: "truck" as ProductIcon,
    interest: "turnkey",
  },
];

export type Industry = {
  id: string;
  title: string;
  short: string;
  body: string;
};

export const industries: Industry[] = [
  {
    id: "aerospace",
    title: "Aerospace, Automotive & Engineering",
    short: "Aerospace · Automotive · Engineering",
    body: "High-barrier foil bags, custom 3D liners and specialized desiccants engineered to meet rigorous aviation standards, protecting jet engine components, landing gear and avionics from atmospheric pressure shifts and humidity. The same rigor applies to automotive and engineering standards.",
  },
  {
    id: "heavy-machinery",
    title: "Heavy Machinery & Industrial Equipment",
    short: "Multi-ton equipment & spares",
    body: "Heavy-duty Volatile Corrosion Inhibitor (VCI) films and ruggedized vacuum packaging designed to safeguard multi-ton equipment, gearboxes and spare parts during long-term outdoor storage or rough ocean freight.",
  },
  {
    id: "electronics",
    title: "Electronics & High-Tech Components",
    short: "ESD shielding & vapor barrier",
    body: "ESD (Electrostatic Discharge) shielding combined with vapor-barrier films to prevent micro-corrosion, dust contamination and static shock on sensitive circuit boards, medical equipment and automation controls.",
  },
  {
    id: "pharma",
    title: "Pharmaceuticals & Healthcare Logistics",
    short: "Cleanroom-compatible barriers",
    body: "Cleanroom-compatible barrier pouches and temperature-stable packaging solutions that maintain sterile barriers and protect life-saving drugs and delicate diagnostics from light, oxygen and moisture.",
  },
  {
    id: "maritime",
    title: "Shipping, Maritime & Logistics",
    short: "Salt air, humidity, rough freight",
    body: "Protective packaging and industrial preservation solutions for shipping lines, freight forwarders, cargo handlers and logistics operators, safeguarding cargo, marine equipment and critical components against moisture, corrosion, salt air and environmental exposure.",
  },
];

/** Turnkey flow, taken from the turnkey-contracting description */
export const process = [
  {
    title: "Assess",
    body: "We inspect your assets and site, then plan the protection each one needs.",
  },
  {
    title: "Supply",
    body: "Barrier films, VCI, desiccants, crates and boxes, specified to the asset.",
  },
  {
    title: "Preserve & Pack",
    body: "Our on-site teams wrap, seal and pack at your facility, workshop or port.",
  },
  {
    title: "Crate",
    body: "Custom crating built for strength, stability and cargo security.",
  },
  {
    title: "Export-ready",
    body: "Documentation-ready, export-standard packing so shipments leave ready to move.",
  },
];

export const whyRad = [
  {
    title: "Zero Rust. Zero Failures.",
    body: "Active molecular protection that shields bare metals without greasy coatings.",
  },
  {
    title: "Engineered to the asset",
    body: "Tailor-fitted packaging that absorbs shock and prevents movement, never one-size-fits-all.",
  },
  {
    title: "We come to you",
    body: "Onsite and mobile teams preserve machinery where it stands: facility, workshop or port.",
  },
  {
    title: "25+ years of expertise",
    body: "A specialist in industrial packaging and preservation for valuable assets and sensitive components.",
  },
];

export const faqs = [
  {
    q: "What is preservation packaging and how is it different from normal packaging?",
    a: "Standard packaging simply covers a product. Preservation packaging protects its integrity: barrier foils, VCI technology and desiccants control moisture, oxygen and static so assets arrive, or sit in storage, in exact factory condition.",
  },
  {
    q: "Can you pack our machinery at our own site?",
    a: "Yes. Our onsite and mobile packing teams come directly to your facility, workshop or port to preserve machinery on location.",
  },
  {
    q: "Do you supply wooden packaging that meets export rules?",
    a: "We build export crates, plywood boxes, timber cases and pallets to export packaging standards, and offer materials that comply with global shipping regulations like ISPM 15.",
  },
  {
    q: "How do I get a quote?",
    a: "Use the quote form, chat with our smart assistant, or call us on +971 6 579 2505 / +971 58 531 2077. Tell us what you are shipping or storing and we will recommend the right solution.",
  },
  {
    q: "Which industries do you support?",
    a: "Aerospace, automotive and engineering; heavy machinery; electronics and high-tech; pharmaceuticals and healthcare logistics; and shipping, maritime and logistics.",
  },
];
