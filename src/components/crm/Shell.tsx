import { requireUser } from "@/lib/crm/auth";
import { can } from "@/lib/crm/permissions";
import { ROLES } from "@/lib/crm/constants";
import { QuickCreate, Sidebar } from "./Sidebar";

/** Reads the session (request-time), so it must sit inside a <Suspense> boundary. */
export async function AuthedShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const perms = {
    reports: can(user.role, "reports"),
    team: can(user.role, "team"),
    settings: can(user.role, "settings"),
    write: can(user.role, "write"),
    catalogue: can(user.role, "catalogue"),
    website: can(user.role, "website"),
  };
  return (
    <div className="min-h-dvh bg-surface">
      <Sidebar
        user={{ name: user.name, email: user.email, role: user.role, roleLabel: ROLES.find((r) => r.id === user.role)?.label ?? user.role }}
        perms={perms}
      />
      <div className="lg:pl-64">
        <div className="no-print hidden h-16 items-center justify-end border-b border-line bg-white/70 px-8 backdrop-blur lg:flex">
          <QuickCreate canWrite={perms.write} />
        </div>
        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-[72px] sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

export function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-surface">
      <div className="fixed inset-y-0 left-0 hidden w-64 bg-ink lg:block" />
      <div className="fixed inset-x-0 top-0 h-14 bg-ink lg:hidden" />
      <div className="px-4 pt-24 lg:pl-72 lg:pr-8 lg:pt-24">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-line" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-line/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
