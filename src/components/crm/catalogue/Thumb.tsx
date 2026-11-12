import { CatalogIcon } from "@/components/catalogue/CatalogIcon";
import { imageSrc } from "@/lib/catalogue/shared";

/** Square cover thumbnail, or an icon tile when there is no photo yet. Decorative: the title is always next to it. */
export function Thumb({ imageId, icon, size = 56 }: { imageId?: string | null; icon?: string | null; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 text-brand"
      style={{ width: size, height: size }}
    >
      {imageId ? (
        // eslint-disable-next-line @next/next/no-img-element -- served from our own /media route, already resized
        <img src={imageSrc(imageId, "thumb")} alt="" width={size} height={size} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <CatalogIcon name={icon} size={Math.round(size * 0.44)} />
      )}
    </span>
  );
}
