import { imageSrc } from "@/lib/catalogue/shared";
import type { ImageRef } from "@/lib/catalogue/public";
import { CatalogIcon } from "./CatalogIcon";
import { ProductArt, pickArt } from "./ProductArt";

/**
 * A catalogue photo, or a neutral icon tile when there isn't one yet.
 * Plain <img> on purpose: photos are served by our own /media route (already resized when uploaded).
 */
export function CatalogPhoto({
  image,
  alt,
  icon,
  className = "",
  size = "thumb",
  sizes,
  priority = false,
  iconSize = 44,
  art,
}: {
  image: ImageRef | null | undefined;
  alt: string;
  icon?: string | null;
  className?: string;
  size?: "thumb" | "full";
  sizes?: string;
  priority?: boolean;
  iconSize?: number;
  /** when there is no photo, draw an illustration chosen from this product instead of the icon tile */
  art?: { slug: string; title: string; tags?: string[] };
}) {
  if (!image && art) return <ProductArt kind={pickArt({ ...art, icon })} className={className} />;
  if (!image) {
    return (
      <div className={`grid place-items-center bg-linear-to-br from-brand-50 via-white to-orange/10 ${className}`}>
        <span
          style={{ padding: iconSize * 0.5 }}
          className="grid place-items-center rounded-[28%] bg-white text-brand shadow-[0_10px_30px_-12px_rgba(60,40,200,0.35)] ring-1 ring-line"
        >
          <CatalogIcon name={icon} size={iconSize} strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  const thumb = imageSrc(image.id, "thumb");
  const full = imageSrc(image.id);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={size === "thumb" ? thumb : full}
      srcSet={size === "thumb" ? `${thumb} 480w, ${full} ${Math.max(image.width, 481)}w` : undefined}
      sizes={size === "thumb" ? sizes : undefined}
      alt={image.alt || alt}
      width={image.width}
      height={image.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}
