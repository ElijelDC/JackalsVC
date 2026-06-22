import { Search } from "lucide-react";
import { Input, Label } from "@/components/ui/Input";

export function AdminSearchBar({
  value,
  onChange,
  placeholder = "Search…",
  id = "admin-search",
  showLabel = false,
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  showLabel?: boolean;
  label?: string;
}) {
  return (
    <div>
      {showLabel && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </div>
  );
}

export function matchesAdminSearch(query: string, ...fields: string[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field.toLowerCase().includes(q));
}
