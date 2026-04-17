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
import { getApiErrorMessage } from "@/lib/api-error";
import { notifyError, notifySuccess } from "@/lib/app-notify";

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
    if ("data" in result) {
      notifySuccess("Perubahan mata pelajaran berhasil disimpan.");
      onClose();
    } else {
      notifyError(
        getApiErrorMessage("error" in result ? result.error : null) ||
          "Gagal menyimpan perubahan mata pelajaran.",
      );
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const errorText = getApiErrorMessage(error);

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
