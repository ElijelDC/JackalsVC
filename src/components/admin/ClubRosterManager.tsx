"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client-api";

type ClubMember = {
  id: string;
  vlyNumber: string;
  name: string;
  active: boolean;
  userId: string | null;
  user: { id: string; email: string } | null;
};

const emptyForm = {
  vlyNumber: "",
  name: "",
};

export function ClubRosterManager({
  initialClubMembers,
}: {
  initialClubMembers: ClubMember[];
}) {
  const [clubMembers, setClubMembers] = useState(initialClubMembers);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(
    () =>
      clubMembers.filter((member) =>
        matchesAdminSearch(
          search,
          member.vlyNumber,
          member.name,
          member.user?.email ?? "",
          member.active ? "active" : "inactive",
        ),
      ),
    [clubMembers, search],
  );

  const loadClubMembers = useCallback(async () => {
    const result = await apiGet<{ clubMembers: ClubMember[] }>(
      "/api/admin/club-members",
    );
    if (result.ok) {
      setClubMembers(result.data.clubMembers);
    }
  }, []);

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPost(
      "/api/admin/club-members",
      form,
      "Failed to add roster entry",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setForm(emptyForm);
    setMessage("Roster entry added");
    await loadClubMembers();
  };

  const toggleActive = async (member: ClubMember) => {
    setLoading(true);
    setError(null);

    const result = await apiPatch(
      `/api/admin/club-members/${member.id}`,
      { active: !member.active },
      "Failed to update roster entry",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await loadClubMembers();
  };

  const removeMember = async (member: ClubMember) => {
    if (member.userId) return;

    setLoading(true);
    setError(null);

    const result = await apiDelete(
      `/api/admin/club-members/${member.id}`,
      "Failed to remove roster entry",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await loadClubMembers();
  };

  return (
    <AdminSection
      title="VLY roster"
      description="Club members allowed to register. A VLY number must exist here before someone can create an account."
    >
      <AdminFormCard
        title="Add roster entry"
        error={error}
        message={message}
        onSubmit={addMember}
        submitLabel={loading ? "Saving..." : "Add to roster"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="roster-vly">VLY number</Label>
            <Input
              id="roster-vly"
              value={form.vlyNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  vlyNumber: event.target.value.toUpperCase(),
                }))
              }
              placeholder="VLY12345"
              required
            />
          </div>
          <div>
            <Label htmlFor="roster-name">Full name</Label>
            <Input
              id="roster-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </div>
        </div>
      </AdminFormCard>

      <div className="mt-6">
        <AdminSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search VLY number, name, or email..."
        />

        <div className="mt-4 space-y-2">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-white">
                  {member.vlyNumber} · {member.name}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {member.user
                    ? `Registered as ${member.user.email}`
                    : "Not registered yet"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    member.active
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                  }
                >
                  {member.active ? "Active" : "Inactive"}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading}
                  onClick={() => toggleActive(member)}
                >
                  {member.active ? "Deactivate" : "Activate"}
                </Button>
                {!member.userId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    onClick={() => removeMember(member)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {filteredMembers.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              No roster entries match your search.
            </p>
          )}
        </div>
      </div>
    </AdminSection>
  );
}
