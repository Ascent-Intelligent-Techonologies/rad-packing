import { site } from "@/lib/site";

/**
 * Wording of the home page, taken as it stands from RAD's original landing page (radpacking.com),
 * line breaks included. Each inner array is one block of text; its strings are the lines the
 * original breaks it into by hand, which the page only honours on wide screens.
 *
 * The photos in `public/home` are look-alikes of the original's, not copies: most of the original's
 * were stock-library pictures licensed only for the site builder that hosts it. See `homePhotoCredits`.
 */

/** The original prints the numbers with the last two groups run together. */
export const classicPhones = site.phones.map((p) => ({
  tel: p.tel,
  label: p.label.replace(/(\d{3}) (\d{4})$/, "$1$2"),
}));

export type WhatWeDoIcon = "gear" | "lock" | "ecoBox" | "truck";

/**
 * `titleWidth`, `bodyWidth`, `bodyTop` and `linkTop` are the original card's own measurements, in px.
 * `nudge` is how far the original sets the icon, title, text and link off the card's centre line.
 */
export const whatWeDo: {
  icon: WhatWeDoIcon;
  iconTop: number;
  title: string;
  titleWidth: number;
  body: string[];
  bodyWidth: number;
  bodyTop: number;
  linkTop: number;
  nudge: [icon: number, title: number, body: number, link: number];
}[] = [
  {
    icon: "gear",
    iconTop: 65,
    title: "Industrial Preservation Supply",
    titleWidth: 239,
    body: [
      "Heavy-duty barrier bags, desiccant",
      "integration, and vacuum-sealed crating for long-term outdoor or warehouse",
      "storage.",
    ],
    bodyWidth: 170,
    bodyTop: 262,
    linkTop: 482,
    nudge: [0, 10, -9, -10],
  },
  {
    icon: "lock",
    iconTop: 65,
    title: "Custom Barrier Pouches & Roll Stock",
    titleWidth: 182,
    body: ["Flexible, multi-layer solutions", "designed for electronics, pharmaceuticals, and critical spares."],
    bodyWidth: 175,
    bodyTop: 279,
    linkTop: 477,
    nudge: [-1, 8, 8, 7],
  },
  {
    icon: "ecoBox",
    iconTop: 78,
    title: "Sustainable Protection Supply",
    titleWidth: 222,
    body: [
      "High-performance materials that reduce waste,",
      "feature recyclable or eco-conscious builds, and comply with global shipping",
      "regulations like ISPM 15.",
    ],
    bodyWidth: 200,
    bodyTop: 270,
    linkTop: 477,
    nudge: [8, 8, 20, 0],
  },
  {
    icon: "truck",
    iconTop: 78,
    title: "Onsite & Mobile Packing",
    titleWidth: 177,
    body: ["Specialized teams that come directly to your", "facility, workshop, or port to preserve machinery on location."],
    bodyWidth: 183,
    bodyTop: 281,
    linkTop: 483,
    nudge: [0, 0, 0, 0],
  },
];

export const industriesWeSupport: {
  image: string;
  alt: string;
  /** the heading, one string per line of the original */
  title: string[];
  /** the fourth heading is set a little smaller on the original page */
  small?: boolean;
  body: string[];
  /** width of the text under the photo on the original page, in px */
  width: number;
}[] = [
  {
    image: "/home/jet-engine.webp",
    alt: "Jet engine fan, close up",
    title: ["Aerospace", "Automotive, &", "Engineering"],
    body: [
      "High-barrier foil bags, custom 3D liners, and specialized desiccants engineered to meet rigorous aviation standards,",
      "protecting jet engine components, landing gear, and avionics from",
      "atmospheric pressure shifts and humidity. In the same way as it complies to automotive & engineering standards.",
    ],
    width: 196,
  },
  {
    image: "/home/machinery.webp",
    alt: "Row of blue industrial machines",
    title: ["Heavy", "Machinery &", "Industrial", "Equipment"],
    body: [
      "Heavy-duty Volatile Corrosion",
      "Inhibitor (VCI) films and ruggedized vacuum packaging designed to safeguard",
      "multi-ton equipment, gearboxes, and spare parts during long-term outdoor",
      "storage or rough ocean freight.",
    ],
    width: 182,
  },
  {
    image: "/home/warehouse-aisle.webp",
    alt: "Warehouse aisle with racking",
    title: ["Electronics &", "High-Tech", "Components"],
    body: [
      "ESD (Electrostatic Discharge)",
      "shielding combined with vapor-barrier films to prevent micro-corrosion, dust",
      "contamination, and static shock on sensitive circuit boards, medical",
      "equipment, and automation controls.",
    ],
    width: 182,
  },
  {
    image: "/home/lab-tubes.webp",
    alt: "Pipette filling laboratory test tubes",
    title: ["Pharmaceuticals", "& Healthcare", "Logistics"],
    small: true,
    body: [
      "Cleanroom-compatible barrier",
      "pouches and temperature-stable packaging solutions that maintain sterile",
      "barriers and protect life-saving drugs and delicate diagnostics from light,",
      "oxygen, and moisture.",
    ],
    width: 177,
  },
  {
    image: "/home/container-ship.webp",
    alt: "Container ship at sea",
    title: ["Shipping,", "Maritime &", "Logistics"],
    body: [
      "Protective packaging and industrial preservation solutions for shipping lines, freight forwarders, cargo handlers, and logistics operators, safeguarding cargo, marine equipment, and critical components against moisture, corrosion, salt air, and environmental exposure.",
    ],
    width: 196,
  },
];

/**
 * Where the home page photos come from. Unsplash and Pexels photos are free to use and need no
 * credit; they are credited on /photo-credits anyway. The logo is RAD's own.
 */
export const homePhotoCredits: { image: string; subject: string; by: string; source: string; url?: string }[] = [
  {
    image: "/home/woman-tablet.webp",
    subject: "Woman holding a tablet",
    by: "Gustavo Fring",
    source: "Pexels",
    url: "https://www.pexels.com/photo/portrait-of-a-woman-holding-a-tablet-4872079/",
  },
  {
    image: "/home/worker.webp",
    subject: "Worker in a hard hat and face mask",
    by: "eltonchen",
    source: "Unsplash",
    url: "https://unsplash.com/@eltonchen",
  },
  {
    image: "/home/jet-engine.webp",
    subject: "Jet engine",
    by: "Javier Vermaas",
    source: "Unsplash",
    url: "https://unsplash.com/@abl2fly",
  },
  {
    image: "/home/machinery.webp",
    subject: "Industrial machinery",
    by: "Frantisek Duris",
    source: "Unsplash",
    url: "https://unsplash.com/@modry_dinosaurus",
  },
  {
    image: "/home/warehouse-aisle.webp",
    subject: "Warehouse aisle",
    by: "Peaky_82",
    source: "Unsplash",
    url: "https://unsplash.com/@peaky_82",
  },
  {
    image: "/home/lab-tubes.webp",
    subject: "Laboratory test tubes",
    by: "Nathan Rimoux",
    source: "Unsplash",
    url: "https://unsplash.com/@nathan_rmx",
  },
  { image: "/home/container-ship.webp", subject: "Container ship", by: "Ian Taylor", source: "Unsplash" },
];
