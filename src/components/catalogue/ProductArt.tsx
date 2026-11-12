import { useId } from "react";

/**
 * Original flat illustrations shown in place of a photo until staff upload one.
 * They are drawn here (not copied from anywhere) and picked from the product's address, title and tags.
 */
export type ArtKind =
  | "roll"
  | "bag"
  | "mailer"
  | "sachets"
  | "card"
  | "bottle"
  | "emitter"
  | "box"
  | "crate"
  | "pallet"
  | "honeycomb"
  | "pillows"
  | "foam"
  | "carton"
  | "truck"
  | "clipboard";

const RULES: [RegExp, ArtKind][] = [
  [/pallet/, "pallet"],
  [/crate|timber-case/, "crate"],
  [/nail-?less|plywood|e1-grade/, "box"],
  [/carton/, "carton"],
  [/honeycomb|cushion-pad|paper-cushion/, "honeycomb"],
  [/air-cushion|air pillow|pillow/, "pillows"],
  [/mailer/, "mailer"],
  [/foam/, "foam"],
  [/emitter/, "emitter"],
  [/desiccant/, "sachets"],
  [/indicator/, "card"],
  [/barrier|vacuum|foil/, "bag"],
  [/oil|remover|spray|rust-prev/, "bottle"],
  [/tape|film|strapping|stretch|shrink|vci-paper|paper/, "roll"],
  [/site-assessment|assessment/, "clipboard"],
  [/onsite|on-site|mobile-packing|crating|export-prep|turnkey/, "truck"],
];

const BY_ICON: Record<string, ArtKind> = {
  shield: "roll",
  box: "box",
  layers: "pallet",
  truck: "truck",
  leaf: "honeycomb",
  wrench: "bottle",
  package: "carton",
  droplets: "sachets",
  flask: "bottle",
  gauge: "card",
  container: "crate",
  scroll: "roll",
  hammer: "crate",
};

export function pickArt(p: { slug?: string; title?: string; tags?: string[]; icon?: string | null }): ArtKind {
  const hay = `${p.slug ?? ""} ${p.title ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();
  for (const [re, kind] of RULES) if (re.test(hay)) return kind;
  return (p.icon && BY_ICON[p.icon]) || "carton";
}

const C = {
  brand: "#2026e0",
  brand600: "#1a1fb8",
  brand50: "#eef0ff",
  brandSoft: "#c9cffc",
  orange: "#ff7a1a",
  pink: "#ff3d7f",
  amber: "#ffb02e",
  ink: "#05071f",
  white: "#ffffff",
  kraft: "#dba967",
  kraftDark: "#bf8a47",
  kraftLight: "#efd2a0",
  steel: "#aeb6d0",
};

function Motif({ kind, id }: { kind: ArtKind; id: string }) {
  switch (kind) {
    case "roll":
      return (
        <g>
          <ellipse cx="118" cy="174" rx="30" ry="62" fill={C.brandSoft} />
          <rect x="118" y="112" width="152" height="124" fill={`url(#${id}roll)`} />
          <rect x="166" y="112" width="46" height="124" fill={C.brand} opacity="0.92" />
          <rect x="166" y="112" width="46" height="124" fill="none" stroke={C.brand600} strokeOpacity="0.4" />
          <circle cx="189" cy="174" r="12" fill={C.orange} />
          <rect x="118" y="120" width="152" height="9" rx="4.5" fill="#fff" opacity="0.4" />
          <ellipse cx="270" cy="174" rx="30" ry="62" fill="#f6f7ff" stroke={C.brandSoft} strokeWidth="2" />
          <ellipse cx="270" cy="174" rx="15" ry="28" fill={C.brandSoft} />
          <ellipse cx="270" cy="174" rx="8" ry="15" fill="#fff" />
        </g>
      );
    case "bag":
      return (
        <g>
          <path d="M142 74h116a8 8 0 0 1 8 8v146a12 12 0 0 1-12 12H146a12 12 0 0 1-12-12V82a8 8 0 0 1 8-8z" fill={`url(#${id}bag)`} stroke={C.brandSoft} strokeWidth="2" />
          <rect x="134" y="74" width="132" height="24" rx="8" fill={C.brand50} />
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1={144 + i * 10} y1="80" x2={144 + i * 10} y2="92" stroke={C.brandSoft} strokeWidth="2" />
          ))}
          <rect x="134" y="222" width="132" height="18" rx="6" fill={C.brand50} />
          <circle cx="200" cy="158" r="30" fill={C.brand} />
          <path d="M186 158l10 10 20-22" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M150 112c10 14 8 70 0 96" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    case "mailer":
      return (
        <g>
          <rect x="96" y="98" width="208" height="140" rx="10" fill={C.kraft} />
          <path d="M96 108a10 10 0 0 1 10-10h188a10 10 0 0 1 10 10l-104 72z" fill={C.kraftDark} />
          <rect x="96" y="206" width="208" height="32" rx="10" fill={C.kraftLight} opacity="0.55" />
          <rect x="164" y="176" width="72" height="42" rx="6" fill="#fff" />
          <rect x="174" y="186" width="34" height="6" rx="3" fill={C.brandSoft} />
          <rect x="174" y="198" width="52" height="6" rx="3" fill={C.brand50} />
          <circle cx="262" cy="126" r="10" fill={C.orange} />
        </g>
      );
    case "sachets":
      return (
        <g>
          {[
            { x: 104, y: 150, r: -10, fill: "#fff" },
            { x: 196, y: 168, r: 7, fill: C.brand50 },
            { x: 150, y: 104, r: -4, fill: "#fff" },
          ].map((s, i) => (
            <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.r} 50 36)`}>
              <rect width="100" height="72" rx="8" fill={s.fill} stroke={C.brandSoft} strokeWidth="2" />
              {[0, 1, 2, 3, 4].map((n) => (
                <g key={n}>
                  <line x1="6" y1={10 + n * 13} x2="14" y2={10 + n * 13} stroke={C.brandSoft} strokeWidth="2" />
                  <line x1="86" y1={10 + n * 13} x2="94" y2={10 + n * 13} stroke={C.brandSoft} strokeWidth="2" />
                </g>
              ))}
              <rect x="26" y="22" width="48" height="28" rx="6" fill={i === 1 ? C.brand : C.orange} />
              <circle cx="40" cy="36" r="5" fill="#fff" opacity="0.9" />
              <circle cx="56" cy="36" r="5" fill="#fff" opacity="0.6" />
            </g>
          ))}
        </g>
      );
    case "card":
      return (
        <g>
          <rect x="108" y="64" width="184" height="170" rx="16" fill="#fff" stroke={C.brandSoft} strokeWidth="2" />
          <rect x="108" y="64" width="184" height="34" rx="16" fill={C.brand} />
          <rect x="108" y="82" width="184" height="16" fill={C.brand} />
          {[
            [150, C.brand],
            [200, C.brandSoft],
            [250, C.pink],
          ].map(([x, fill]) => (
            <circle key={String(x)} cx={Number(x)} cy="142" r="19" fill={String(fill)} />
          ))}
          <rect x="132" y="180" width="136" height="8" rx="4" fill={C.brand50} />
          <rect x="132" y="198" width="92" height="8" rx="4" fill={C.brand50} />
        </g>
      );
    case "bottle":
      return (
        <g>
          <rect x="166" y="118" width="80" height="120" rx="16" fill={`url(#${id}bottle)`} />
          <rect x="193" y="96" width="26" height="26" rx="4" fill={C.ink} />
          <path d="M176 70h58a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8h-58a8 8 0 0 1-8-8v-8a8 8 0 0 1 8-8z" fill={C.ink} />
          <rect x="150" y="76" width="22" height="9" rx="4.5" fill={C.ink} />
          <rect x="176" y="156" width="60" height="56" rx="8" fill="#fff" />
          <circle cx="206" cy="176" r="10" fill={C.orange} />
          <rect x="184" y="193" width="44" height="6" rx="3" fill={C.brandSoft} />
          <rect x="174" y="126" width="9" height="100" rx="4.5" fill="#fff" opacity="0.28" />
        </g>
      );
    case "emitter":
      return (
        <g>
          <path d="M162 92c-12-14 12-22 0-38M200 92c-12-14 12-22 0-38M238 92c-12-14 12-22 0-38" fill="none" stroke={C.orange} strokeWidth="5" strokeLinecap="round" opacity="0.8" />
          <rect x="136" y="110" width="128" height="118" rx="22" fill={C.brand50} stroke={C.brandSoft} strokeWidth="2" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => <circle key={`${r}-${c}`} cx={160 + c * 27} cy={140 + r * 30} r="7" fill={C.brandSoft} />),
          )}
          <circle cx="200" cy="170" r="30" fill="none" stroke={C.brand} strokeWidth="5" opacity="0.35" />
        </g>
      );
    case "box":
      return (
        <g>
          <polygon points="108,128 150,96 306,96 264,128" fill="#f2d9a6" />
          <polygon points="264,128 306,96 306,206 264,238" fill="#cfa466" />
          <rect x="108" y="128" width="156" height="110" fill="#e6c07f" />
          <rect x="138" y="128" width="12" height="110" fill={C.steel} />
          <rect x="222" y="128" width="12" height="110" fill={C.steel} />
          <rect x="177" y="170" width="30" height="22" rx="4" fill="#8d96b4" />
          <circle cx="192" cy="181" r="4" fill="#fff" />
          <rect x="108" y="128" width="156" height="8" fill="#fff" opacity="0.25" />
          <line x1="108" y1="128" x2="264" y2="128" stroke="#b78d4b" strokeWidth="2" />
        </g>
      );
    case "crate":
      return (
        <g>
          <polygon points="104,122 148,90 308,90 264,122" fill="#f0cf95" />
          <polygon points="264,122 308,90 308,204 264,238" fill="#c79b5c" />
          <rect x="104" y="122" width="160" height="116" fill="#3a2c18" />
          {[0, 1, 2].map((n) => (
            <rect key={n} x="104" y={126 + n * 38} width="160" height="30" fill="#dfb676" />
          ))}
          <rect x="104" y="122" width="14" height="116" fill="#c9a062" />
          <rect x="250" y="122" width="14" height="116" fill="#c9a062" />
          <line x1="118" y1="232" x2="250" y2="128" stroke="#a97f43" strokeWidth="9" strokeLinecap="round" />
        </g>
      );
    case "pallet":
      return (
        <g>
          <polygon points="136,92 156,70 244,70 264,92" fill={C.kraftLight} />
          <rect x="136" y="92" width="128" height="52" fill={C.kraft} />
          <rect x="186" y="92" width="26" height="52" fill="#f1dcaf" opacity="0.8" />
          <rect x="86" y="144" width="228" height="16" rx="3" fill="#e3bd80" />
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <line key={n} x1={86 + (n + 1) * 32.5} y1="144" x2={86 + (n + 1) * 32.5} y2="160" stroke="#b78d4b" strokeWidth="2" />
          ))}
          {[96, 183, 270].map((x) => (
            <rect key={x} x={x} y="160" width="34" height="38" fill="#c99a54" />
          ))}
          <rect x="86" y="198" width="228" height="15" rx="3" fill="#e3bd80" />
        </g>
      );
    case "honeycomb":
      return (
        <g>
          <defs>
            <pattern id={`${id}hex`} width="30" height="52" patternUnits="userSpaceOnUse">
              <path d="M15 0l15 8.7v17.3L15 34.7 0 26V8.7zM0 26l0 0 15 8.7V52M30 26l-15 8.7" fill="none" stroke={C.kraftDark} strokeWidth="2" />
              <path d="M15 34.7v17.3" stroke={C.kraftDark} strokeWidth="2" />
            </pattern>
            <clipPath id={`${id}sheet`}>
              <rect x="96" y="74" width="208" height="158" rx="16" />
            </clipPath>
          </defs>
          <rect x="96" y="74" width="208" height="158" rx="16" fill={C.kraft} />
          <g clipPath={`url(#${id}sheet)`}>
            <rect x="96" y="74" width="208" height="158" fill={`url(#${id}hex)`} />
            <polygon points="304,232 304,176 250,232" fill={C.kraftLight} />
          </g>
          <polygon points="304,232 250,232 304,176" fill="none" stroke={C.kraftDark} strokeWidth="2" strokeOpacity="0.5" />
        </g>
      );
    case "pillows":
      return (
        <g>
          {[
            { x: 90, y: 150, r: -6 },
            { x: 204, y: 140, r: 7 },
            { x: 146, y: 88, r: -2 },
          ].map((p, i) => (
            <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r} 55 36)`}>
              <rect width="110" height="72" rx="34" fill="#fff" fillOpacity="0.92" stroke={C.brandSoft} strokeWidth="2.5" />
              <line x1="55" y1="6" x2="55" y2="66" stroke={C.brandSoft} strokeWidth="2" strokeDasharray="4 5" />
              <ellipse cx="34" cy="22" rx="14" ry="6" fill={C.brand50} />
            </g>
          ))}
        </g>
      );
    case "foam":
      return (
        <g>
          <polygon points="112,112 150,84 300,84 262,112" fill="#575ca3" />
          <polygon points="262,112 300,84 300,196 262,226" fill={C.brand600} />
          <rect x="112" y="112" width="150" height="114" rx="4" fill={C.brand} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3, 4].map((c) => <circle key={`${r}-${c}`} cx={134 + c * 27} cy={138 + r * 30} r="8" fill="#fff" opacity="0.2" />),
          )}
        </g>
      );
    case "carton":
      return (
        <g>
          <polygon points="108,124 150,92 306,92 264,124" fill="#efd09a" />
          <polygon points="264,124 306,92 306,204 264,236" fill="#c8964f" />
          <rect x="108" y="124" width="156" height="112" fill={C.kraft} />
          <polygon points="190,124 232,92 258,92 216,124" fill="#f3e3bd" opacity="0.9" />
          <rect x="190" y="124" width="26" height="112" fill="#f3e3bd" opacity="0.9" />
          <rect x="128" y="172" width="52" height="40" rx="4" fill="#fff" />
          <rect x="136" y="181" width="28" height="5" rx="2.5" fill={C.brandSoft} />
          <rect x="136" y="192" width="36" height="5" rx="2.5" fill={C.brand50} />
        </g>
      );
    case "truck":
      return (
        <g>
          <rect x="62" y="96" width="176" height="112" rx="10" fill="#fff" stroke={C.brandSoft} strokeWidth="2" />
          <rect x="62" y="156" width="176" height="14" fill={`url(#${id}stripe)`} />
          <circle cx="120" cy="126" r="16" fill={C.brand} />
          <path d="M112 126l6 6 12-14" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M238 128h36a10 10 0 0 1 8 4l24 32a10 10 0 0 1 2 6v38H238z" fill={C.brand} />
          <path d="M252 142h20l16 22h-36z" fill={C.brand50} />
          <rect x="62" y="208" width="262" height="10" rx="5" fill={C.brand600} />
          {[118, 276].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="218" r="21" fill={C.ink} />
              <circle cx={cx} cy="218" r="8" fill="#fff" />
            </g>
          ))}
        </g>
      );
    case "clipboard":
      return (
        <g>
          <rect x="126" y="62" width="148" height="180" rx="16" fill={C.brandSoft} />
          <rect x="140" y="84" width="120" height="144" rx="8" fill="#fff" />
          <rect x="168" y="50" width="64" height="28" rx="9" fill={C.brand} />
          {[0, 1, 2, 3].map((n) => (
            <g key={n}>
              <circle cx="162" cy={112 + n * 34} r="10" fill={n < 3 ? C.orange : C.brand50} stroke={n < 3 ? "none" : C.brandSoft} strokeWidth="2" />
              {n < 3 && (
                <path d={`M157 ${112 + n * 34}l4 4 8-9`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              )}
              <rect x="182" y={108 + n * 34} width="62" height="8" rx="4" fill={C.brand50} />
            </g>
          ))}
        </g>
      );
  }
}

/** Fills its container (the viewBox is 4:3 and crops evenly for other shapes). */
export function ProductArt({ kind, className = "" }: { kind: ArtKind; className?: string }) {
  const id = `art${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef0ff" />
          <stop offset="0.55" stopColor="#ffffff" />
          <stop offset="1" stopColor="#fff1e6" />
        </linearGradient>
        <linearGradient id={`${id}roll`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe3ff" />
        </linearGradient>
        <linearGradient id={`${id}bag`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f6f7ff" />
          <stop offset="1" stopColor="#e1e5ff" />
        </linearGradient>
        <linearGradient id={`${id}bottle`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a40f0" />
          <stop offset="1" stopColor="#1a1fb8" />
        </linearGradient>
        <linearGradient id={`${id}stripe`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff7a1a" />
          <stop offset="1" stopColor="#ff3d7f" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}bg)`} />
      <circle cx="338" cy="52" r="92" fill="#2026e0" opacity="0.05" />
      <circle cx="52" cy="268" r="84" fill="#ff7a1a" opacity="0.07" />
      <ellipse cx="200" cy="244" rx="128" ry="12" fill="#05071f" opacity="0.09" />
      <Motif kind={kind} id={id} />
    </svg>
  );
}
