import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ExportFormat } from "@/lib/exportSheet";

interface PreferencesState {
  defaultExportFormat: ExportFormat;
  defaultPageSize: number;
}

const STORAGE_KEY = "simandaya.preferences";

const DEFAULTS: PreferencesState = {
  defaultExportFormat: "xlsx",
  defaultPageSize: 30,
};

function loadPreferences(): PreferencesState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PreferencesState>;
    return {
      defaultExportFormat: parsed.defaultExportFormat ?? DEFAULTS.defaultExportFormat,
      defaultPageSize:
        typeof parsed.defaultPageSize === "number" && parsed.defaultPageSize > 0
          ? parsed.defaultPageSize
          : DEFAULTS.defaultPageSize,
    };
  } catch {
    return DEFAULTS;
  }
}

function persist(state: PreferencesState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

const preferencesSlice = createSlice({
  name: "preferences",
  initialState: loadPreferences(),
  reducers: {
    setDefaultExportFormat(state, action: PayloadAction<ExportFormat>) {
      state.defaultExportFormat = action.payload;
      persist(state);
    },
    setDefaultPageSize(state, action: PayloadAction<number>) {
      state.defaultPageSize = action.payload;
      persist(state);
    },
    resetPreferences(state) {
      state.defaultExportFormat = DEFAULTS.defaultExportFormat;
      state.defaultPageSize = DEFAULTS.defaultPageSize;
      persist(state);
    },
  },
});

export const {
  setDefaultExportFormat,
  setDefaultPageSize,
  resetPreferences,
} = preferencesSlice.actions;

export default preferencesSlice.reducer;
