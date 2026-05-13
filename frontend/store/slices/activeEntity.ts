import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ActiveEntityType = "student" | "teacher";

export interface ActiveEntityRef {
  id: string;
  type: ActiveEntityType;
  label: string;
  href: string;
}

interface ActiveEntityState {
  lastViewed: ActiveEntityRef | null;
}

const STORAGE_KEY = "simandaya.activeEntity";

const DEFAULTS: ActiveEntityState = {
  lastViewed: null,
};

function load(): ActiveEntityState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<ActiveEntityState>;
    if (!parsed.lastViewed) return DEFAULTS;
    const { id, type, label, href } = parsed.lastViewed;
    if (!id || !type || !label || !href) return DEFAULTS;
    return { lastViewed: { id, type, label, href } };
  } catch {
    return DEFAULTS;
  }
}

function persist(state: ActiveEntityState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

const activeEntitySlice = createSlice({
  name: "activeEntity",
  initialState: load(),
  reducers: {
    setLastViewedEntity(state, action: PayloadAction<ActiveEntityRef>) {
      state.lastViewed = action.payload;
      persist(state);
    },
    clearLastViewedEntity(state) {
      state.lastViewed = null;
      persist(state);
    },
  },
});

export const { setLastViewedEntity, clearLastViewedEntity } = activeEntitySlice.actions;

export default activeEntitySlice.reducer;
