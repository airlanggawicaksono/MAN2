import { useState } from "react";
import { useDebounce } from "./useDebounce";

const DEFAULT_LIMIT = 30;

export function useCrudListPage<T>(limit = DEFAULT_LIMIT) {
  const [skip, setSkip] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const [editTarget, setEditTarget] = useState<T | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSkip(0);
  };

  return {
    skip,
    setSkip,
    limit,
    searchInput,
    debouncedSearch: debouncedSearch || undefined,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    handleSearchChange,
  };
}
