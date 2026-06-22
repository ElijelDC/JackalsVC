"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiDelete, apiGet, apiPut } from "@/lib/client-api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { memberships: number; orders: number; eventReminders: number };
};

const ROLES = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
] as const;

type UserSort = "name_asc" | "name_desc" | "joined_asc";

export function UsersManager({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useSyncedListState(initialUsers);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
          <p className="text-sm text-zinc-400">
            {search.trim() ? "No users match your search." : "No users yet."}
          </p>
        ) : (
          displayedUsers.map((user) => (
            <Card
              key={user.id}
              className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{user.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {user.email} · Joined{" "}
                  {format(new Date(user.createdAt), "d MMM yyyy")} ·{" "}
                  {user._count.memberships} membership
                  {user._count.memberships !== 1 ? "s" : ""} ·{" "}
                  {user._count.orders} order
                  {user._count.orders !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
                <Select
                  value={user.role}
                  onChange={(event) =>
                    handleRoleChange(user.id, event.target.value)
                  }
                  disabled={updatingRoleId === user.id || deletingId === user.id}
                  aria-label={`Role for ${user.name}`}
                  className="min-h-11 min-w-0 flex-1 py-2 text-sm sm:min-w-[7.5rem] sm:flex-none sm:py-1.5"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === user.id || updatingRoleId === user.id}
                  onClick={() => handleDelete(user.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  {deletingId === user.id ? "..." : "Delete"}
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </AdminSection>
  );
}
