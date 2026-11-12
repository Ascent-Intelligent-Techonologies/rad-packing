/** Role-based access control for the CRM. Server code is the source of truth; the UI mirrors it. */
export type Role = "admin" | "manager" | "sales" | "ops" | "viewer";
export type Capability =
  | "view" //     see CRM pages
  | "write" //    create / edit enquiries, customers, contacts, quotes, tasks, notes
  | "delete" //   delete records
  | "reports" //  reports + exports
  | "catalogue" // edit the price list
  | "website" //   edit the public website catalogue (categories, products, photos)
  | "settings" // business settings
  | "team"; //    manage staff accounts

const matrix: Record<Capability, Role[]> = {
  view: ["admin", "manager", "sales", "ops", "viewer"],
  write: ["admin", "manager", "sales", "ops"],
  delete: ["admin", "manager"],
  reports: ["admin", "manager", "viewer"],
  catalogue: ["admin", "manager"],
  website: ["admin", "manager", "sales", "ops"],
  settings: ["admin", "manager"],
  team: ["admin"],
};

export function can(role: string | undefined | null, cap: Capability): boolean {
  return !!role && (matrix[cap] as string[]).includes(role);
}
