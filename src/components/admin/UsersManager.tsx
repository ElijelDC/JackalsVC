"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Label, Select } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPut } from "@/lib/client-api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { memberships: number; orders: number; eventReminders: number };
};

const emptyForm = { role: "MEMBER" };

export function UsersManager({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesAdminSearch(search, user.name, user.email, user.role),
      ),
    [users, search],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const loadUsers = useCallback(async () => {
    const result = await apiGet<{ users: User[] }>("/api/admin/users");
    if (result.ok) setUsers(result.data.users);
  }, []);

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setForm({ role: user.role });
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPut(`/api/admin/users/${editingId}`, form);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("User updated.");
    resetForm();
    await loadUsers();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user and all their data?")) return;

    setDeletingId(id);
    const result = await apiDelete(`/api/admin/users/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingId === id) resetForm();
    await loadUsers();
    router.refresh();
  };

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  return (
    <AdminSection
      title="Users"
      description="View registered accounts, change roles, or remove users."
    >
      {editingId && (
        <AdminFormCard
          title="Edit user role"
          error={error}
          message={message}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          submitLabel="Save changes"
          loading={loading}
        >
          <div>
            <Label htmlFor="user-role">Role</Label>
            <Select
              id="user-role"
              value={form.role}
              onChange={(e) => setForm({ role: e.target.value })}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
        </AdminFormCard>
      )}

      {!editingId && error && (
        <p className="mb-4 text-sm text-jackals-red-light">{error}</p>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            All users ({filteredUsers.length}
            {search.trim() ? ` of ${users.length}` : ""})
          </h3>
          <div className="w-full sm:max-w-xs">
            <AdminSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, role…"
            />
          </div>
        </div>
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim() ? "No users match your search." : "No users yet."}
          </p>
        ) : (
          filteredUsers.map((user) => (
          <AdminListItem
            key={user.id}
            title={`${user.name} · ${user.role}`}
            subtitle={`${user.email} · Joined ${format(new Date(user.createdAt), "d MMM yyyy")} · ${user._count.memberships} membership${user._count.memberships !== 1 ? "s" : ""} · ${user._count.orders} order${user._count.orders !== 1 ? "s" : ""}`}
            onEdit={() => startEdit(user)}
            onDelete={() => handleDelete(user.id)}
            deleting={deletingId === user.id}
          />
          ))
        )}
      </div>
    </AdminSection>
  );
}
