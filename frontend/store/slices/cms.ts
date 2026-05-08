import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CarouselSlide } from "@/types/cms";

interface CmsUiState {
  selectedSlide: CarouselSlide | null;
  isAddDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
}

const initialState: CmsUiState = {
  selectedSlide: null,
  isAddDialogOpen: false,
  isEditDialogOpen: false,
  isDeleteDialogOpen: false,
};

const cmsSlice = createSlice({
  name: "cms",
  initialState,
  reducers: {
    openAddDialog(state) {
      state.isAddDialogOpen = true;
    },
    closeAddDialog(state) {
      state.isAddDialogOpen = false;
    },
    openEditDialog(state, action: PayloadAction<CarouselSlide>) {
      state.selectedSlide = action.payload;
      state.isEditDialogOpen = true;
    },
    closeEditDialog(state) {
      state.isEditDialogOpen = false;
      state.selectedSlide = null;
    },
    openDeleteDialog(state, action: PayloadAction<CarouselSlide>) {
      state.selectedSlide = action.payload;
      state.isDeleteDialogOpen = true;
    },
    closeDeleteDialog(state) {
      state.isDeleteDialogOpen = false;
      state.selectedSlide = null;
    },
  },
});

export const {
  openAddDialog,
  closeAddDialog,
  openEditDialog,
  closeEditDialog,
  openDeleteDialog,
  closeDeleteDialog,
} = cmsSlice.actions;

export default cmsSlice.reducer;
