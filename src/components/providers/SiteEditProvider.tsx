"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Pencil, PencilOff } from "lucide-react";
import { apiPut } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { SiteContentMap } from "@/lib/site-content";

type SiteEditContextValue = {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (enabled: boolean) => void;
  getText: (key: string, fallback: string) => string;
  saveText: (key: string, value: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const SiteEditContext = createContext<SiteEditContextValue | null>(null);

export function useSiteEdit() {
  return useContext(SiteEditContext);
}

export function SiteEditProvider({
  children,
  isAdmin,
  initialContent,
}: {
  children: ReactNode;
  isAdmin: boolean;
  initialContent: SiteContentMap;
}) {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const getText = useCallback(
    (key: string, fallback: string) => {
      const value = content[key]?.trim();
      return value || fallback;
    },
    [content],
  );

  const saveText = useCallback(
    async (key: string, value: string) => {
      const result = await apiPut("/api/admin/site-content", { key, value });
      if (!result.ok) {
        return { ok: false as const, error: result.error };
      }

      setContent((current) => ({ ...current, [key]: value }));
      router.refresh();
      return { ok: true as const };
    },
    [router],
  );

  const value = useMemo(
    () => ({
      isAdmin,
      editMode,
      setEditMode,
      getText,
      saveText,
    }),
    [isAdmin, editMode, getText, saveText],
  );

  return (
    <SiteEditContext.Provider value={value}>
      {children}
      {isAdmin && <SiteEditFab />}
    </SiteEditContext.Provider>
  );
}

function SiteEditFab() {
  const siteEdit = useSiteEdit();
  if (!siteEdit) return null;

  const { editMode, setEditMode } = siteEdit;

  return (
    <button
      type="button"
      onClick={() => setEditMode(!editMode)}
      className={cn(
        "fixed bottom-6 left-6 z-[90] flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95",
        editMode
          ? "border-jackals-red bg-jackals-red text-white shadow-jackals-red/30"
          : "border-white/15 bg-zinc-900/95 text-zinc-300 hover:border-jackals-red/40 hover:text-white",
      )}
      aria-pressed={editMode}
      aria-label={editMode ? "Exit edit mode" : "Enter edit mode"}
      title={editMode ? "Exit edit mode" : "Edit site text"}
    >
      {editMode ? <PencilOff className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
    </button>
  );
}
