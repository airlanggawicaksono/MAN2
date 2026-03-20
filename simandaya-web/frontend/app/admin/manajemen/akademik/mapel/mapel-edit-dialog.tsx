"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUpdateMapelMutation } from "@/api/shared/akademik";
import type { MapelResponse, UpdateMapelRequest } from "@/types/akademik/mapel";

interface MapelEditDialogProps {
  mapel: MapelResponse | null;
  open: boolean;
  onClose: () => void;
}

export function MapelEditDialog({ mapel, open, onClose }: MapelEditDialogProps) {
  const [form, setForm] = useState<UpdateMapelRequest>({});
  const [updateMapel, { isLoading, error, reset }] = useUpdateMapelMutation();

  useEffect(() => {
    if (mapel) {
      setForm({
        nama_mapel: mapel.nama_mapel,
        kode_mapel: mapel.kode_mapel,
        kelompok: mapel.kelompok || "",
        jam_per_minggu: mapel.jam_per_minggu,
      });
    }
  }, [mapel]);

  const handleChange = (field: keyof UpdateMapelRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapel) return;
    reset();

    const result = await updateMapel({ id: mapel.mapel_id, body: form });
    if ("data" in result) onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const errorDetail =
    error && "data" in error
      ? (error.data as { detail?: unknown })?.detail
      : undefined;

  const errorText = typeof errorDetail === "string"
    ? errorDetail
    : Array.isArray(errorDetail)
      ? errorDetail.map((e: any) => e.msg).join(", ")
      : errorDetail ? JSON.stringify(errorDetail) : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Mata Pelajaran</DialogTitle>
        </DialogHeader>
        {errorText && (
          <p className="text-sm text-destructive">{errorText}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Kode Mapel</Label>
              <Input
                value={form.kode_mapel || ""}
                onChange={(e) => handleChange("kode_mapel", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nama Mata Pelajaran</Label>
              <Input
                value={form.nama_mapel || ""}
                onChange={(e) => handleChange("nama_mapel", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Kelompok</Label>
              <Select value={form.kelompok || ""} onValueChange={(val) => handleChange("kelompok", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kelompok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wajib">Wajib</SelectItem>
                  <SelectItem value="Peminatan">Peminatan</SelectItem>
                  <SelectItem value="Muatan Lokal">Muatan Lokal</SelectItem>
                  <SelectItem value="Keagamaan">Keagamaan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Jam/Minggu</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.jam_per_minggu ?? ""}
                onChange={(e) => handleChange("jam_per_minggu", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
