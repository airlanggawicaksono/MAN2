import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type KurikulumKelompokFilter =
  | "ALL"
  | "Wajib"
  | "Peminatan"
  | "Muatan Lokal"
  | "Keagamaan";

interface KurikulumUiState {
  selectedTahunAjaranId: string;
  mapelSearch: string;
  mapelKelompokFilter: KurikulumKelompokFilter;
  kelompokFilterByTingkat: Record<string, KurikulumKelompokFilter>;
}

const initialState: KurikulumUiState = {
  selectedTahunAjaranId: "",
  mapelSearch: "",
  mapelKelompokFilter: "ALL",
  kelompokFilterByTingkat: {
    X: "ALL",
    XI: "ALL",
    XII: "ALL",
  },
};

const kurikulumSlice = createSlice({
  name: "kurikulum",
  initialState,
  reducers: {
    setSelectedTahunAjaranId(state, action: PayloadAction<string>) {
      state.selectedTahunAjaranId = action.payload;
    },
    setMapelSearch(state, action: PayloadAction<string>) {
      state.mapelSearch = action.payload;
    },
    setMapelKelompokFilter(state, action: PayloadAction<KurikulumKelompokFilter>) {
      state.mapelKelompokFilter = action.payload;
    },
    setKelompokFilterByTingkat(
      state,
      action: PayloadAction<{ tingkat: string; filter: KurikulumKelompokFilter }>,
    ) {
      state.kelompokFilterByTingkat[action.payload.tingkat] = action.payload.filter;
    },
    resetMapelPickerUi(state) {
      state.mapelSearch = "";
      state.mapelKelompokFilter = "ALL";
    },
  },
});

export const {
  setSelectedTahunAjaranId,
  setMapelSearch,
  setMapelKelompokFilter,
  setKelompokFilterByTingkat,
  resetMapelPickerUi,
} = kurikulumSlice.actions;

export default kurikulumSlice.reducer;
