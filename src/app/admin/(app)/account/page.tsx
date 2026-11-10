import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/crm/auth";
import { ROLES, opt } from "@/lib/crm/constants";
import { fmtDate, timeAgo } from "@/lib/crm/format";
import { ActionForm, SubmitButton } from "@/components/crm/forms";
import { Avatar, Field, OptBadge, PageHeader, Panel } from "@/components/crm/ui";
import { changePassword, signOutOtherDevices, updateProfile } from "./actions";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser("view");
  const db = getDb()!;

  const [me, sessions] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, createdAt: true, lastLoginAt: true } }),
    db.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } }),
  ]);
  const role = opt(ROLES, user.role);

  return (
    <>
      <PageHeader title="My account" subtitle="Your profile and sign-in security." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Profile">
          <div className="mb-5 flex items-center gap-3">
            <Avatar name={me?.name ?? user.name} size={48} />
            <div className="min-w-0">
              <p className="break-words font-bold">{me?.name ?? user.name}</p>
              <p className="break-all text-sm text-muted">{user.email}</p>
            </div>
          </div>

          <dl className="mb-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">Role</dt>
              <dd className="mt-1">
                <OptBadge list={ROLES} id={user.role} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">Last sign-in</dt>
              <dd className="mt-1 font-medium">{me?.lastLoginAt ? timeAgo(me.lastLoginAt) : "Just now"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">What your role allows</dt>
              <dd className="mt-1 text-muted">{role?.description}</dd>
            </div>
            {me && (
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">Account created</dt>
                <dd className="mt-1 font-medium">{fmtDate(me.createdAt)}</dd>
              </div>
            )}
          </dl>

          <ActionForm action={updateProfile}>
            <div className="grid gap-4">
              <Field label="Email" hint="Your email is your sign-in. Ask an administrator to change it.">
                <input value={user.email} readOnly aria-readonly="true" className="field-sm bg-slate-50 text-muted" />
              </Field>
              <Field label="Display name">
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  defaultValue={me?.name ?? user.name}
                  autoComplete="name"
                  className="field-sm"
                />
              </Field>
            </div>
            <div className="mt-5">
              <SubmitButton>Save name</SubmitButton>
            </div>
          </ActionForm>
        </Panel>

        <div className="space-y-6">
          <Panel title="Change password">
            <ActionForm action={changePassword} resetOnSuccess>
              <div className="grid gap-4">
                <Field label="Current password">
                  <input name="current" type="password" required autoComplete="current-password" className="field-sm" />
                </Field>
                <Field label="New password" hint="At least 10 characters.">
                  <input
                    name="next"
                    type="password"
                    required
                    minLength={10}
                    maxLength={200}
                    autoComplete="new-password"
                    className="field-sm"
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    name="confirm"
                    type="password"
                    required
                    minLength={10}
                    maxLength={200}
                    autoComplete="new-password"
                    className="field-sm"
                  />
                </Field>
              </div>
              <p className="mt-3 text-xs text-muted">Changing your password signs you out of all your other devices.</p>
              <div className="mt-5">
                <SubmitButton pendingLabel="Changing…">Change password</SubmitButton>
              </div>
            </ActionForm>
          </Panel>

          <Panel title="Devices">
            <p className="mb-4 text-sm text-muted">
              You&apos;re signed in on {sessions} {sessions === 1 ? "device" : "devices"} (including this one). If you
              used a shared or lost device, sign out everywhere else.
            </p>
            <ActionForm action={signOutOtherDevices}>
              <SubmitButton className="btn btn-outline !min-h-[42px] !px-5 text-sm" pendingLabel="Signing out…">
                Sign out other devices
              </SubmitButton>
            </ActionForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
