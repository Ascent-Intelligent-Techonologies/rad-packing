"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton, type ActionState } from "@/components/crm/forms";
import { UNITS } from "@/lib/crm/constants";
import { aed, fromFils, toFils } from "@/lib/crm/format";
import { computeTotals, lineTotalFils, money } from "@/lib/crm/quotes";

export type FormProduct = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  unitPriceFils: number;
};
export type FormContact = { id: string; name: string; companyId: string | null; companyName: string | null };
export type FormItem = {
  description: string;
  unit: string;
  quantity: number;
  unitPriceFils: number;
  productId: string | null;
};

type Row = { key: string; description: string; unit: string; quantity: string; unitPrice: string; productId: string | null };

const blankRow = (key: string): Row => ({ key, description: "", unit: "pcs", quantity: "1", unitPrice: "", productId: null });

export function QuoteForm({
  action,
  quoteId,
  leadId,
  leadNote,
  defaults,
  items,
  companies,
  contacts,
  products,
  categories,
  cancelHref,
  submitLabel,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  quoteId?: string;
  leadId?: string | null;
  /** shown when the quote is tied to an enquiry */
  leadNote?: string | null;
  defaults: {
    title: string;
    companyId: string;
    contactId: string;
    validUntil: string;
    vatRate: number;
    discountFils: number;
    notes: string;
    terms: string;
  };
  items: FormItem[];
  companies: { id: string; name: string }[];
  contacts: FormContact[];
  products: FormProduct[];
  categories: { id: string; label: string }[];
  cancelHref: string;
  submitLabel: string;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    items.length
      ? items.map((it, i) => ({
          key: `init-${i}`,
          description: it.description,
          unit: it.unit,
          quantity: String(it.quantity),
          unitPrice: fromFils(it.unitPriceFils),
          productId: it.productId,
        }))
      : [blankRow("init-0")],
  );
  const [companyId, setCompanyId] = useState(defaults.companyId);
  const [contactId, setContactId] = useState(defaults.contactId);
  const [vat, setVat] = useState(String(defaults.vatRate));
  const [discount, setDiscount] = useState(defaults.discountFils ? fromFils(defaults.discountFils) : "");

  const seq = useRef(0);
  const newKey = () => `new-${++seq.current}`;
  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const remove = (key: string) =>
    setRows((rs) => (rs.length <= 1 ? [blankRow(newKey())] : rs.filter((r) => r.key !== key)));
  const add = () => setRows((rs) => (rs.length >= 100 ? rs : [...rs, blankRow(newKey())]));

  const fillFromProduct = (key: string, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    update(key, { description: p.name, unit: p.unit, unitPrice: fromFils(p.unitPriceFils), productId: p.id });
  };

  const calc = useMemo(() => {
    const lines = rows.map((r) => {
      const quantity = Number(r.quantity.replace(/,/g, ""));
      return {
        quantity: Number.isFinite(quantity) ? quantity : 0,
        unitPriceFils: toFils(r.unitPrice) ?? 0,
      };
    });
    const discountFils = toFils(discount) ?? 0;
    const vatRate = Number(vat);
    const totals = computeTotals(lines, discountFils, Number.isFinite(vatRate) ? vatRate : 0);
    return { lines, ...totals };
  }, [rows, discount, vat]);

  const visibleContacts = contacts.filter((c) => !companyId || c.companyId === companyId || c.id === contactId);
  const itemsJson = JSON.stringify(
    rows.map((r) => ({
      description: r.description,
      unit: r.unit,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      productId: r.productId,
    })),
  );

  const grouped = useMemo(() => {
    const groups = categories
      .map((c) => ({ ...c, items: products.filter((p) => p.category === c.id) }))
      .filter((g) => g.items.length);
    const other = products.filter((p) => !p.category || !categories.some((c) => c.id === p.category));
    return { groups, other };
  }, [products, categories]);

  const productOption = (p: FormProduct) => (
    <option key={p.id} value={p.id}>
      {p.name} ({aed(p.unitPriceFils)} / {p.unit})
    </option>
  );

  const COLS = "md:grid-cols-[minmax(0,1fr)_96px_92px_124px_124px_44px]";
  const lbl = "mb-1 block text-xs font-bold md:sr-only";

  return (
    <ActionForm action={action} className="space-y-6">
      {quoteId && <input type="hidden" name="id" value={quoteId} />}
      {leadId && <input type="hidden" name="leadId" value={leadId} />}
      <input type="hidden" name="items" value={itemsJson} />

      {/* Enter in a single-line field must not submit the whole quote */}
      <div
        className="space-y-6"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault();
        }}
      >
        <section className="panel p-5">
          <h2 className="mb-4 font-display text-[15px] font-bold">Quote details</h2>
          {leadNote && <p className="mb-4 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand">{leadNote}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-bold">Title</span>
              <input name="title" maxLength={200} defaultValue={defaults.title} className="field-sm" placeholder="e.g. Export crates for 3 gearboxes" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">Customer</span>
              <select
                name="companyId"
                value={companyId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCompanyId(id);
                  const cur = contacts.find((c) => c.id === contactId);
                  if (cur && id && cur.companyId !== id) setContactId("");
                }}
                className="field-sm"
              >
                <option value="">No customer selected</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">Contact</span>
              <select
                name="contactId"
                value={contactId}
                onChange={(e) => {
                  const id = e.target.value;
                  setContactId(id);
                  const c = contacts.find((x) => x.id === id);
                  if (c?.companyId && !companyId) setCompanyId(c.companyId);
                }}
                className="field-sm"
              >
                <option value="">No contact</option>
                {visibleContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!companyId && c.companyName ? ` (${c.companyName})` : ""}
                  </option>
                ))}
              </select>
              {companyId && visibleContacts.length === 0 && (
                <span className="mt-1 block text-xs text-muted">This customer has no contacts yet.</span>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">Valid until</span>
              <input type="date" name="validUntil" defaultValue={defaults.validUntil} className="field-sm" />
            </label>
          </div>
        </section>

        <section className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-[15px] font-bold">Line items</h2>
            <span className="text-xs text-muted">{rows.length} line{rows.length === 1 ? "" : "s"}</span>
          </div>

          <div className={`mb-1 hidden gap-2 px-0.5 text-[11px] font-bold uppercase tracking-wider text-muted md:grid ${COLS}`} aria-hidden="true">
            <span>Description</span>
            <span>Unit</span>
            <span>Qty</span>
            <span>Unit price (AED)</span>
            <span className="text-right">Amount (AED)</span>
            <span />
          </div>

          <ul className="space-y-3 md:space-y-2">
            {rows.map((r, i) => (
              <li key={r.key} className="rounded-2xl border border-line bg-[#fafbff] p-3 md:border-0 md:bg-transparent md:p-0">
                <div className={`grid grid-cols-2 gap-2 ${COLS} md:items-start`}>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block">
                      <span className={lbl}>Description (line {i + 1})</span>
                      <input
                        value={r.description}
                        onChange={(e) => update(r.key, { description: e.target.value })}
                        maxLength={600}
                        className="field-sm"
                        placeholder="Item or service"
                      />
                    </label>
                    {products.length > 0 && (
                      <select
                        aria-label={`Fill line ${i + 1} from the price list`}
                        value=""
                        onChange={(e) => fillFromProduct(r.key, e.target.value)}
                        className="field-sm mt-1.5 !min-h-[36px] !py-1.5 !text-[13px] text-muted"
                      >
                        <option value="">Pick from price list…</option>
                        {grouped.groups.map((g) => (
                          <optgroup key={g.id} label={g.label}>
                            {g.items.map(productOption)}
                          </optgroup>
                        ))}
                        {grouped.other.length > 0 && <optgroup label="Other">{grouped.other.map(productOption)}</optgroup>}
                      </select>
                    )}
                  </div>
                  <label className="block">
                    <span className={lbl}>Unit</span>
                    <select value={r.unit} onChange={(e) => update(r.key, { unit: e.target.value })} className="field-sm">
                      {(UNITS.includes(r.unit) ? UNITS : [...UNITS, r.unit]).map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className={lbl}>Quantity</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={r.quantity}
                      onChange={(e) => update(r.key, { quantity: e.target.value })}
                      className="field-sm"
                    />
                  </label>
                  <label className="block">
                    <span className={lbl}>Unit price (AED)</span>
                    <input
                      inputMode="decimal"
                      value={r.unitPrice}
                      onChange={(e) => update(r.key, { unitPrice: e.target.value })}
                      className="field-sm"
                      placeholder="0.00"
                    />
                  </label>
                  <div>
                    <span className={lbl}>Amount (AED)</span>
                    <output className="flex min-h-[42px] items-center justify-end rounded-xl bg-white px-3 font-semibold tabular-nums md:bg-transparent">
                      {money(lineTotalFils(calc.lines[i]?.quantity ?? 0, calc.lines[i]?.unitPriceFils ?? 0))}
                    </output>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <button
                      type="button"
                      onClick={() => remove(r.key)}
                      className="inline-flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 md:w-11 md:px-0"
                      aria-label={`Remove line ${i + 1}`}
                    >
                      <Trash2 size={16} />
                      <span className="md:hidden">Remove line</span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={add} disabled={rows.length >= 100} className="btn btn-outline !min-h-[42px] !px-4 text-sm">
              <Plus size={16} /> Add line
            </button>
            {products.length === 0 && (
              <span className="text-xs text-muted">
                The price list has no active products yet.{" "}
                <Link href="/admin/products" className="font-semibold text-brand hover:underline">
                  Open the price list
                </Link>
              </span>
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="panel space-y-4 p-5">
            <h2 className="font-display text-[15px] font-bold">Notes &amp; terms</h2>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">Notes (shown on the quote)</span>
              <textarea name="notes" rows={3} maxLength={5000} defaultValue={defaults.notes} className="field-sm" placeholder="Delivery, scope, assumptions…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">Terms &amp; conditions</span>
              <textarea name="terms" rows={5} maxLength={5000} defaultValue={defaults.terms} className="field-sm" />
            </label>
          </section>

          <section className="panel h-fit p-5">
            <h2 className="mb-4 font-display text-[15px] font-bold">Totals</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{aed(calc.subtotalFils)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>
                  <label htmlFor="q-discount" className="text-muted">
                    Discount (AED)
                  </label>
                </dt>
                <dd className="w-36">
                  <input
                    id="q-discount"
                    name="discount"
                    inputMode="decimal"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="field-sm text-right"
                    placeholder="0.00"
                  />
                </dd>
              </div>
              {calc.discountFils > calc.subtotalFils && (
                <div>
                  <p role="alert" className="text-xs font-semibold text-red-600">
                    The discount can&apos;t be more than the subtotal.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt>
                  <label htmlFor="q-vat" className="text-muted">
                    VAT rate (%)
                  </label>
                </dt>
                <dd className="w-36">
                  <input
                    id="q-vat"
                    name="vatRate"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="any"
                    required
                    value={vat}
                    onChange={(e) => setVat(e.target.value)}
                    className="field-sm text-right"
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">VAT</dt>
                <dd className="font-semibold tabular-nums">{aed(calc.vatFils)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                <dt className="font-display font-bold">Total</dt>
                <dd className="font-display text-xl font-extrabold tabular-nums" aria-live="polite">
                  {aed(calc.totalFils)}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">Totals are recalculated on the server when you save.</p>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Saving quote…">{submitLabel}</SubmitButton>
        <Link href={cancelHref} className="btn btn-outline !min-h-[42px] !px-5 text-sm">
          Cancel
        </Link>
      </div>
    </ActionForm>
  );
}
