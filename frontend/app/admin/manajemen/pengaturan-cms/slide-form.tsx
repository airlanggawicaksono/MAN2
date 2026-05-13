"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, UploadCloud } from "lucide-react";
import type { CarouselSlide, CreateSlideRequest, ContentType, ImageFitMode } from "@/types/cms";
import { useUploadImageMutation } from "@/api/admin/setContentManagement";
import { validateWithAlert } from "@/lib/io-guards";
import { imageUploadValidationRules, slideLinkValidationRules } from "@/lib/form-validators";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  CMS_DEFAULT_IMAGE_FIT_BY_TYPE,
  CMS_IMAGE_FRAME_CLASS_BY_TYPE,
  CMS_SIZE_GUIDE,
} from "@/lib/cms-image-layout";

const BG_OPTIONS = [
  { label: "Primary", value: "bg-primary" },
  { label: "Secondary", value: "bg-secondary" },
  { label: "Accent", value: "bg-accent" },
  { label: "Muted", value: "bg-muted" },
  { label: "Destructive", value: "bg-destructive" },
  { label: "Card", value: "bg-card" },
];

const FG_OPTIONS = [
  { label: "Primary Foreground", value: "text-primary-foreground" },
  { label: "Secondary Foreground", value: "text-secondary-foreground" },
  { label: "Accent Foreground", value: "text-accent-foreground" },
  { label: "Muted Foreground", value: "text-muted-foreground" },
  { label: "Card Foreground", value: "text-card-foreground" },
];

const IMAGE_FIT_OPTIONS: { label: string; value: ImageFitMode; note: string }[] = [
  { label: "Cover (isi penuh)", value: "cover", note: "Gambar memenuhi frame, bisa terpotong." },
  { label: "Contain (utuh)", value: "contain", note: "Gambar utuh, bisa ada ruang kosong." },
  { label: "Stretch (tarik)", value: "fill", note: "Gambar ditarik agar pas frame (bisa distorsi)." },
];

interface Props {
  contentType: ContentType;
  defaultValues?: Partial<CarouselSlide>;
  onSubmit: (data: CreateSlideRequest) => void | Promise<void>;
  isLoading?: boolean;
}

function isManagedUploadUrl(url: string | null | undefined): boolean {
  return !!url && url.startsWith("/uploads/");
}

async function deleteUploadedFile(url: string): Promise<void> {
  await fetch("/api/cms/upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fitModeToClass(mode: ImageFitMode): string {
  if (mode === "contain") return "object-contain";
  if (mode === "fill") return "object-fill";
  return "object-cover";
}

function imagePreviewAspect(contentType: ContentType): string {
  if (contentType === "flyer") return CMS_IMAGE_FRAME_CLASS_BY_TYPE.flyer;
  if (contentType === "media") return CMS_IMAGE_FRAME_CLASS_BY_TYPE.media;
  return CMS_IMAGE_FRAME_CLASS_BY_TYPE.carousel;
}

function imagePreviewMaxWidth(): string {
  return "max-w-full";
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function preloadImage(url: string, retries = 6, delayMs = 180): Promise<void> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("failed"));
        img.src = `${url}${url.includes("?") ? "&" : "?"}preload=${Date.now()}-${attempt}`;
      });
      return;
    } catch {
      if (attempt >= retries - 1) {
        throw new Error("preview_unavailable");
      }
      await wait(delayMs);
    }
  }
}

export function SlideForm({ contentType, defaultValues, onSubmit, isLoading }: Props) {
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [bg, setBg] = useState(defaultValues?.bg ?? "bg-primary");
  const [fg, setFg] = useState(defaultValues?.fg ?? "text-primary-foreground");
  const [imageUrl, setImageUrl] = useState(defaultValues?.image_url ?? "");
  const [imageFit, setImageFit] = useState<ImageFitMode>(
    defaultValues?.image_fit ?? CMS_DEFAULT_IMAGE_FIT_BY_TYPE[contentType],
  );
  const [linkUrl, setLinkUrl] = useState(defaultValues?.link_url ?? "");
  const [linkLabel, setLinkLabel] = useState(defaultValues?.link_label ?? "");
  const [imagePositionX, setImagePositionX] = useState<number>(defaultValues?.image_position_x ?? 50);
  const [imagePositionY, setImagePositionY] = useState<number>(defaultValues?.image_position_y ?? 50);
  const [imageZoom, setImageZoom] = useState<number>(defaultValues?.image_zoom ?? 100);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isDragOverPicker, setIsDragOverPicker] = useState(false);
  const [isDraggingFocus, setIsDraggingFocus] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewNonce, setPreviewNonce] = useState<number>(() => Date.now());
  const [previewError, setPreviewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const sessionUploadUrlsRef = useRef<Set<string>>(new Set());
  const isPersistedRef = useRef(false);
  const activeImageUrlRef = useRef<string>(defaultValues?.image_url ?? "");
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const [uploadImage, { isLoading: uploading }] = useUploadImageMutation();

  useEffect(() => {
    setTitle(defaultValues?.title ?? "");
    setDescription(defaultValues?.description ?? "");
    setBg(defaultValues?.bg ?? "bg-primary");
    setFg(defaultValues?.fg ?? "text-primary-foreground");
    setImageUrl(defaultValues?.image_url ?? "");
    setImageFit(defaultValues?.image_fit ?? CMS_DEFAULT_IMAGE_FIT_BY_TYPE[contentType]);
    setImagePositionX(defaultValues?.image_position_x ?? 50);
    setImagePositionY(defaultValues?.image_position_y ?? 50);
    setImageZoom(defaultValues?.image_zoom ?? 100);
    setLinkUrl(defaultValues?.link_url ?? "");
    setLinkLabel(defaultValues?.link_label ?? "");
    setSelectedFileName("");
    isPersistedRef.current = false;
    activeImageUrlRef.current = defaultValues?.image_url ?? "";
  }, [contentType, defaultValues]);

  useEffect(() => {
    activeImageUrlRef.current = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl) return;
    setPreviewNonce(Date.now());
    setPreviewError(null);
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (isPersistedRef.current) return;
      const tempUrls = Array.from(sessionUploadUrlsRef.current);
      sessionUploadUrlsRef.current.clear();
      for (const url of tempUrls) {
        if (isManagedUploadUrl(url)) {
          void deleteUploadedFile(url);
        }
      }
    };
  }, []);

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (!validateWithAlert(imageUploadValidationRules(file))) {
      return;
    }
    setSelectedFileName(file.name);
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadImage(fd);
      if ("error" in result) {
        const message = getApiErrorMessage(result.error) || "Upload gambar gagal. Periksa format file lalu coba lagi.";
        setPreviewError(message);
        window.alert(message);
        return;
      }
      const nextUrl = result.data.url;
      const previousUrl = activeImageUrlRef.current;
      if (
        previousUrl &&
        previousUrl !== nextUrl &&
        isManagedUploadUrl(previousUrl) &&
        sessionUploadUrlsRef.current.has(previousUrl)
      ) {
        sessionUploadUrlsRef.current.delete(previousUrl);
        void deleteUploadedFile(previousUrl);
      }
      sessionUploadUrlsRef.current.add(nextUrl);
      await preloadImage(nextUrl);
      setImageUrl(nextUrl);
    } catch {
      const message = "Upload gambar gagal. Periksa format file lalu coba lagi.";
      setPreviewError(message);
      window.alert(message);
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileSelected(file);
    e.target.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handlePreviewPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!imageUrl || isPreviewLoading) return;
    const el = previewRef.current;
    if (!el) return;
    setIsDraggingFocus(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: imagePositionX,
      startY: imagePositionY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePreviewPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingFocus) return;
    const el = previewRef.current;
    const start = dragStartRef.current;
    if (!el || !start) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const deltaXPct = ((e.clientX - start.pointerX) / rect.width) * 100;
    const deltaYPct = ((e.clientY - start.pointerY) / rect.height) * 100;
    setImagePositionX(clamp(start.startX - deltaXPct, 0, 100));
    setImagePositionY(clamp(start.startY - deltaYPct, 0, 100));
  }

  function handlePreviewPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    setIsDraggingFocus(false);
    dragStartRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function renderInteractivePreview(previewAlt: string) {
    if (!imageUrl || !isImageType) return null;
    const previewSrc = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${previewNonce}`;
    return (
      <div className="space-y-2">
        <div
          ref={previewRef}
          className={`relative mx-auto w-full overflow-hidden rounded-md border bg-muted/25 ${imagePreviewAspect(contentType)} ${imagePreviewMaxWidth()} ${contentType === "carousel" ? "min-h-[120px]" : ""} ${isDraggingFocus ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={handlePreviewPointerDown}
          onPointerMove={handlePreviewPointerMove}
          onPointerUp={handlePreviewPointerUp}
          onPointerCancel={handlePreviewPointerUp}
        >
          <img
            src={previewSrc}
            alt={previewAlt}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onLoad={() => {
              setPreviewError(null);
              setIsPreviewLoading(false);
            }}
            onError={() => {
              setIsPreviewLoading(false);
              setPreviewError("Preview gagal dimuat. Coba upload ulang atau klik Simpan lalu buka lagi.");
            }}
            className={`h-full w-full transition-opacity duration-200 ${fitModeToClass(imageFit)} ${isPreviewLoading ? "opacity-0" : "opacity-100"}`}
            style={{
              objectPosition: `${imagePositionX}% ${imagePositionY}%`,
              transform: `scale(${imageZoom / 100})`,
              transformOrigin: `${imagePositionX}% ${imagePositionY}%`,
            }}
          />
          {isPreviewLoading && (
            <div className="absolute inset-0 animate-pulse bg-muted/60" />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-background/70 px-2 py-1 text-[11px] text-foreground/85 backdrop-blur-[1px]">
            {isPreviewLoading ? "Menyiapkan preview..." : "Drag untuk atur fokus gambar."}
          </div>
        </div>
        {previewError && (
          <p className="text-xs text-destructive">{previewError}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Posisi fokus: X {Math.round(imagePositionX)}% - Y {Math.round(imagePositionY)}%</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setImagePositionX(50);
              setImagePositionY(50);
            }}
          >
            Reset Fokus
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setImageZoom((prev) => clamp(prev - 10, 100, 300))}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <input
            type="range"
            min={100}
            max={300}
            step={5}
            value={imageZoom}
            onChange={(e) => setImageZoom(Number(e.target.value))}
            className="h-2 w-full accent-primary"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setImageZoom((prev) => clamp(prev + 10, 100, 300))}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-right text-xs text-muted-foreground">{imageZoom}%</span>
        </div>
      </div>
    );
  }

  function renderImagePicker() {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image-upload">Gambar</Label>
        <input
          ref={fileInputRef}
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        <div
          className={`rounded-md border-2 border-dashed p-2 transition-colors ${
            isDragOverPicker ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "border-border/70 bg-muted/20"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOverPicker(true);
          }}
          onDragLeave={() => setIsDragOverPicker(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragOverPicker(false);
            const file = e.dataTransfer.files?.[0];
            await handleFileSelected(file);
          }}
        >
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={openFilePicker} disabled={uploading} className="gap-2">
              <UploadCloud className="h-4 w-4" />
              {uploading ? "Mengunggah..." : imageUrl ? "Ganti Gambar" : "Upload Gambar"}
            </Button>
            {selectedFileName && (
              <span className="max-w-[230px] truncate text-xs text-muted-foreground">{selectedFileName}</span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Drop Area: seret gambar ke kotak ini, atau klik tombol Upload Gambar.
          </p>
        </div>
        {imageUrl && <p className="text-xs text-muted-foreground truncate">Tersimpan: {imageUrl}</p>}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedLink = linkUrl.trim();
    if (!validateWithAlert(slideLinkValidationRules(contentType, trimmedLink))) return;

    const payload: CreateSlideRequest = {
      type: contentType,
      title: title || null,
      description: description || null,
      bg,
      fg,
      image_url: imageUrl || null,
      image_fit: contentType === "video" || contentType === "lokasi" ? null : imageFit,
      image_position_x: contentType === "video" || contentType === "lokasi" ? null : imagePositionX,
      image_position_y: contentType === "video" || contentType === "lokasi" ? null : imagePositionY,
      image_zoom: contentType === "video" || contentType === "lokasi" ? null : imageZoom,
      link_url: trimmedLink || null,
      link_label: linkLabel || null,
    };

    try {
      await onSubmit(payload);
      isPersistedRef.current = true;
      const keepUrl = payload.image_url ?? "";
      for (const url of Array.from(sessionUploadUrlsRef.current)) {
        if (url !== keepUrl && isManagedUploadUrl(url)) {
          sessionUploadUrlsRef.current.delete(url);
          void deleteUploadedFile(url);
        }
      }
    } catch {
      isPersistedRef.current = false;
    }
  }

  const guide = CMS_SIZE_GUIDE[contentType];
  const isImageType = contentType === "carousel" || contentType === "flyer" || contentType === "media";

  const sizeGuidePanel = (
    <div className="rounded-lg border border-border/70 bg-muted/35 p-3 text-xs text-muted-foreground space-y-1">
      <p className="font-semibold text-foreground">Panduan ukuran konten</p>
      <p>Rasio tampilan: {guide.ratio}</p>
      <p>Ukuran disarankan: {guide.recommended}</p>
      <p>{guide.note}</p>
    </div>
  );

  if (contentType === "lokasi") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {sizeGuidePanel}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Judul (Opsional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Lokasi MAN 2 Yogyakarta"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="link_url">Google Maps Embed URL</Label>
          <Input
            id="link_url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Tempel URL embed Google Maps di sini"
            required
          />
          <p className="text-xs text-muted-foreground">Buka Google Maps, lalu Bagikan, Sematkan peta, lalu salin URL dari src iframe.</p>
        </div>

        {linkUrl && (
          <div className="rounded-md overflow-hidden border">
            <iframe src={linkUrl} className="w-full h-[200px]" style={{ border: 0 }} loading="lazy" />
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="mt-2">
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    );
  }

  if (contentType === "video") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {sizeGuidePanel}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="link_url">YouTube URL</Label>
          <Input
            id="link_url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Tempel URL YouTube di sini"
            required
          />
        </div>

        <Button type="submit" disabled={isLoading} className="mt-2">
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    );
  }

  if (contentType === "media") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {sizeGuidePanel}

        {renderImagePicker()}

        <div className="flex flex-col gap-1.5">
          <Label>Mode Resize Gambar</Label>
          <Select value={imageFit} onValueChange={(value) => setImageFit(value as ImageFitMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_FIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{IMAGE_FIT_OPTIONS.find((opt) => opt.value === imageFit)?.note}</p>
        </div>

        {renderInteractivePreview("Preview media")}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Judul (Opsional)</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Dokumentasi Kegiatan Kelas XII" />
        </div>

        <Button type="submit" disabled={isLoading || uploading} className="mt-2">
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    );
  }

  if (contentType === "flyer") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {sizeGuidePanel}

        {renderImagePicker()}

        <div className="flex flex-col gap-1.5">
          <Label>Mode Resize Gambar</Label>
          <Select value={imageFit} onValueChange={(value) => setImageFit(value as ImageFitMode)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_FIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{IMAGE_FIT_OPTIONS.find((opt) => opt.value === imageFit)?.note}</p>
        </div>

        {renderInteractivePreview("Preview flyer")}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Judul (Opsional)</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Flyer PPDB MAN 2 2026" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="link_url">Link CTA (Opsional)</Label>
          <Input
            id="link_url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Contoh: https://man2yk.sch.id/ppdb"
          />
        </div>

        <Button type="submit" disabled={isLoading || uploading} className="mt-2">
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {sizeGuidePanel}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Selamat Datang di SIMANDAYA"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contoh: Informasi layanan, agenda, atau pengumuman utama."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Background</Label>
          <Select value={bg} onValueChange={setBg}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BG_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Warna Teks</Label>
          <Select value={fg} onValueChange={setFg}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FG_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={`${bg} ${fg} rounded-md p-4 text-center`}>
        <p className="font-semibold text-sm">{title || "Judul Slide"}</p>
        <p className="text-xs opacity-80 mt-1">{description || "Deskripsi slide"}</p>
      </div>

      {renderImagePicker()}

      <div className="flex flex-col gap-1.5">
        <Label>Mode Resize Gambar</Label>
        <Select value={imageFit} onValueChange={(value) => setImageFit(value as ImageFitMode)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_FIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{IMAGE_FIT_OPTIONS.find((opt) => opt.value === imageFit)?.note}</p>
      </div>

      {renderInteractivePreview("Preview")}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="link_url">Link CTA (Opsional)</Label>
        <Input
          id="link_url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="Contoh: https://man2yk.sch.id atau /informasi"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="link_label">Label Tombol (Opsional)</Label>
        <Input
          id="link_label"
          value={linkLabel}
          onChange={(e) => setLinkLabel(e.target.value)}
          placeholder="Contoh: Lihat Selengkapnya"
        />
      </div>

      <Button type="submit" disabled={isLoading || uploading} className="mt-2">
        {isLoading ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
