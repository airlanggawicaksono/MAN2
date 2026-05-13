"use client";

import { useCmsSettingsController } from "@/hooks/admin/manajemen/use-cms-settings-controller";
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
import type { CarouselSlide, ContentType } from "@/types/cms";
import { AdminPageShell } from "@/app/components/admin/admin-page-shell";
import { MediaListSkeleton } from "@/app/components/skeletons";
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
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
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
          <MediaListSkeleton rows={3} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 py-8">
            <Icon className="h-8 w-8 text-primary/60" />
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
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/35"
              >
                {/* Thumbnail */}
                {slide.type === "video" && slide.link_url ? (
                  (() => {
                    const vid = extractYouTubeId(slide.link_url!);
                    return vid ? (
                      <img
                        src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`}
                        alt="Video"
                        loading="lazy"
                        className="rounded w-20 h-14 object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded bg-muted/45">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                    );
                  })()
                ) : slide.type === "lokasi" ? (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded bg-muted/45">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                ) : slide.image_url ? (
                  <img
                    src={slide.image_url}
                    alt={slide.title || ""}
                    loading="lazy"
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
  const {
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
    closeAddDialog,
    closeEditDialog,
    closeDeleteDialog,
  } = useCmsSettingsController();

  return (
    <AdminPageShell
      eyebrow="Manajemen Data"
      title="Pengaturan Konten"
      description="Kelola seluruh konten halaman utama."
    >

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
        onOpenChange={(open) => !open && closeAddDialog()}
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
        onOpenChange={(open) => !open && closeEditDialog()}
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
        onOpenChange={(open) => !open && closeDeleteDialog()}
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
            <Button variant="outline" onClick={closeDeleteDialog}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
