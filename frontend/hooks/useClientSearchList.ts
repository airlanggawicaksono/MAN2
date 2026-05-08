"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";

type UseClientSearchListOptions<T> = {
  items: T[];
  searchText?: string;
  debounceMs?: number;
  minQueryLength?: number;
  getSearchText: (item: T) => string;
};

type UseClientSearchListResult<T> = {
  query: string;
  setQuery: (value: string) => void;
  debouncedQuery: string;
  filteredItems: T[];
};

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

export function useClientSearchList<T>({
  items,
  searchText,
  debounceMs = 250,
  minQueryLength = 0,
  getSearchText,
}: UseClientSearchListOptions<T>): UseClientSearchListResult<T> {
  const [internalQuery, setInternalQuery] = useState("");
  const query = searchText ?? internalQuery;
  const setQuery = searchText === undefined ? setInternalQuery : () => {};
  const debouncedQuery = useDebounce(query, debounceMs);

  const filteredItems = useMemo(() => {
    const q = normalizeText(debouncedQuery);
    if (!q || q.length < minQueryLength) return items;
    return items.filter((item) => normalizeText(getSearchText(item)).includes(q));
  }, [debouncedQuery, getSearchText, items, minQueryLength]);

  return {
    query,
    setQuery,
    debouncedQuery,
    filteredItems,
  };
}

