import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface GlobalFiltersState {
  activeTahunAjaran: string | null;
}

const STORAGE_KEY = "simandaya.globalFilters";

const DEFAULTS: GlobalFiltersState = {
  activeTahunAjaran: null,
};

function loadFilters(): GlobalFiltersState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<GlobalFiltersState>;
    return {
      activeTahunAjaran:
        typeof parsed.activeTahunAjaran === "string" ? parsed.activeTahunAjaran : null,
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(state: GlobalFiltersState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

const globalFiltersSlice = createSlice({
  name: "globalFilters",
  initialState: loadFilters(),
  reducers: {
    setActiveTahunAjaran(state, action: PayloadAction<string | null>) {
      state.activeTahunAjaran = action.payload;
      persist(state);
    },
    clearGlobalFilters(state) {
      state.activeTahunAjaran = null;
      persist(state);
    },
  },
});

export const { setActiveTahunAjaran, clearGlobalFilters } = globalFiltersSlice.actions;

export default globalFiltersSlice.reducer;
