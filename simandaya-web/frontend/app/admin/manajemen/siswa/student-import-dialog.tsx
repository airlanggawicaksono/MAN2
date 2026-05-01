"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useBulkImportStudentsMutation } from "@/api/admin/students";
import type { CreateStudentRequest, BulkImportResult } from "@/types/students";
import { useSpreadsheetParser } from "@/hooks/useSpreadsheetParser";
import { getApiErrorMessage } from "@/lib/api-error";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, SkipForward } from "lucide-react";

interface StudentImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const REQUIRED_HEADERS = ["nama_lengkap"] as const;

export function StudentImportDialog({ open, onClose }: StudentImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<CreateStudentRequest[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [bulkImport, { isLoading, error }] = useBulkImportStudentsMutation();

  const { validateFileType, parseFile } = useSpreadsheetParser<CreateStudentRequest>({
    requiredHeaders: REQUIRED_HEADERS,
    mapRow: (_, helpers) => {
      const nama = helpers.get("nama_lengkap");
      if (!nama) return { skip: true };
      const tahunRaw = helpers.get("tahun_masuk");
      const tahun = tahunRaw ? parseInt(tahunRaw) : undefined;
      return {
        row: {
          nama_lengkap: nama,
          nisn: helpers.get("nisn") || helpers.get("nis") || undefined,
          kelas_jurusan: helpers.get("kelas_jurusan") || undefined,
          tempat_lahir: helpers.get("tempat_lahir") || undefined,
          kontak: helpers.get("kontak") || undefined,
          nama_wali: helpers.get("nama_wali") || undefined,
          alamat: helpers.get("alamat") || undefined,
          tahun_masuk: !isNaN(tahun!) ? tahun : undefined,
          kewarganegaraan: helpers.get("kewarganegaraan") || "Indonesia",
        },
      };
    },
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const typeError = validateFileType(file);
      if (typeError) {
        setParseErrors([typeError]);
        return;
      }
      setFileName(file.name);
      setResult(null);
      const { rows, errors } = await parseFile(file);
      setParsed(rows);
      setParseErrors(errors);
    },
    [validateFileType, parseFile]
  );

  const handleImport = async () => {
    if (!parsed.length) return;
    const res = await bulkImport(parsed);
    if ("data" in res && res.data) {
      setResult(res.data);
      setParsed([]);
    }
  };

  const handleClose = () => {
    setParsed([]);
    setParseErrors([]);
    setFileName("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const apiError = getApiErrorMessage(error);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Siswa via CSV / XLSX</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format info */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Format header kolom:</p>
            <p>
              <span className="font-mono bg-white border rounded px-1">nama_lengkap</span>{" "}
              (wajib),{" "}
              <span className="font-mono bg-white border rounded px-1">nisn</span>,{" "}
              <span className="font-mono bg-white border rounded px-1">kelas_jurusan</span>,{" "}
              <span className="font-mono bg-white border rounded px-1">tahun_masuk</span>,{" "}
              <span className="font-mono bg-white border rounded px-1">kontak</span>,{" "}
              <span className="font-mono bg-white border rounded px-1">nama_wali</span>,{" "}
              <span className="font-mono bg-white border rounded px-1">tempat_lahir</span>,{" "}
              <span className="font-mono bg-white border rounded px-1">alamat</span>
            </p>
          </div>

          {/* File picker */}
          {!result && (
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Pilih File
              </Button>
              {fileName && (
                <span className="flex items-center gap-1.5 text-sm text-slate-600">
                  <FileSpreadsheet className="h-4 w-4" />
                  {fileName}
                </span>
              )}
            </div>
          )}

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
              {parseErrors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">{e}</p>
              ))}
            </div>
          )}

          {/* Preview */}
          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                {parsed.length} siswa siap diimport:
              </p>
              <div className="max-h-52 overflow-y-auto rounded border border-slate-200 divide-y divide-slate-100">
                {parsed.slice(0, 50).map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{s.nama_lengkap}</span>
                    <span className="text-slate-400 text-xs">
                      {[s.nisn && `NISN: ${s.nisn}`, s.kelas_jurusan].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                ))}
                {parsed.length > 50 && (
                  <p className="text-xs text-slate-400 px-3 py-2">
                    ...dan {parsed.length - 50} siswa lainnya
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="space-y-3">
              <div className="flex gap-3">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {result.created} ditambahkan
                </Badge>
                {result.skipped > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <SkipForward className="h-3 w-3" />
                    {result.skipped} dilewati
                  </Badge>
                )}
                {result.errors > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {result.errors} error
                  </Badge>
                )}
              </div>
              {(result.skipped > 0 || result.errors > 0) && (
                <div className="max-h-40 overflow-y-auto rounded border border-slate-200 divide-y text-xs">
                  {result.items
                    .filter((it) => it.status !== "created")
                    .map((it, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2">
                        <Badge
                          variant={it.status === "skipped" ? "secondary" : "destructive"}
                          className="text-[10px] shrink-0"
                        >
                          {it.status === "skipped" ? "Lewati" : "Error"}
                        </Badge>
                        <span className="text-slate-700">
                          Baris {it.row}: {it.nama_lengkap}
                          {it.detail && ` — ${it.detail}`}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {apiError && <p className="text-sm text-destructive">{apiError}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {result ? "Tutup" : "Batal"}
          </Button>
          {!result && (
            <Button
              type="button"
              disabled={parsed.length === 0 || isLoading}
              onClick={handleImport}
            >
              {isLoading ? "Mengimport..." : `Import ${parsed.length} Siswa`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
