"use client";

import { useActionState, useState } from "react";
import { invitePortalUser, removePortalUser } from "@/lib/admin/users-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PortalUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
};

type Props = {
  users: PortalUserRow[];
  isAdmin: boolean;
  currentUserId: string;
};

export function UsersClient({ users, isAdmin, currentUserId }: Props) {
  const [inviteState, inviteAction, invitePending] = useActionState(invitePortalUser, null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function onRemove(id: string) {
    if (!confirm("Remove this user? They will no longer be able to sign in.")) return;
    setRemoveError(null);
    setRemovingId(id);
    try {
      const r = await removePortalUser(id);
      if (r.error) setRemoveError(r.error);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {isAdmin ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-[#0c2742]">Invite user</h3>
          <p className="mt-1 text-sm text-slate-600">
            Sends an email with a link to accept the invitation and set a password. The address must be unique.
          </p>
          <form action={inviteAction} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" name="email" type="email" autoComplete="off" required className="h-10" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invite-name">Profile name</Label>
              <Input id="invite-name" name="full_name" type="text" autoComplete="off" required className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                name="role"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1e4a7a]/30"
                defaultValue="general"
              >
                <option value="general">General user</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <Button type="submit" disabled={invitePending} className="h-10 w-full sm:w-auto">
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

      {removeError ? <p className="text-sm text-red-700">{removeError}</p> : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Added</th>
              {isAdmin ? <th className="px-4 py-3 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="text-slate-800">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(u.created_at).toLocaleDateString("en-AU", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </td>
                {isAdmin ? (
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUserId ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={removingId === u.id}
                        onClick={() => void onRemove(u.id)}
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
