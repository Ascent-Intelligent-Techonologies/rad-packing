"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckSquare,
  ChevronDown,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Settings,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { Avatar } from "./ui";
import { logout } from "@/app/admin/actions";

type Item = { href: string; label: string; icon: LucideIcon; show: boolean };
type Group = { title: string; items: Item[] };

export function Sidebar({
  user,
  perms,
}: {
  user: { name: string; email: string; role: string; roleLabel: string };
  perms: { reports: boolean; team: boolean; settings: boolean; write: boolean; catalogue: boolean };
}) {
  const pathname = usePathname();
  const [openFor, setOpenFor] = useState<string | null>(null);
  // the drawer is open only for the page it was opened on, so navigating closes it
  const open = openFor === pathname;
  const setOpen = (v: boolean | ((c: boolean) => boolean)) =>
    setOpenFor((cur) => ((typeof v === "function" ? v(cur === pathname) : v) ? pathname : null));
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const groups: Group[] = [
    {
      title: "Overview",
      items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, show: true }],
    },
    {
      title: "Sales",
      items: [
        { href: "/admin/enquiries", label: "Enquiries", icon: Inbox, show: true },
        { href: "/admin/customers", label: "Customers", icon: Building2, show: true },
        { href: "/admin/contacts", label: "Contacts", icon: Users, show: true },
        { href: "/admin/quotes", label: "Quotes", icon: FileText, show: true },
        { href: "/admin/tasks", label: "Tasks", icon: CheckSquare, show: true },
      ],
    },
    {
      title: "Catalogue & insights",
      items: [
        { href: "/admin/products", label: "Price list", icon: Package, show: true },
        { href: "/admin/chats", label: "Website chat", icon: MessageSquare, show: true },
        { href: "/admin/reports", label: "Reports", icon: BarChart3, show: perms.reports },
      ],
    },
    {
      title: "Administration",
      items: [
        { href: "/admin/team", label: "Team", icon: Users, show: perms.team },
        { href: "/admin/settings", label: "Settings", icon: Settings, show: perms.settings },
      ],
    },
  ];

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="CRM" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map((g) => {
        const items = g.items.filter((i) => i.show);
        if (!items.length) return null;
        return (
          <div key={g.title}>
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">{g.title}</p>
            <ul className="mt-2 space-y-0.5">
              {items.map((i) => {
                const active = isActive(i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold transition ${
                        active
                          ? "bg-white/12 text-white shadow-[inset_3px_0_0_0_var(--orange)]"
                          : "text-white/65 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <i.icon size={18} className={active ? "text-amber" : ""} />
                      {i.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  const account = (
    <div className="border-t border-white/10 p-3">
      <Link
        href="/admin/account"
        className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/8"
      >
        <Avatar name={user.name} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-bold text-white">{user.name}</span>
          <span className="block truncate text-xs text-white/50">{user.roleLabel}</span>
        </span>
        <UserCircle size={18} className="text-white/40" />
      </Link>
      <form action={logout}>
        <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/8 hover:text-white">
          <LogOut size={17} /> Sign out
        </button>
      </form>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
      <LogoMark size={34} uid="crm" />
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-extrabold tracking-wide text-white">RAD CRM</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Back office</span>
      </span>
    </Link>
  );

  return (
    <>
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink lg:flex">
        {brand}
        {nav}
        {account}
      </aside>

      {/* mobile top bar */}
      <div className="no-print fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-ink px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <LogoMark size={28} uid="crm-m" />
          <span className="font-display text-sm font-extrabold tracking-wide text-white">RAD CRM</span>
        </Link>
        <div className="flex items-center gap-2">
          <QuickCreate canWrite={perms.write} mobile />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div
        className={`fixed inset-0 z-20 bg-ink pt-14 transition lg:hidden ${open ? "visible opacity-100" : "invisible opacity-0"}`}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          {nav}
          {account}
        </div>
      </div>
    </>
  );
}

/** "+ New" dropdown: quick create for the most common records. */
export function QuickCreate({ canWrite, mobile = false }: { canWrite: boolean; mobile?: boolean }) {
  if (!canWrite) return null;
  const items = [
    { href: "/admin/enquiries/new", label: "New enquiry" },
    { href: "/admin/customers/new", label: "New customer" },
    { href: "/admin/quotes/new", label: "New quote" },
    { href: "/admin/tasks?new=1", label: "New task" },
  ];
  return (
    <details className="group relative">
      <summary
        className={`flex cursor-pointer list-none items-center gap-1.5 rounded-full bg-linear-to-r from-orange to-pink font-bold text-white shadow-md [&::-webkit-details-marker]:hidden ${
          mobile ? "h-10 px-3.5 text-sm" : "h-10 px-4 text-sm"
        }`}
      >
        <Plus size={16} /> New <ChevronDown size={14} className="transition group-open:rotate-180" />
      </summary>
      <ul className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-line bg-white p-1.5 text-text shadow-xl">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-brand-50 hover:text-brand">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
