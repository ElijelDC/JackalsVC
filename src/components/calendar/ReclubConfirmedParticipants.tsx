"use client";

import { useState } from "react";
import type { ReclubMeetParticipant } from "@/lib/reclub-payload";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

function participantInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ParticipantAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = Boolean(imageUrl) && !imageError;

  return (
    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-jackals-surface">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-zinc-400">
          {participantInitials(name)}
        </span>
      )}
    </div>
  );
}

export function ReclubConfirmedParticipants({
  participants,
  className,
}: {
  participants: ReclubMeetParticipant[];
  className?: string;
}) {
  if (participants.length === 0) {
    return null;
  }

  return (
    <Card className={cn("bg-jackals-surface-muted/20", className)}>
      <CardTitle className="text-sm">
        Confirmed · {participants.length}
      </CardTitle>
      <CardDescription className="mt-2 text-xs">
        Players signed up on ReClub for this session.
      </CardDescription>
      <ul className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-3">
        {participants.map((participant) => (
          <li
            key={participant.name}
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <ParticipantAvatar
              name={participant.name}
              imageUrl={participant.imageUrl}
            />
            <span className="max-w-full truncate text-xs text-jackals-red-light">
              {participant.name}
            </span>
            {participant.isHost ? (
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                Host
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}
