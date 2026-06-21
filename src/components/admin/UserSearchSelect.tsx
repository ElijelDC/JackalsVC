"use client";

import { useMemo, useState } from "react";
import { Input, Label, Select } from "@/components/ui/Input";
import { matchesAdminSearch } from "@/components/admin/AdminSearchBar";

type UserOption = { id: string; name: string; email: string };

export function UserSearchSelect({
  users,
  value,
  onChange,
  id = "user-search",
}: {
  users: UserOption[];
  value: string;
  onChange: (userId: string) => void;
  id?: string;
}) {
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesAdminSearch(search, user.name, user.email),
      ),
    [users, search],
  );

  const selectedUser = users.find((user) => user.id === value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>User</Label>
      <Input
        id={id}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
      />
      {selectedUser && (
        <p className="text-xs text-zinc-500">
          Selected: {selectedUser.name} ({selectedUser.email})
        </p>
      )}
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">
          {filteredUsers.length === 0
            ? "No users match your search"
            : "Select user…"}
        </option>
        {filteredUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </Select>
      {search.trim() && (
        <p className="text-xs text-zinc-500">
          {filteredUsers.length} of {users.length} users shown
        </p>
      )}
    </div>
  );
}
