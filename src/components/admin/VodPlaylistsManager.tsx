"use client";

import { useCallback, useEffect, useState } from "react";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AdminSection } from "@/components/admin/AdminShell";
import { apiPut } from "@/lib/client-api";
import {
  isLikelyYoutubeUrl,
  vodPlaylistContentKey,
  type TeamVodPlaylists,
} from "@/lib/vod-playlists";

export function VodPlaylistsManager({
  initialPlaylists,
}: {
  initialPlaylists: TeamVodPlaylists[];
}) {
  const [rows, setRows] = useState(initialPlaylists);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialPlaylists);
  }, [initialPlaylists]);

  const updateField = (
    teamKey: string,
    field: "trainingUrl" | "matchesUrl",
    value: string,
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.trainingTeamKey === teamKey ? { ...row, [field]: value } : row,
      ),
    );
  };

  const saveTeam = useCallback(async (team: TeamVodPlaylists) => {
    setSavingKey(team.trainingTeamKey);
    setMessage(null);
    setError(null);

    const training = (team.trainingUrl ?? "").trim();
    const matches = (team.matchesUrl ?? "").trim();

    if (training && !isLikelyYoutubeUrl(training)) {
      setError(`${team.teamName}: training URL should be a YouTube link.`);
      setSavingKey(null);
      return;
    }
    if (matches && !isLikelyYoutubeUrl(matches)) {
      setError(`${team.teamName}: match playlist URL should be a YouTube link.`);
      setSavingKey(null);
      return;
    }

    const trainingResult = await apiPut("/api/admin/site-content", {
      key: vodPlaylistContentKey(team.trainingTeamKey, "training"),
      value: training,
    });
    if (!trainingResult.ok) {
      setError(trainingResult.error);
      setSavingKey(null);
      return;
    }

    const matchesResult = await apiPut("/api/admin/site-content", {
      key: vodPlaylistContentKey(team.trainingTeamKey, "matches"),
      value: matches,
    });
    if (!matchesResult.ok) {
      setError(matchesResult.error);
      setSavingKey(null);
      return;
    }

    setMessage(`Saved YouTube playlists for ${team.teamName}.`);
    setSavingKey(null);
  }, []);

  return (
    <AdminSection
      title="YouTube playlists"
      description="VOD Training and Match playlist links shown on each member’s dashboard next to Upcoming club events. Set one pair per squad."
    >
      {message ? <p className="mb-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

      <div className="space-y-4">
        {rows.map((team) => (
          <div
            key={team.trainingTeamKey}
            className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-white">{team.teamName}</h3>
                <p className="font-mono text-xs text-zinc-500">{team.trainingTeamKey}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={savingKey === team.trainingTeamKey}
                onClick={() => void saveTeam(team)}
              >
                {savingKey === team.trainingTeamKey ? "Saving…" : "Save"}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`vod-training-${team.trainingTeamKey}`}>
                  VOD Training playlist
                </Label>
                <Input
                  id={`vod-training-${team.trainingTeamKey}`}
                  type="url"
                  placeholder="https://www.youtube.com/playlist?list=…"
                  value={team.trainingUrl ?? ""}
                  onChange={(event) =>
                    updateField(
                      team.trainingTeamKey,
                      "trainingUrl",
                      event.target.value,
                    )
                  }
                />
              </div>
              <div>
                <Label htmlFor={`vod-matches-${team.trainingTeamKey}`}>
                  Match playlist
                </Label>
                <Input
                  id={`vod-matches-${team.trainingTeamKey}`}
                  type="url"
                  placeholder="https://www.youtube.com/playlist?list=…"
                  value={team.matchesUrl ?? ""}
                  onChange={(event) =>
                    updateField(
                      team.trainingTeamKey,
                      "matchesUrl",
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>
        ))}

        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            Add training squads first, then set their YouTube playlists here.
          </p>
        ) : null}
      </div>
    </AdminSection>
  );
}
