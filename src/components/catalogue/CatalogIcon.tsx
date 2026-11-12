import {
  Box,
  Container,
  Droplets,
  FlaskConical,
  Gauge,
  Hammer,
  Layers,
  Leaf,
  Package,
  Scroll,
  ShieldCheck,
  Truck,
  Wrench,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import type { CategoryIcon } from "@/lib/catalogue/shared";

const map: Record<CategoryIcon, LucideIcon> = {
  shield: ShieldCheck,
  box: Box,
  layers: Layers,
  truck: Truck,
  leaf: Leaf,
  wrench: Wrench,
  package: Package,
  droplets: Droplets,
  flask: FlaskConical,
  gauge: Gauge,
  container: Container,
  scroll: Scroll,
  hammer: Hammer,
};

/** Icon for a category/product placeholder tile. Unknown keys fall back to a package. */
export function CatalogIcon({ name, ...props }: { name?: string | null } & Omit<LucideProps, "name">) {
  const C = (name && map[name as CategoryIcon]) || Package;
  return <C aria-hidden="true" {...props} />;
}
