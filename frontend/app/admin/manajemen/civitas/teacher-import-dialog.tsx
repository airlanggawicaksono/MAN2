"use client";

import { useCallback, useRef, useState, DragEvent } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useQueueImportTeachersMutation } from "@/api/admin/jobs";
import { teachersApi } from "@/api/admin/teachers";
import { trackJob } from "@/store/slices/jobs";
import { useJobPolling } from "@/hooks/useJobPolling";
import { notifySuccess, notifyError } from "@/lib/app-notify";
import type { CreateGuruRequest, BulkImportGuruResult } from "@/types/teachers";
import { useSpreadsheetParser } from "@/hooks/useSpreadsheetParser";
import { getApiErrorMessage } from "@/lib/api-error";
import { validateWithAlert } from "@/lib/io-guards";
import { buildTeacherImportIssue, teacherImportValidationRules } from "@/lib/form-validators";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, SkipForward, Loader2 } from "lucide-react";

interface TeacherImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const REQUIRED_HEADERS = ["nama_lengkap"] as const;

export function TeacherImportDialog({ open, onClose }: TeacherImportDialogProps) {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<CreateGuruRequest[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<BulkImportGuruResult | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queueImport, { isLoading, error }] = useQueueImportTeachersMutation();

  const { job } = useJobPolling({
    jobId: activeJobId,
    onSucceeded: (j) => {
      setResult(j.result as unknown as BulkImportGuruResult);
      setParsed([]);
      setActiveJobId(null);
      dispatch(teachersApi.util.invalidateTags([{ type: "Teacher", id: "LIST" }]));
      notifySuccess("Import civitas selesai.");
    },
    onFailed: (j) => {
      setActiveJobId(null);
      notifyError(`Import gagal: ${j.error ?? "Unknown error"}`);
    },
  });

  const { validateFileType, parseFile } = useSpreadsheetParser<CreateGuruRequest>({
    requiredHeaders: REQUIRED_HEADERS,
    mapRow: (_, helpers) => {
      const nama = helpers.get("nama_lengkap");
      if (!nama) return { skip: true };
      const tahunRaw = helpers.get("tahun_masuk");
      const tahun = tahunRaw ? parseInt(tahunRaw, 10) : undefined;
      const nipRaw = (helpers.get("nip") || "").trim();
      const nikRaw = (helpers.get("nik") || "").trim();
      const nip = nipRaw && /^\d+$/.test(nipRaw) ? nipRaw : undefined;
      const nik = nikRaw && /^\d+$/.test(nikRaw) ? nikRaw : undefined;
      const warnings: string[] = [];
      if (nipRaw && !nip) warnings.push(buildTeacherImportIssue(helpers.line, "nip", nipRaw));
      if (nikRaw && !nik) warnings.push(buildTeacherImportIssue(helpers.line, "nik", nikRaw));
      if (tahunRaw && Number.isNaN(tahun)) warnings.push(buildTeacherImportIssue(helpers.line, "tahun_masuk", tahunRaw));
      return {
        row: {
          nama_lengkap: nama,
          nip,
          nik,
          mata_pelajaran: helpers.get("mata_pelajaran") || helpers.get("mapel") || undefined,
          pendidikan_terakhir: helpers.get("pendidikan_terakhir") || undefined,
          tempat_lahir: helpers.get("tempat_lahir") || undefined,
          kontak: helpers.get("kontak") || undefined,
          alamat: helpers.get("alamat") || undefined,
          tahun_masuk: !Number.isNaN(tahun!) ? tahun : undefined,
          kewarganegaraan: helpers.get("kewarganegaraan") || "Indonesia",
        },
        warnings,
      };
    },
  });

  const processFile = useCallback(
    async (file: File) => {
      const typeError = validateFileType(file);
      if (typeError) {
        setParseErrors([typeError]);
        window.alert(typeError);
        return;
      }
      setFileName(file.name);
      setResult(null);
      const { rows, errors, warnings } = await parseFile(file);
      setParsed(rows);
      setParseErrors(errors);
      setParseWarnings(warnings);
    },
    [validateFileType, parseFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleImport = async () => {
    if (!validateWithAlert(teacherImportValidationRules(parsed.length > 0, parseErrors.length > 0, parseWarnings))) return;
    const idempotencyKey = crypto.randomUUID();
    const res = await queueImport({ idempotencyKey, rows: parsed });
    if ("data" in res && res.data) {
      dispatch(trackJob(res.data));
      setActiveJobId(res.data.job_id);
    }
  };

  const handleClose = () => {
    setParsed([]);
    setParseErrors([]);
    setParseWarnings([]);
    setFileName("");
    setResult(null);
    setActiveJobId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const isProcessing = isLoading || activeJobId !== null;
  const canImport = parsed.length > 0 && parseErrors.length === 0 && parseWarnings.length === 0 && !isProcessing;
  const apiError = getApiErrorMessage(error);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Civitas via CSV / XLSX</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/40 border border-border/70 p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Format header kolom:</p>
            <p className="leading-relaxed">
              <span className="font-mono bg-background border rounded px-1">nama_lengkap</span>{" "}
              <span className="text-destructive font-medium">(wajib)</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">nip</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">nik</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">mata_pelajaran</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">pendidikan_terakhir</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">tahun_masuk</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">kontak</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">tempat_lahir</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">alamat</span>
            </p>
            <p>Civitas tidak menggunakan RFID - kolom rfid akan diabaikan.</p>
          </div>

          {!result && (
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50 hover:bg-muted/20"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
              {fileName ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">Klik untuk ganti file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">Seret file ke sini atau klik untuk memilih</p>
                  <p className="text-xs text-muted-foreground">CSV, XLSX, atau XLS</p>
                </div>
              )}
            </div>
          )}

          {parseErrors.length > 0 && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-1">
              {parseErrors.map((e, i) => (
                <p key={i} className="text-xs text-destructive">{e}</p>
              ))}
            </div>
          )}

          {parseWarnings.length > 0 && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-1">
              <p className="text-xs font-semibold text-destructive">Format kolom tidak valid (import diblokir):</p>
              {parseWarnings.map((w, i) => (
                <p key={i} className="text-xs text-destructive">{w}</p>
              ))}
            </div>
          )}

          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{parsed.length} civitas siap diimport:</p>
              <div className="max-h-52 overflow-y-auto rounded border border-border/70 divide-y divide-border/60">
                {parsed.slice(0, 50).map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{s.nama_lengkap}</span>
                    <span className="text-muted-foreground/70 text-xs">
                      {[s.nip && `NIP: ${s.nip}`, s.mata_pelajaran, s.pendidikan_terakhir].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                ))}
                {parsed.length > 50 && (
                  <p className="text-xs text-muted-foreground/70 px-3 py-2">
                    ...dan {parsed.length - 50} civitas lainnya
                  </p>
                )}
              </div>
            </div>
          )}

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
                <div className="max-h-40 overflow-y-auto rounded border border-border/70 divide-y text-xs">
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
                        <span className="text-foreground">
                          Baris {it.row}: {it.nama_lengkap}
                          {it.detail && ` - ${it.detail}`}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeJobId && job && (
            <div className="rounded-lg bg-muted/40 border border-border/70 p-3 text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>
                Memproses job{job.total > 0 ? ` (${job.progress}/${job.total})` : "..."} - status: {job.status}
              </span>
            </div>
          )}

          {apiError && <p className="text-sm text-destructive">{apiError}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing && !result}>
            {result ? "Tutup" : "Batal"}
          </Button>
          {!result && (
            <Button type="button" disabled={!canImport} onClick={handleImport}>
              {isProcessing ? "Mengimport..." : `Import ${parsed.length} Civitas`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
