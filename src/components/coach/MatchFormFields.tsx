"use client";

import { Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import {
  MATCH_VENUES,
  formatMatchVenueLabel,
  type MatchFormState,
} from "@/components/coach/match-form-utils";

export function MatchFormFields({
  form,
  onChange,
  idPrefix = "match",
}: {
  form: MatchFormState;
  onChange: (form: MatchFormState) => void;
  idPrefix?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${idPrefix}-venue`}>Home or away</Label>
        <Select
          id={`${idPrefix}-venue`}
          value={form.venue}
          onChange={(event) =>
            onChange({
              ...form,
              venue: event.target.value as MatchFormState["venue"],
            })
          }
          required
        >
          {MATCH_VENUES.map((venue) => (
            <option key={venue} value={venue}>
              {formatMatchVenueLabel(venue)}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-opponent`}>Opponent name</Label>
        <Input
          id={`${idPrefix}-opponent`}
          value={form.opponentName}
          onChange={(event) =>
            onChange({ ...form, opponentName: event.target.value })
          }
          placeholder="e.g. Beach Kings VC"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-location`}>Location</Label>
        <Input
          id={`${idPrefix}-location`}
          value={form.location}
          onChange={(event) =>
            onChange({ ...form, location: event.target.value })
          }
          placeholder="Court or venue address"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-warmup`}>Warm-up time</Label>
        <Input
          id={`${idPrefix}-warmup`}
          type="datetime-local"
          value={form.warmUpTime}
          onChange={(event) =>
            onChange({ ...form, warmUpTime: event.target.value })
          }
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-start`}>Match start</Label>
        <Input
          id={`${idPrefix}-start`}
          type="datetime-local"
          value={form.matchStart}
          onChange={(event) =>
            onChange({ ...form, matchStart: event.target.value })
          }
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-notes`}>Notes (optional)</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          value={form.notes}
          onChange={(event) =>
            onChange({ ...form, notes: event.target.value })
          }
          rows={3}
          placeholder="Kit colour, meeting point, etc."
        />
      </div>
    </div>
  );
}
