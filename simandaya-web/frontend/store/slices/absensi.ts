import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

interface AbsensiState {
  absensiDate: string;
  absensiSearch: string;
  izinKeluarDate: string;
  izinKeluarSearch: string;
}

const initialState: AbsensiState = {
  absensiDate: "",
  absensiSearch: "",
  izinKeluarDate: "",
  izinKeluarSearch: "",
};

const berandaSlice = createSlice({
  name: "absensi",
  initialState,
  reducers: {
    setAbsensiDate(state, action: PayloadAction<string>) {
      state.absensiDate = action.payload;
    },
    shiftAbsensiDate(state, action: PayloadAction<number>) {
      const d = new Date(state.absensiDate + "T00:00:00");
      d.setDate(d.getDate() + action.payload);
      state.absensiDate = toDateStr(d);
    },
    setAbsensiSearch(state, action: PayloadAction<string>) {
      state.absensiSearch = action.payload;
    },
    setIzinKeluarDate(state, action: PayloadAction<string>) {
      state.izinKeluarDate = action.payload;
    },
    shiftIzinKeluarDate(state, action: PayloadAction<number>) {
      const d = new Date(state.izinKeluarDate + "T00:00:00");
      d.setDate(d.getDate() + action.payload);
      state.izinKeluarDate = toDateStr(d);
    },
    setIzinKeluarSearch(state, action: PayloadAction<string>) {
      state.izinKeluarSearch = action.payload;
    },
  },
});

export const {
  setAbsensiDate,
  shiftAbsensiDate,
  setAbsensiSearch,
  setIzinKeluarDate,
  shiftIzinKeluarDate,
  setIzinKeluarSearch,
} = berandaSlice.actions;

export default berandaSlice.reducer;
