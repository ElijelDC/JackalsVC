"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, Loader2, Trash2 } from "lucide-react";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { apiDelete, apiGet, apiPut } from "@/lib/client-api";
import {
  formatMembershipStatusLabel,
  formatMembershipSubscriptionOrCoachLabel,
} from "@/lib/membership-status";
import { cn } from "@/lib/utils";

type UserMembership = {
  id: string;
  status: string;
  paymentSchedule: string;
  startDate: string;
  endDate: string;
  planName: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  memberships: UserMembership[];
  _count: { memberships: number; orders: number; eventReminders: number };
};

const ROLES = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
] as const;

type UserSort = "name_asc" | "name_desc" | "joined_asc";

function roleLabel(role: string) {
  return ROLES.find((item) => item.value === role)?.label ?? role;
}

function roleTone(role: string) {
  if (role === "ADMIN") return "text-jackals-gold bg-jackals-gold/10";
  return "text-zinc-400 bg-white/[0.06]";
}

function MembershipDetails({ memberships }: { memberships: UserMembership[] }) {
  if (memberships.length === 0) {
    return <p className="text-sm text-zinc-500">No membership on file.</p>;
  }

  return (
    <ul className="space-y-2">
      {memberships.map((membership) => (
        <li key={membership.id} className="text-sm text-zinc-300">
          <p className="font-medium text-white">
            {formatMembershipSubscriptionOrCoachLabel(
              membership.planName,
              membership.paymentSchedule,
              membership.status,
            )}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {formatMembershipStatusLabel(membership.status)} ·{" "}
            {format(new Date(membership.startDate), "d MMM yyyy")} –{" "}
            {format(new Date(membership.endDate), "d MMM yyyy")}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function UsersManager({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useSyncedListState(initialUsers);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<UserSort>("name_asc");

  const displayedUsers = useMemo(() => {
    const filtered = users.filter((user) =>
      matchesAdminSearch(search, user.name, user.email, user.role),
    );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name_desc":
          return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
        case "joined_asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name_asc":
        default:
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }
    });
  }, [users, search, sortBy]);

  const hasActiveFilters = Boolean(search.trim()) || sortBy !== "name_asc";

  const loadUsers = useCallback(async () => {
    const result = await apiGet<{ users: User[] }>("/api/admin/users");
    if (result.ok) setUsers(result.data.users);
  }, [setUsers]);

  const handleRoleChange = async (userId: string, role: string) => {
    const previousRole = users.find((user) => user.id === userId)?.role;
    if (!previousRole || previousRole === role) return;

    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, role } : user)),
    );
    setUpdatingRoleId(userId);
    setError(null);

    const result = await apiPut(`/api/admin/users/${userId}`, { role });

    setUpdatingRoleId(null);

    if (!result.ok) {
      setError(result.error);
      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, role: previousRole } : user,
        ),
      );
      return;
    }

    await loadUsers();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user and all their data?")) return;

    setDeletingId(id);
    setError(null);
    const result = await apiDelete(`/api/admin/users/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (expandedId === id) setExpandedId(null);
    await loadUsers();
    router.refresh();
  };

  return (
    <AdminSection
      title="Users"
      description="View registered accounts, change roles, or remove users."
    >
      {error && <p className="mb-4 text-sm text-jackals-red-light">{error}</p>}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <AdminSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, role…"
            />
          </div>
          <div className="w-full sm:w-52">
            <Label htmlFor="users-sort">Sort by</Label>
            <Select
              id="users-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as UserSort)
              }
            >
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="joined_asc">Join date (oldest first)</option>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            All users ({displayedUsers.length}
            {search.trim() ? ` of ${users.length}` : ""})
          </h3>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSortBy("name_asc");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {displayedUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
            <p className="font-semibold text-white">
              {search.trim() ? "No users match your search." : "No users yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col />
                  <col className="w-[28%]" />
                  <col className="w-[5.5rem]" />
                  <col className="w-[6.5rem]" />
                  <col className="w-[3rem]" />
                </colgroup>
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2.5 font-medium">Name</th>
                    <th className="px-2 py-2.5 font-medium">Email</th>
                    <th className="px-2 py-2.5 font-medium">Role</th>
                    <th className="px-2 py-2.5 font-medium">Joined</th>
                    <th className="px-2 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {displayedUsers.map((user) => {
                    const expanded = expandedId === user.id;
                    const busy =
                      updatingRoleId === user.id || deletingId === user.id;

                    return (
                      <Fragment key={user.id}>
                        <tr className="bg-white/[0.015] transition hover:bg-white/[0.03]">
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(expanded ? null : user.id)
                              }
                              className="group flex min-w-0 items-center gap-1.5 text-left"
                            >
                              <ChevronDown
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                                  expanded && "rotate-180",
                                )}
                              />
                              <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                                {user.name}
                              </span>
                            </button>
                          </td>
                          <td className="px-2 py-2">
                            <span className="block truncate text-zinc-400">
                              {user.email}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <span
                              className={cn(
                                "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                                roleTone(user.role),
                              )}
                            >
                              {roleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-xs text-zinc-500 whitespace-nowrap">
                            {format(new Date(user.createdAt), "d MMM yyyy")}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="Delete"
                                disabled={busy}
                                onClick={() => void handleDelete(user.id)}
                                className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                              >
                                {deletingId === user.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="bg-black/20">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-2">
                                  <p className="text-xs uppercase tracking-wide text-zinc-500">
                                    Membership
                                  </p>
                                  <MembershipDetails
                                    memberships={user.memberships}
                                  />
                                  <div className="space-y-1 pt-2 text-sm text-zinc-500">
                                    <p>
                                      Orders:{" "}
                                      <span className="text-zinc-300">
                                        {user._count.orders}
                                      </span>
                                    </p>
                                    <p>
                                      Event reminders:{" "}
                                      <span className="text-zinc-300">
                                        {user._count.eventReminders}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <div className="max-w-xs">
                                  <Label
                                    htmlFor={`user-role-${user.id}`}
                                    className="text-xs uppercase tracking-wide text-zinc-500"
                                  >
                                    Role
                                  </Label>
                                  <Select
                                    id={`user-role-${user.id}`}
                                    value={user.role}
                                    onChange={(event) =>
                                      void handleRoleChange(
                                        user.id,
                                        event.target.value,
                                      )
                                    }
                                    disabled={busy}
                                    aria-label={`Role for ${user.name}`}
                                    className="mt-1 py-2 text-sm"
                                  >
                                    {ROLES.map((role) => (
                                      <option key={role.value} value={role.value}>
                                        {role.label}
                                      </option>
                                    ))}
                                  </Select>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 lg:hidden">
              {displayedUsers.map((user) => {
                const expanded = expandedId === user.id;
                const busy =
                  updatingRoleId === user.id || deletingId === user.id;

                return (
                  <article
                    key={user.id}
                    className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : user.id)
                        }
                        className="group flex min-w-0 flex-1 items-start gap-1.5 text-left"
                      >
                        <ChevronDown
                          className={cn(
                            "mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                            expanded && "rotate-180",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-white group-hover:text-jackals-gold">
                            {user.name}
                          </p>
                          <p className="truncate text-sm text-zinc-500">
                            {user.email}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                                roleTone(user.role),
                              )}
                            >
                              {roleLabel(user.role)}
                            </span>
                            <span className="text-xs text-zinc-500">
                              Joined {format(new Date(user.createdAt), "d MMM yyyy")}
                            </span>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={busy}
                        onClick={() => void handleDelete(user.id)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {expanded ? (
                      <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                        <div>
                          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
                            Membership
                          </p>
                          <MembershipDetails memberships={user.memberships} />
                        </div>
                        <div className="space-y-1 text-sm text-zinc-500">
                          <p>
                            Orders:{" "}
                            <span className="text-zinc-300">
                              {user._count.orders}
                            </span>
                          </p>
                          <p>
                            Event reminders:{" "}
                            <span className="text-zinc-300">
                              {user._count.eventReminders}
                            </span>
                          </p>
                        </div>
                        <div>
                          <Label
                            htmlFor={`user-role-mobile-${user.id}`}
                            className="text-xs text-zinc-500"
                          >
                            Role
                          </Label>
                          <Select
                            id={`user-role-mobile-${user.id}`}
                            value={user.role}
                            onChange={(event) =>
                              void handleRoleChange(user.id, event.target.value)
                            }
                            disabled={busy}
                            aria-label={`Role for ${user.name}`}
                            className="mt-1 py-2 text-sm"
                          >
                            {ROLES.map((role) => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminSection>
  );
}
