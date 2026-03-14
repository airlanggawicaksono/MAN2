"use client";

import { useState } from "react";
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
} from "@/api/setContentManagement";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SlideForm } from "./slide-form";
import type { CarouselSlide, CreateSlideRequest, ContentType } from "@/types/cms";
import {
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Film,
  Play,
  Video,
  MapPin,
} from "lucide-react";

const sections: {
  key: ContentType;
  label: string;
  description: string;
  icon: React.ElementType;
  addLabel: string;
}[] = [
  {
    key: "carousel",
    label: "Carousel Utama",
    description: "Slide hero di halaman utama",
    icon: Film,
    addLabel: "Tambah Slide",
  },
  {
    key: "flyer",
    label: "Flyer MAN 2",
    description: "Poster & flyer informasi",
    icon: ImageIcon,
    addLabel: "Tambah Flyer",
  },
  {
    key: "media",
    label: "Media Center",
    description: "Galeri foto kegiatan",
    icon: Play,
    addLabel: "Tambah Media",
  },
  {
    key: "video",
    label: "Video",
    description: "Video YouTube",
    icon: Video,
    addLabel: "Tambah Video",
  },
  {
    key: "lokasi",
    label: "Lokasi",
    description: "Peta Google Maps",
    icon: MapPin,
    addLabel: "Atur Lokasi",
  },
];

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function ContentBox({
  section,
  items,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: {
  section: (typeof sections)[number];
  items: CarouselSlide[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (slide: CarouselSlide) => void;
  onDelete: (slide: CarouselSlide) => void;
  onToggle: (id: string, current: boolean) => void;
}) {
  const Icon = section.icon;
  const isLokasi = section.key === "lokasi";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{section.label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {section.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{items.length}</Badge>
            {(!isLokasi || items.length === 0) && (
              <Button size="sm" onClick={onAdd}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                {isLokasi ? "Atur" : "Tambah"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Memuat...
          </p>
        ) : items.length === 0 ? (
          <div className="border border-dashed rounded-lg py-8 flex flex-col items-center gap-2">
            <Icon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Belum ada konten</p>
            <Button variant="outline" size="sm" onClick={onAdd}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              {section.addLabel}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((slide) => (
              <div
                key={slide.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Thumbnail */}
                {slide.type === "video" && slide.link_url ? (
                  (() => {
                    const vid = extractYouTubeId(slide.link_url!);
                    return vid ? (
                      <img
                        src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                        alt="Video"
                        className="rounded w-20 h-14 object-cover shrink-0"
                      />
                    ) : (
                      <div className="rounded w-20 h-14 bg-muted shrink-0 flex items-center justify-center">
                        <Video className="h-5 w-5 text-muted-foreground" />
                      </div>
                    );
                  })()
                ) : slide.type === "lokasi" ? (
                  <div className="rounded w-20 h-14 bg-green-50 shrink-0 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                ) : slide.image_url ? (
                  <img
                    src={slide.image_url}
                    alt={slide.title || ""}
                    className="rounded w-20 h-14 object-cover shrink-0"
                  />
                ) : (
                  <div
                    className={`${slide.bg} ${slide.fg} rounded w-20 h-14 flex items-center justify-center text-[10px] font-medium text-center p-1 shrink-0`}
                  >
                    {slide.title || "-"}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {slide.type === "video"
                        ? slide.link_url || "(Tanpa URL)"
                        : slide.type === "lokasi"
                          ? slide.title || "Google Maps"
                          : slide.title || "(Tanpa judul)"}
                    </span>
                    <Badge
                      variant={slide.is_active ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {slide.is_active ? "Aktif" : "Non-aktif"}
                    </Badge>
                  </div>
                  {slide.description && slide.type !== "lokasi" && (
                    <p className="text-xs text-muted-foreground truncate">
                      {slide.description}
                    </p>
                  )}
                  {slide.type === "lokasi" && slide.link_url && (
                    <p className="text-xs text-muted-foreground truncate">
                      {slide.link_url}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onToggle(slide.id, slide.is_active)}
                    title={slide.is_active ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {slide.is_active ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(slide)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(slide)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SettingPage() {
  const dispatch = useAppDispatch();
  const { isAddDialogOpen, isEditDialogOpen, isDeleteDialogOpen, selectedSlide } =
    useAppSelector((state) => state.cms);

  const [activeType, setActiveType] = useState<ContentType>("carousel");

  const { data: carouselItems = [], isLoading: loadingCarousel } = useListSlidesQuery("carousel");
  const { data: flyerItems = [], isLoading: loadingFlyer } = useListSlidesQuery("flyer");
  const { data: mediaItems = [], isLoading: loadingMedia } = useListSlidesQuery("media");
  const { data: videoItems = [], isLoading: loadingVideo } = useListSlidesQuery("video");
  const { data: lokasiItems = [], isLoading: loadingLokasi } = useListSlidesQuery("lokasi");

  const [createSlide, { isLoading: creating }] = useCreateSlideMutation();
  const [updateSlide, { isLoading: updating }] = useUpdateSlideMutation();
  const [deleteSlide, { isLoading: deleting }] = useDeleteSlideMutation();

  const dataMap: Record<ContentType, { items: CarouselSlide[]; loading: boolean }> = {
    carousel: { items: carouselItems, loading: loadingCarousel },
    flyer: { items: flyerItems, loading: loadingFlyer },
    media: { items: mediaItems, loading: loadingMedia },
    video: { items: videoItems, loading: loadingVideo },
    lokasi: { items: lokasiItems, loading: loadingLokasi },
  };

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

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Pengaturan Konten</h1>
        <p className="mt-1 text-muted-foreground">
          Kelola semua konten halaman utama
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map((section) => (
          <ContentBox
            key={section.key}
            section={section}
            items={dataMap[section.key].items}
            isLoading={dataMap[section.key].loading}
            onAdd={() => openAddFor(section.key)}
            onEdit={(slide) => openEditFor(section.key, slide)}
            onDelete={(slide) => openDeleteFor(section.key, slide)}
            onToggle={handleToggleActive}
          />
        ))}
      </div>

      {/* Dialog Tambah */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => !open && dispatch(closeAddDialog())}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {sections.find((s) => s.key === activeType)?.addLabel} Baru
            </DialogTitle>
            <DialogDescription>
              Isi detail konten yang akan ditampilkan.
            </DialogDescription>
          </DialogHeader>
          <SlideForm contentType={activeType} onSubmit={handleCreate} isLoading={creating} />
        </DialogContent>
      </Dialog>

      {/* Dialog Ubah */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => !open && dispatch(closeEditDialog())}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ubah Konten</DialogTitle>
            <DialogDescription>Ubah detail konten.</DialogDescription>
          </DialogHeader>
          {selectedSlide && (
            <SlideForm
              contentType={activeType}
              defaultValues={selectedSlide}
              onSubmit={handleUpdate}
              isLoading={updating}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Hapus */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => !open && dispatch(closeDeleteDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Konten</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus &quot;{selectedSlide?.title || selectedSlide?.link_url || "konten ini"}&quot;?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => dispatch(closeDeleteDialog())}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
