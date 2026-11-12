"use client";

import { useState } from "react";
import { Field } from "@/components/crm/ui";
import { slugify } from "@/lib/catalogue/shared";

/** Lower-case letters, digits and hyphens only, while typing (full tidy-up happens on blur). */
const draft = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-");

/**
 * Title (or name) and slug state. The slug follows the title until it is edited by hand;
 * clearing it hands control back to the title. New items start in auto mode, saved ones keep their address.
 */
export function useAutoSlug(initial: { title: string; slug: string }, startAuto: boolean) {
  const [title, setTitleValue] = useState(initial.title);
  const [slug, setSlugValue] = useState(initial.slug);
  const [auto, setAuto] = useState(startAuto);
  return {
    title,
    slug,
    /** true while the slug is being generated from the title; sent so the server can add -2, -3… on a clash */
    auto,
    setTitle: (v: string) => {
      setTitleValue(v);
      if (auto) setSlugValue(slugify(v));
    },
    setSlug: (v: string) => {
      const next = draft(v);
      setSlugValue(next);
      setAuto(next === "");
    },
    tidySlug: () => setSlugValue((s) => slugify(s)),
  };
}

export function SlugField({
  slug,
  auto,
  onChange,
  onBlur,
  hint,
  label = "Web address (slug)",
}: {
  slug: string;
  auto: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
  hint: string;
  label?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        name="slug"
        value={slug}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        maxLength={80}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="made-from-the-title"
        className="field-sm"
      />
      <input type="hidden" name="slugAuto" value={auto ? "1" : ""} />
    </Field>
  );
}
