import Link from "next/link";
import type { Metadata } from "next";
import { Check, Minus, Plus } from "lucide-react";
import { getDb } from "@/lib/db";
import { requirePageAccess } from "@/lib/crm/auth";
import { can, type Capability } from "@/lib/crm/permissions";
import { ROLES } from "@/lib/crm/constants";
import { fmtDate, timeAgo } from "@/lib/crm/format";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/crm/forms";
import { Avatar, Badge, EmptyState, Field, OptBadge, PageHeader, Panel, TableWrap } from "@/components/crm/ui";
import { changeRole, createUser, resetPassword, setActive } from "./actions";
import { PasswordField } from "./PasswordField";

export const metadata: Metadata = { title: "Team" };

const CAPS: { cap: Capability; label: string }[] = [
  { cap: "view", label: "View the CRM" },
  { cap: "write", label: "Create & edit" },
  { cap: "delete", label: "Delete records" },
  { cap: "reports", label: "Reports & exports" },
  { cap: "catalogue", label: "Edit price list" },
  { cap: "settings", label: "Business settings" },
  { cap: "team", label: "Manage team" },
];

export default async function TeamPage(props: PageProps<"/admin/team">) {
  const me = await requirePageAccess("team");
  const sp = await props.searchParams;
  const db = getDb()!;

  const users = await db.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true, createdAt: true },
  });
  const activeCount = users.filter((u) => u.active).length;
  const activeAdmins = users.filter((u) => u.active && u.role === "admin").length;
  const newOpen = (Array.isArray(sp.new) ? sp.new[0] : sp.new) === "1";

  return (
    <>
      <PageHeader
        title="Team"
        subtitle={`${activeCount} active of ${users.length} staff account${users.length === 1 ? "" : "s"}. Only administrators can see this page.`}
      />

      {/* ── create ───────────────────────────────────────────── */}
      <details open={newOpen} className="panel group mb-6">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2 px-5 py-3 font-display text-[15px] font-bold [&::-webkit-details-marker]:hidden">
          <Plus size={16} className="text-brand transition group-open:rotate-45" /> Add a team member
        </summary>
        <div className="border-t border-line p-5">
          <ActionForm action={createUser} resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name *">
                <input name="name" required minLength={2} maxLength={100} autoComplete="off" className="field-sm" />
              </Field>
              <Field label="Work email *" hint="Used to sign in. Stored in lower case.">
                <input name="email" type="email" required maxLength={200} autoComplete="off" className="field-sm" />
              </Field>
              <Field label="Role *">
                <select name="role" defaultValue="sales" className="field-sm">
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
              <PasswordField label="Temporary password *" hint="At least 10 characters. Share it securely; they should change it from My account." />
            </div>
            <div className="mt-5">
              <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </details>

      {/* ── staff ────────────────────────────────────────────── */}
      {users.length === 0 ? (
        <Panel>
          <EmptyState title="No staff accounts" />
        </Panel>
      ) : (
        <ul className="space-y-4">
          {users.map((u) => {
            const isMe = u.id === me.id;
            const lastAdmin = u.role === "admin" && u.active && activeAdmins <= 1;
            return (
              <li key={u.id} className={`panel p-4 sm:p-5 ${u.active ? "" : "bg-slate-50"}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={u.name} size={42} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      <span className="break-words">{u.name}</span>
                      {isMe && <Badge tone="blue">You</Badge>}
                    </p>
                    <p className="break-all text-sm text-muted">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <OptBadge list={ROLES} id={u.role} />
                    <Badge tone={u.active ? "green" : "slate"}>{u.active ? "Active" : "Inactive"}</Badge>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:max-w-md">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">Last sign-in</dt>
                    <dd className="mt-0.5 font-medium">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "Never"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted">Created</dt>
                    <dd className="mt-0.5 font-medium">{fmtDate(u.createdAt)}</dd>
                  </div>
                </dl>

                <details className="group/manage mt-4 border-t border-line pt-1">
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center text-sm font-semibold text-brand [&::-webkit-details-marker]:hidden">
                    <span className="group-open/manage:hidden">Manage account</span>
                    <span className="hidden group-open/manage:inline">Hide account settings</span>
                  </summary>

                  <div className="mt-3 grid gap-6 lg:grid-cols-3">
                    {/* role */}
                    <div>
                      <h3 className="mb-2 font-display text-sm font-bold">Role</h3>
                      {isMe ? (
                        <p className="text-sm text-muted">You can&apos;t change your own role. Ask another administrator.</p>
                      ) : (
                        <ActionForm action={changeRole}>
                          <input type="hidden" name="id" value={u.id} />
                          <label className="block">
                            <span className="sr-only">Role for {u.name}</span>
                            <select name="role" defaultValue={u.role} className="field-sm">
                              {ROLES.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          {lastAdmin && (
                            <p className="mt-2 text-xs text-muted">The last active administrator can&apos;t be demoted.</p>
                          )}
                          <div className="mt-3">
                            <SubmitButton className="btn btn-outline !min-h-[42px] !px-5 text-sm" pendingLabel="Saving…">
                              Change role
                            </SubmitButton>
                          </div>
                        </ActionForm>
                      )}
                    </div>

                    {/* password */}
                    <div>
                      <h3 className="mb-2 font-display text-sm font-bold">Reset password</h3>
                      {isMe ? (
                        <p className="text-sm text-muted">
                          Change your own password from{" "}
                          <Link href="/admin/account" className="font-semibold text-brand hover:underline">
                            My account
                          </Link>
                          .
                        </p>
                      ) : (
                        <ActionForm action={resetPassword} resetOnSuccess>
                          <input type="hidden" name="id" value={u.id} />
                          <PasswordField label="New password" hint="At least 10 characters. They are signed out everywhere." />
                          <div className="mt-3">
                            <SubmitButton className="btn btn-outline !min-h-[42px] !px-5 text-sm" pendingLabel="Resetting…">
                              Reset password
                            </SubmitButton>
                          </div>
                        </ActionForm>
                      )}
                    </div>

                    {/* active */}
                    <div>
                      <h3 className="mb-2 font-display text-sm font-bold">Access</h3>
                      {isMe ? (
                        <p className="text-sm text-muted">You can&apos;t deactivate your own account.</p>
                      ) : (
                        <ActionForm action={setActive}>
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                          <p className="mb-3 text-sm text-muted">
                            {u.active
                              ? "Deactivating signs them out everywhere and blocks sign-in. Their records are kept."
                              : "This account can't sign in. Reactivate it to restore access."}
                          </p>
                          {lastAdmin && (
                            <p className="mb-3 text-xs text-muted">The last active administrator can&apos;t be deactivated.</p>
                          )}
                          {u.active ? (
                            <ConfirmButton message={`Deactivate ${u.name}? They will be signed out everywhere.`}>
                              Deactivate account
                            </ConfirmButton>
                          ) : (
                            <SubmitButton className="btn btn-outline !min-h-[42px] !px-5 text-sm" pendingLabel="Saving…">
                              Reactivate account
                            </SubmitButton>
                          )}
                        </ActionForm>
                      )}
                    </div>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── roles legend ─────────────────────────────────────── */}
      <Panel title="What each role can do" flush className="mt-8">
        <TableWrap>
          <thead>
            <tr>
              <th>Role</th>
              {CAPS.map((c) => (
                <th key={c.cap} className="text-center">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((r) => (
              <tr key={r.id}>
                <td className="min-w-[220px]">
                  <OptBadge list={ROLES} id={r.id} />
                  <p className="mt-1 text-xs text-muted">{r.description}</p>
                </td>
                {CAPS.map((c) => {
                  const yes = can(r.id, c.cap);
                  return (
                    <td key={c.cap} className="text-center">
                      {yes ? (
                        <Check size={18} className="mx-auto text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Minus size={18} className="mx-auto text-slate-300" aria-hidden="true" />
                      )}
                      <span className="sr-only">{yes ? "Yes" : "No"}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
