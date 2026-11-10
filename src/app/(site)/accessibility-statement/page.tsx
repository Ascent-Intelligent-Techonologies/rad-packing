import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Accessibility Statement" };

export default function Accessibility() {
  return (
    <LegalPage eyebrow="Legal" title="Accessibility Statement" updated="10 November 2026">
      <h2>Our commitment</h2>
      <p>
        RAD Packing is committed to making radpacking.com usable by everyone, including people with disabilities. We aim
        to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA.
      </p>

      <h2>What we have done</h2>
      <ul>
        <li>Semantic page structure with a clear heading hierarchy and a skip-to-content link.</li>
        <li>Full keyboard navigation with visible focus indicators, including the menu and the chat assistant.</li>
        <li>Readable colour contrast, and form fields with visible labels and error messages.</li>
        <li>Large tap targets and responsive layouts that work on phones, tablets and desktops.</li>
        <li>
          Motion is reduced or switched off for visitors whose device is set to &ldquo;reduce motion&rdquo;, and
          decorative animation is hidden from screen readers.
        </li>
        <li>The page language is declared, and links and buttons have descriptive names.</li>
      </ul>

      <h2>Known limitations</h2>
      <p>
        Accessibility is ongoing work. Some content, such as AI-generated chat replies, may occasionally be less
        structured than the rest of the site. If you find a barrier, we want to hear about it.
      </p>

      <h2>Feedback and support</h2>
      <p>
        If you have trouble using any part of this website, or need information in another format, please call{" "}
        {site.phones[0].label} or {site.phones[1].label}, or use our <a href="/contact">contact form</a>. We will do our
        best to help promptly.
      </p>
    </LegalPage>
  );
}
