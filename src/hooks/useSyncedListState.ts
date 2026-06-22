"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

/** Client list state that falls back to server props until explicitly updated. */
export function useSyncedListState<T>(initialItems: T[]) {
  const [localItems, setLocalItems] = useState<T[] | null>(null);
  const initialRef = useRef(initialItems);

  useEffect(() => {
    initialRef.current = initialItems;
  }, [initialItems]);

  const setItems = useCallback((value: SetStateAction<T[]>) => {
    setLocalItems((prev) => {
      const current = prev ?? initialRef.current;
      return typeof value === "function" ? value(current) : value;
    });
  }, []);

  return [localItems ?? initialItems, setItems] as const;
}
