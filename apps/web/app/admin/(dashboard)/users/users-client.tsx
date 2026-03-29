"use client";

import { useActionState, useEffect, useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import {
  invitePortalUser,
  removePortalUser,
  updatePortalUserRole,
} from "@/lib/admin/users-actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalModal } from "@/components/ui/portal-modal";
import { cn } from "@/lib/utils";

/** Same pattern as `ContactStep` contact-role select: custom chevron + application form focus ring. */
const portalSelectClass =
  "flex h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white py-2 pl-4 pr-10 text-sm capitalize text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:border-emerald-600 focus-visible:ring-emerald-600 [&::-ms-expand]:hidden";

function PortalRoleSelect({
  wrapperClassName,
  className,
  ...props
}: ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative w-full min-w-0", wrapperClassName)}>
      <select className={cn(portalSelectClass, className)} {...props} />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

export type PortalUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
  status: "active" | "pending";
};

type Props = {
  users: PortalUserRow[];
  isAdmin: boolean;
  currentUserId: string;
};

const PORTAL_TIMEZONE = "Australia/Adelaide";

function formatAddedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: PORTAL_TIMEZONE,
  });
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PORTAL_TIMEZONE,
    hour12: true,
  });
}

function StatusBadge({ status }: { status: PortalUserRow["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
        active
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900"
      title="Invitation sent — not accepted yet"
    >
      pending
    </span>
  );
}

type RoleConfirm = {
  userId: string;
  fullName: string;
  email: string;
  fromRole: "admin" | "general";
  toRole: "admin" | "general";
};

function RoleChangeConfirmDialog({
  open,
  pending,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  pending: RoleConfirm | null;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const fromLabel = pending ? (pending.fromRole === "admin" ? "Admin" : "General User") : "";
  const toLabel = pending ? (pending.toRole === "admin" ? "Admin" : "General User") : "";
  const effectiveOpen = open && !!pending;

  return (
    <PortalModal open={effectiveOpen} onClose={onCancel} aria-labelledby="role-confirm-title">
      {pending ? (
        <>
          <h2 id="role-confirm-title" className="text-lg font-semibold text-[#0c2742]">
            Confirm role change
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Change role for <span className="font-medium text-slate-800">{pending.fullName}</span> ({pending.email})
            from <span className="font-medium text-[#1e4a7a]">{fromLabel}</span> to{" "}
            <span className="font-medium text-[#1e4a7a]">{toLabel}</span>?
          </p>
          {error ? (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading}
              className="border-0 bg-emerald-700 text-white hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600"
              onClick={onConfirm}
            >
              {loading ? "Updating…" : "Confirm change"}
            </Button>
          </div>
        </>
      ) : null}
    </PortalModal>
  );
}

export function UsersClient({ users, isAdmin, currentUserId }: Props) {
  const router = useRouter();
  const [inviteState, inviteAction, invitePending] = useActionState(invitePortalUser, null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [rolePending, setRolePending] = useState<RoleConfirm | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PortalUserRow | null>(null);
  const [selectRoles, setSelectRoles] = useState<Record<string, "admin" | "general">>(() =>
    Object.fromEntries(users.map((u) => [u.id, u.role === "admin" ? "admin" : "general"])),
  );

  useEffect(() => {
    setSelectRoles(Object.fromEntries(users.map((u) => [u.id, u.role === "admin" ? "admin" : "general"])));
  }, [users]);

  async function confirmRemoveUser() {
    if (!removeTarget) return;
    const id = removeTarget.id;
    setRemoveError(null);
    setRemovingId(id);
    try {
      const r = await removePortalUser(id);
      if (r.error) {
        setRemoveError(r.error);
        return;
      }
      setRemoveError(null);
      setRemoveTarget(null);
      router.refresh();
    } finally {
      setRemovingId(null);
    }
  }

  function onRoleSelectChange(user: PortalUserRow, next: "admin" | "general") {
    const current = user.role === "admin" ? "admin" : "general";
    if (next === current) return;
    setSelectRoles((s) => ({ ...s, [user.id]: current }));
    setRoleError(null);
    setRolePending({
      userId: user.id,
      fullName: user.full_name,
      email: user.email,
      fromRole: current,
      toRole: next,
    });
    setRoleDialogOpen(true);
  }

  function cancelRoleChange() {
    setRoleDialogOpen(false);
    setRolePending(null);
    setRoleError(null);
  }

  async function confirmRoleChange() {
    if (!rolePending) return;
    setRoleSaving(true);
    setRoleError(null);
    try {
      const r = await updatePortalUserRole(rolePending.userId, rolePending.toRole);
      if (r.error) {
        setRoleError(r.error);
        return;
      }
      cancelRoleChange();
      router.refresh();
    } finally {
      setRoleSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => {
          setRemoveTarget(null);
          setRemoveError(null);
        }}
        title="Remove this user?"
        description={
          removeTarget ? (
            <>
              <span className="font-medium text-slate-800">{removeTarget.full_name}</span> ({removeTarget.email}) will
              lose access and no longer be able to sign in. This cannot be undone from here.
            </>
          ) : null
        }
        confirmLabel="Remove user"
        loadingConfirmLabel="Removing…"
        confirmVariant="destructive"
        onConfirm={() => void confirmRemoveUser()}
        loading={removingId === removeTarget?.id}
        error={removeError}
      />

      <RoleChangeConfirmDialog
        open={roleDialogOpen}
        pending={rolePending}
        loading={roleSaving}
        error={roleError}
        onCancel={cancelRoleChange}
        onConfirm={() => void confirmRoleChange()}
      />

      {isAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-[#0c2742]">Invite user</h3>
          <p className="mt-1 text-sm text-slate-600">
            Sends an email with a link to accept the invitation and set a password. The address must be unique.
          </p>
          <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-3 text-xs leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-800">Roles</p>
            <p className="mt-2">
              <span className="font-medium text-slate-800">Admin.</span> Can invite and remove portal users,
              assign roles, and access all areas of this portal, including applications, audit log, report, and
              settings.
            </p>
            <p className="mt-2">
              <span className="font-medium text-slate-800">General user.</span> Can work with client applications
              and use audit log, report, and settings. Cannot invite or remove users or change anyone else&apos;s
              role.
            </p>
          </div>
          <form
            action={inviteAction}
            className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end"
          >
            <div className="space-y-2 md:col-span-3 min-w-0">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                autoComplete="off"
                required
                className="h-11 w-full min-w-0 rounded-lg border-slate-300 px-4"
              />
            </div>
            <div className="space-y-2 md:col-span-3 min-w-0">
              <Label htmlFor="invite-name">Profile name</Label>
              <Input
                id="invite-name"
                name="full_name"
                type="text"
                autoComplete="off"
                required
                className="h-11 w-full min-w-0 rounded-lg border-slate-300 px-4"
              />
            </div>
            <div className="space-y-2 md:col-span-2 min-w-0">
              <Label htmlFor="invite-role">Role</Label>
              <PortalRoleSelect id="invite-role" name="role" defaultValue="general">
                <option value="general">General User</option>
                <option value="admin">Admin</option>
              </PortalRoleSelect>
            </div>
            <div className="md:col-span-4 md:flex md:items-end">
              <Button
                type="submit"
                disabled={invitePending}
                className="h-11 w-full rounded-lg border-0 bg-emerald-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 md:w-auto md:min-w-[10.5rem]"
              >
                {invitePending ? "Sending…" : "Send invitation"}
              </Button>
            </div>
          </form>
          {inviteState?.error ? (
            <p className="mt-3 text-sm text-red-700">{inviteState.error}</p>
          ) : null}
          {inviteState?.ok ? (
            <p className="mt-3 text-sm text-emerald-800">Invitation email sent.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Only administrators can invite or remove users. You can view the team directory below.
        </p>
      )}

      <div className="overflow-x-auto overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Added</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3">Status</th>
              {isAdmin ? <th className="px-4 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="text-slate-800">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <PortalRoleSelect
                      wrapperClassName="min-w-[7.5rem] max-w-[11rem]"
                      value={selectRoles[u.id] ?? (u.role === "admin" ? "admin" : "general")}
                      onChange={(e) =>
                        onRoleSelectChange(u, e.target.value === "admin" ? "admin" : "general")
                      }
                      aria-label={`Role for ${u.full_name}`}
                    >
                      <option value="general">General User</option>
                      <option value="admin">Admin</option>
                    </PortalRoleSelect>
                  ) : (
                    <span className="capitalize text-slate-700">{u.role}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatAddedDate(u.created_at)}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatLastLogin(u.last_login_at)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={u.status} />
                </td>
                {isAdmin ? (
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUserId ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={removingId === u.id}
                        onClick={() => {
                          setRemoveError(null);
                          setRemoveTarget(u);
                        }}
                      >
                        {removingId === u.id ? "Removing…" : "Remove"}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No users yet.</p>
        ) : null}
      </div>
    </div>
  );
}
