"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateMapelMutation } from "@/api/shared/akademik";
import type { CreateMapelRequest, MapelResponse } from "@/types/akademik/mapel";
import { getApiErrorMessage } from "@/lib/api-error";
import { useSpreadsheetParser } from "@/hooks/useSpreadsheetParser";
import { notifyError, notifySuccess } from "@/lib/app-notify";

type ParsedMapelRow = {
  kode_mapel: string;
  nama_mapel: string;
  kelompok: string;
};

const REQUIRED_HEADERS = ["kode_mapel", "nama_mapel", "kelompok"] as const;

const KELOMPOK_MAP: Record<string, string> = {
  wajib: "Wajib",
  peminatan: "Peminatan",
  "muatan lokal": "Muatan Lokal",
  muatan_lokal: "Muatan Lokal",
  keagamaan: "Keagamaan",
};

function mapKelompok(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  return KELOMPOK_MAP[normalized] ?? null;
}

type MapelImportDialogProps = {
  existingMapels: MapelResponse[];
};

export function MapelImportDialog({ existingMapels }: MapelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [payload, setPayload] = useState<CreateMapelRequest[]>([]);

  const [createMapel, { isLoading: isSaving, error, reset }] = useCreateMapelMutation();
  const { parseFile, validateFileType } = useSpreadsheetParser<ParsedMapelRow, { seenCodes: Set<string> }>({
    requiredHeaders: REQUIRED_HEADERS,
    createContext: () => ({ seenCodes: new Set<string>() }),
    mapRow: (_rawRow, helpers, context) => {
      const kodeMapelRaw = helpers.get("kode_mapel");
      const namaMapelRaw = helpers.get("nama_mapel");
      const kelompokRaw = helpers.get("kelompok");

      if (!kodeMapelRaw && !namaMapelRaw && !kelompokRaw) {
        return { skip: true };
      }

      if (!kodeMapelRaw || !namaMapelRaw || !kelompokRaw) {
        return {
          error: `Baris ${helpers.line}: kolom kode_mapel, nama_mapel, kelompok wajib diisi.`,
        };
      }

      const normalizedKelompok = mapKelompok(kelompokRaw);
      if (!normalizedKelompok) {
        return {
          error: `Baris ${helpers.line}: kelompok '${kelompokRaw}' tidak valid. Gunakan Wajib/Peminatan/Muatan Lokal/Keagamaan.`,
        };
      }

      const duplicateKey = kodeMapelRaw.toLowerCase();
      if (context.seenCodes.has(duplicateKey)) {
        return {
          error: `Baris ${helpers.line}: kode_mapel '${kodeMapelRaw}' duplikat di file import.`,
        };
      }
      context.seenCodes.add(duplicateKey);

      return {
        row: {
          kode_mapel: kodeMapelRaw,
          nama_mapel: namaMapelRaw,
          kelompok: normalizedKelompok,
        },
      };
    },
  });

  const existingCodeSet = useMemo(
    () => new Set(existingMapels.map((m) => m.kode_mapel.trim().toLowerCase())),
    [existingMapels]
  );

  const resetState = () => {
    setFileName("");
    setParseErrors([]);
    setSummary(null);
    setPayload([]);
    reset();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetState();
  };

  const handleFile = async (file: File) => {
    const typeError = validateFileType(file);
    if (typeError) {
      setFileName(file.name);
      setPayload([]);
      setSummary(null);
      setParseErrors([typeError]);
      return;
    }

    setFileName(file.name);
    setSummary(null);
    setParseErrors([]);
    setPayload([]);
    reset();

    try {
      const parsed = await parseFile(file);
      const filteredRows = parsed.rows.filter(
        (row) => !existingCodeSet.has(row.kode_mapel.trim().toLowerCase())
      );
      const skipped = parsed.rows.length - filteredRows.length;

      setPayload(filteredRows);

      const lines: string[] = [];
      if (filteredRows.length > 0) {
        lines.push(`${filteredRows.length} mapel siap diimport.`);
      } else {
        lines.push("Tidak ada data baru untuk diimport.");
      }
      if (skipped > 0) {
        lines.push(`${skipped} data dilewati karena kode_mapel sudah ada.`);
      }
      setSummary(lines.join(" "));
      setParseErrors(parsed.errors);
    } catch {
      setParseErrors(["Gagal membaca file. Pastikan format CSV/XLSX valid."]);
      setPayload([]);
      setSummary(null);
    }
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const onImport = async () => {
    if (payload.length === 0) return;

    const failedRows: string[] = [];
    let successCount = 0;

    for (const row of payload) {
      try {
        await createMapel(row).unwrap();
        successCount += 1;
      } catch {
        failedRows.push(`${row.kode_mapel} - ${row.nama_mapel}`);
      }
    }

    const baseMessage = `${successCount} data berhasil diimport.`;
    if (failedRows.length > 0) {
      setSummary(`${baseMessage} ${failedRows.length} data gagal: ${failedRows.join(", ")}.`);
      notifyError(`Import selesai dengan error. Berhasil: ${successCount}, gagal: ${failedRows.length}.`);
    } else {
      setSummary(baseMessage);
      setPayload([]);
      notifySuccess(baseMessage);
    }
  };

  const apiErrorText = getApiErrorMessage(error);

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Data Mapel Melalui File
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Mata Pelajaran</DialogTitle>
          <DialogDescription>
            Pastikan file memiliki kolom <strong>kode_mapel</strong>, <strong>nama_mapel</strong>, dan{" "}
            <strong>kelompok</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border">
            <Image
              src="/INSTRUKSI_XLSX.jpg"
              alt="Instruksi format import mapel"
              width={1366}
              height={768}
              className="h-auto w-full object-cover"
              priority
            />
          </div>

          <div
            className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={onDrop}
          >
            <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drag & drop file CSV/XLSX di sini</p>
            <p className="mt-1 text-xs text-muted-foreground">
              atau klik tombol di bawah untuk memilih file dari komputer
            </p>
            <div className="mt-3">
              <Button type="button" variant="link" asChild className="h-auto p-0 text-sm">
                <a href="/sample_mapel_import.csv" download>
                  Download Template CSV
                </a>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) {
                  await handleFile(file);
                }
                event.currentTarget.value = "";
              }}
            />
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              onClick={() => fileInputRef.current?.click()}
            >
              Pilih File
            </Button>
          </div>

          {fileName && <p className="text-sm">File dipilih: {fileName}</p>}
          {summary && <p className="text-sm text-primary">{summary}</p>}
          {apiErrorText && <p className="text-sm text-destructive">{apiErrorText}</p>}
          {parseErrors.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {parseErrors.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Tutup
          </Button>
          <Button type="button" disabled={isSaving || payload.length === 0} onClick={onImport}>
            {isSaving ? "Mengimport..." : "Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
