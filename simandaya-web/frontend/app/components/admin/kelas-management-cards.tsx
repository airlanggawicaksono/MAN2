"use client";

import { Plus, Trash2 } from "lucide-react";
import { useListSiswaInKelasQuery } from "@/api/shared/akademik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { KelasResponse } from "@/types/akademik/kelas";

type KelasCardProps = {
  kelas: KelasResponse;
  onDelete: () => void;
  onManage: () => void;
};

export function KelasCard({ kelas, onDelete, onManage }: KelasCardProps) {
  const { data: students = [], isLoading } = useListSiswaInKelasQuery(
    kelas.kelas_id,
  );
  const total = students?.length || 0;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-bold">
            {kelas.tingkat}
          </Badge>
          <span className="font-medium">{kelas.nama_kelas}</span>
          {kelas.kategori_kelas_nama ? (
            <span className="text-sm text-muted-foreground">
              ({kelas.kategori_kelas_nama})
            </span>
          ) : null}
          {kelas.wali_kelas_nama ? (
            <span className="text-sm text-muted-foreground">
              Wali guru: {kelas.wali_kelas_nama}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onManage}>
            Kelola
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Wali: {kelas.wali_kelas_nama || "Belum ditentukan"} •{" "}
        {isLoading ? "Memuat..." : `Total siswa: ${total}`}
      </div>
    </div>
  );
}

type ManageKelasStudentsProps = {
  kelas: KelasResponse;
  onAdd: () => void;
  onRemove: (userId: string, nama: string) => void;
};

export function ManageKelasStudents({
  kelas,
  onAdd,
  onRemove,
}: ManageKelasStudentsProps) {
  const { data: students = [], isLoading } = useListSiswaInKelasQuery(
    kelas.kelas_id,
  );

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          Daftar Siswa ({students?.length || 0})
        </h4>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-3 w-3" />
          Tambah Siswa
        </Button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Memuat siswa...</p>
      ) : null}

      {students.length > 0 ? (
        <div className="max-h-[360px] space-y-1 overflow-y-auto rounded border p-2">
          {students.map((sk, i) => (
            <div
              key={sk.siswa_kelas_id}
              className="flex items-center justify-between rounded px-3 py-1.5 text-sm hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <span>{sk.nama_lengkap || "-"}</span>
                {sk.nis ? (
                  <span className="text-xs text-muted-foreground">
                    NIS: {sk.nis}
                  </span>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => onRemove(sk.user_id, sk.nama_lengkap || "siswa")}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {students.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Belum ada siswa di kelas ini.
        </p>
      ) : null}
    </div>
  );
}
