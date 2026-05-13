"use client";

import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  openAddDialog,
  closeAddDialog,
  openEditDialog,
  closeEditDialog,
  openDeleteDialog,
  closeDeleteDialog,
} from "@/store/slices/cms";
import {
  useListSlidesQuery,
  useCreateSlideMutation,
  useUpdateSlideMutation,
  useDeleteSlideMutation,
} from "@/api/admin/setContentManagement";
import type { CarouselSlide, ContentType, CreateSlideRequest } from "@/types/cms";

export function useCmsSettingsController() {
  const dispatch = useAppDispatch();
  const { isAddDialogOpen, isEditDialogOpen, isDeleteDialogOpen, selectedSlide } =
    useAppSelector((state) => state.cms);
  const [activeType, setActiveType] = useState<ContentType>("carousel");

  const { data: allSlides = [], isLoading: loadingSlides } = useListSlidesQuery();
  const [createSlide, { isLoading: creating }] = useCreateSlideMutation();
  const [updateSlide, { isLoading: updating }] = useUpdateSlideMutation();
  const [deleteSlide, { isLoading: deleting }] = useDeleteSlideMutation();

  const dataMap: Record<ContentType, { items: CarouselSlide[]; loading: boolean }> = useMemo(
    () => ({
      carousel: { items: allSlides.filter((s) => s.type === "carousel"), loading: loadingSlides },
      flyer: { items: allSlides.filter((s) => s.type === "flyer"), loading: loadingSlides },
      media: { items: allSlides.filter((s) => s.type === "media"), loading: loadingSlides },
      video: { items: allSlides.filter((s) => s.type === "video"), loading: loadingSlides },
      lokasi: { items: allSlides.filter((s) => s.type === "lokasi"), loading: loadingSlides },
    }),
    [allSlides, loadingSlides],
  );

  async function handleCreate(data: CreateSlideRequest) {
    await createSlide({ ...data, type: activeType }).unwrap();
    dispatch(closeAddDialog());
  }

  async function handleUpdate(data: CreateSlideRequest) {
    if (!selectedSlide) return;
    await updateSlide({ id: selectedSlide.id, body: data }).unwrap();
    dispatch(closeEditDialog());
  }

  async function handleDelete() {
    if (!selectedSlide) return;
    await deleteSlide(selectedSlide.id).unwrap();
    dispatch(closeDeleteDialog());
  }

  async function handleToggleActive(id: string, current: boolean) {
    await updateSlide({ id, body: { is_active: !current } }).unwrap();
  }

  function openAddFor(type: ContentType) {
    setActiveType(type);
    dispatch(openAddDialog());
  }

  function openEditFor(type: ContentType, slide: CarouselSlide) {
    setActiveType(type);
    dispatch(openEditDialog(slide));
  }

  function openDeleteFor(type: ContentType, slide: CarouselSlide) {
    setActiveType(type);
    dispatch(openDeleteDialog(slide));
  }

  return {
    isAddDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    selectedSlide,
    activeType,
    creating,
    updating,
    deleting,
    dataMap,
    handleCreate,
    handleUpdate,
    handleDelete,
    handleToggleActive,
    openAddFor,
    openEditFor,
    openDeleteFor,
    closeAddDialog: () => dispatch(closeAddDialog()),
    closeEditDialog: () => dispatch(closeEditDialog()),
    closeDeleteDialog: () => dispatch(closeDeleteDialog()),
  };
}

