import { CatalogIcon } from "@/components/catalogue/CatalogIcon";
import { CATEGORY_ICONS } from "@/lib/catalogue/shared";

/** Radio group of icon tiles. Native radios, so keyboard and screen readers work without extra code. */
export function IconPicker({ name = "icon", defaultValue }: { name?: string; defaultValue: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-xs font-bold text-text">Icon</legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
        {CATEGORY_ICONS.map((icon) => (
          <label key={icon} className="relative block cursor-pointer">
            <input type="radio" name={name} value={icon} defaultChecked={icon === defaultValue} className="peer sr-only" />
            <span className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-line bg-white px-1 py-2 text-[11px] font-semibold capitalize text-muted transition hover:border-brand/40 peer-checked:border-brand peer-checked:bg-brand-50 peer-checked:text-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
              <CatalogIcon name={icon} size={22} />
              {icon}
            </span>
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">Shown on the website when there is no photo.</p>
    </fieldset>
  );
}
