"use client";

import { useCallback, useEffect, useRef, useState, DragEvent } from "react";
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
import { useQueueImportStudentsMutation } from "@/api/admin/jobs";
import { studentsApi } from "@/api/admin/students";
import { trackJob } from "@/store/slices/jobs";
import { useJobPolling } from "@/hooks/useJobPolling";
import { notifySuccess, notifyError } from "@/lib/app-notify";
import type { CreateStudentRequest, BulkImportResult } from "@/types/students";
import { useSpreadsheetParser } from "@/hooks/useSpreadsheetParser";
import { getApiErrorMessage } from "@/lib/api-error";
import { validateWithAlert, isPhoneLike, normalizeJenisKelamin } from "@/lib/io-guards";
import { normalizeDateToIso } from "@/lib/date-id";
import { buildStudentImportIssue, studentImportValidationRules } from "@/lib/form-validators";
import { diagLog } from "@/lib/diag-log";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, SkipForward, Loader2 } from "lucide-react";
import { ImportColumnWarnings } from "@/app/components/admin/import-column-warnings";

interface StudentImportDialogProps {
  open: boolean;
  onClose: () => void;
}

const REQUIRED_HEADERS = ["nama_lengkap", "nisn"] as const;

export function StudentImportDialog({ open, onClose }: StudentImportDialogProps) {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<CreateStudentRequest[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queueImport, { isLoading, error }] = useQueueImportStudentsMutation();

  const { job } = useJobPolling({
    jobId: activeJobId,
    onSucceeded: (j) => {
      setResult(j.result as unknown as BulkImportResult);
      setParsed([]);
      setActiveJobId(null);
      dispatch(studentsApi.util.invalidateTags([{ type: "Student", id: "LIST" }]));
      notifySuccess("Import siswa selesai.");
    },
    onFailed: (j) => {
      setActiveJobId(null);
      notifyError(`Import gagal: ${j.error ?? "Unknown error"}`);
    },
  });

  const { validateFileType, parseFile } = useSpreadsheetParser<CreateStudentRequest>({
    requiredHeaders: REQUIRED_HEADERS,
    mapRow: (rawRow, helpers) => {
      const isEmptyRow = Object.values(rawRow).every((value) => String(value ?? "").trim() === "");
      if (isEmptyRow) return { skip: true };

      const nama = helpers.get("nama_lengkap");
      const nisnRaw = (helpers.get("nisn") || helpers.get("nis") || "").trim();
      const requiredWarnings: string[] = [];
      if (!nama) requiredWarnings.push('kolom "nama_lengkap" wajib diisi.');
      if (!nisnRaw) requiredWarnings.push('kolom "nisn" wajib diisi.');
      if (requiredWarnings.length > 0) return { skip: true, warnings: requiredWarnings };

      const nisn = /^\d+$/.test(nisnRaw) ? nisnRaw : undefined;
      if (!nisn) return { skip: true, warnings: [buildStudentImportIssue(helpers.line, "nisn", nisnRaw)] };

      const tahunRaw = helpers.get("tahun_masuk");
      const tahun = tahunRaw ? parseInt(tahunRaw, 10) : undefined;
      const isAlumniRaw = (helpers.get("is_alumni") ?? "").toLowerCase().trim();
      const isAlumni = isAlumniRaw === "true" || isAlumniRaw === "1" || isAlumniRaw === "ya";
      const rfidRaw = (helpers.get("rfid_number") || helpers.get("card_number") || "").trim();
      const rfid = rfidRaw || undefined;

      const teleponWaliRaw = (
        helpers.get("no_telephone_wali") || helpers.get("no_telp_wali") || helpers.get("telp_wali") || ""
      ).trim();
      const kontakRaw = helpers.get("kontak").trim();
      const jkRaw = helpers.get("jenis_kelamin").trim();
      const dobRaw = helpers.get("dob").trim();

      const teleponWali = isPhoneLike(teleponWaliRaw) ? teleponWaliRaw || undefined : undefined;
      const kontak = isPhoneLike(kontakRaw) ? kontakRaw || undefined : undefined;
      const jenisKelamin = jkRaw ? normalizeJenisKelamin(jkRaw) : undefined;
      const dobIso = dobRaw ? normalizeDateToIso(dobRaw) : "";
      const dob = dobIso || undefined;

      const warnings: string[] = [];
      if (tahunRaw && Number.isNaN(tahun)) warnings.push(buildStudentImportIssue(helpers.line, "tahun_masuk", tahunRaw));
      if (teleponWaliRaw && !teleponWali) warnings.push(buildStudentImportIssue(helpers.line, "no_telephone_wali", teleponWaliRaw));
      if (kontakRaw && !kontak) warnings.push(buildStudentImportIssue(helpers.line, "kontak", kontakRaw));
      if (jkRaw && !jenisKelamin) warnings.push(buildStudentImportIssue(helpers.line, "jenis_kelamin", jkRaw));
      if (dobRaw && !dob) warnings.push(buildStudentImportIssue(helpers.line, "dob", dobRaw));
      return {
        row: {
          nama_lengkap: nama,
          nisn,
          kelas_jurusan: helpers.get("kelas_jurusan") || undefined,
          tempat_lahir: helpers.get("tempat_lahir") || undefined,
          kontak,
          nama_wali: helpers.get("nama_wali") || undefined,
          no_telephone_wali: teleponWali,
          alamat: helpers.get("alamat") || undefined,
          tahun_masuk: !Number.isNaN(tahun!) ? tahun : undefined,
          kewarganegaraan: helpers.get("kewarganegaraan") || "Indonesia",
          rfid_number: rfid,
          status_siswa: isAlumni ? "Lulus" : undefined,
          jenis_kelamin: jenisKelamin,
          dob,
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
    diagLog("student_import.click", {
      parsed: parsed.length,
      errors: parseErrors.length,
      warnings: parseWarnings.length,
      file: fileName,
    });
    if (!validateWithAlert(studentImportValidationRules(parsed.length > 0, parseErrors.length > 0))) {
      diagLog("student_import.blocked_validation", { parsed: parsed.length, errors: parseErrors.length });
      return;
    }
    const idempotencyKey = crypto.randomUUID();
    diagLog("student_import.mutation_start", { idempotencyKey, rows: parsed.length });
    const res = await queueImport({ idempotencyKey, rows: parsed });
    if ("data" in res && res.data) {
      diagLog("student_import.mutation_success", { job_id: res.data.job_id });
      dispatch(trackJob(res.data));
      setActiveJobId(res.data.job_id);
      return;
    }
    if ("error" in res) {
      const msg = getApiErrorMessage(res.error) ?? "Gagal mengirim data ke server.";
      diagLog("student_import.mutation_error", { error: JSON.stringify(res.error).slice(0, 500) });
      notifyError(`Import siswa gagal: ${msg}`);
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
  const canImport = parsed.length > 0 && parseErrors.length === 0 && !isProcessing;
  const apiError = getApiErrorMessage(error);

  useEffect(() => {
    if (!open) return;
    diagLog("student_import.state", {
      canImport,
      parsed: parsed.length,
      errors: parseErrors.length,
      warnings: parseWarnings.length,
      isLoading,
      activeJobId,
      apiError,
    });
  }, [open, canImport, parsed.length, parseErrors.length, parseWarnings.length, isLoading, activeJobId, apiError]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Siswa via CSV / XLSX</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/40 border border-border/70 p-3 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Format header kolom:</p>
            <p className="leading-relaxed">
              <span className="font-mono bg-background border rounded px-1">nama_lengkap</span>{" "}
              <span className="text-destructive font-medium">(wajib)</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">nisn</span>{" "}
              <span className="text-destructive font-medium">(wajib, hanya angka)</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">kelas_jurusan</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">tahun_masuk</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">kontak</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">nama_wali</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">no_telephone_wali</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">tempat_lahir</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">alamat</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">rfid_number</span>,{" "}
              <span className="font-mono bg-background border rounded px-1">is_alumni</span>
            </p>
            <p>
              Kolom <span className="font-mono bg-background border rounded px-1">is_alumni</span>{" "}
              diisi <span className="font-mono">true</span> / <span className="font-mono">ya</span> /{" "}
              <span className="font-mono">1</span> untuk menandai siswa sebagai alumni (Lulus).
            </p>
            <div className="flex items-center gap-3">
              <a
                href="/samples/siswa-import-basic.csv"
                download
                className="inline-flex text-primary underline underline-offset-2 hover:opacity-90"
              >
                Download sample CSV siswa
              </a>
              <a
                href="/samples/siswa-import-new.xlsx"
                download
                className="inline-flex text-primary underline underline-offset-2 hover:opacity-90"
              >
                Download sample XLSX siswa
              </a>
            </div>
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

          <ImportColumnWarnings warnings={parseWarnings} />

          {parsed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{parsed.length} siswa siap diimport:</p>
              <div className="max-h-52 overflow-y-auto rounded border border-border/70 divide-y divide-border/60">
                {parsed.slice(0, 50).map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{s.nama_lengkap}</span>
                    <span className="text-muted-foreground/70 text-xs">
                      {[s.nisn && `NISN: ${s.nisn}`, s.kelas_jurusan, s.no_telephone_wali && `Wali: ${s.no_telephone_wali}`, s.rfid_number && `RFID: ${s.rfid_number}`, s.status_siswa === "Lulus" && "Alumni"]
                        .filter(Boolean)
                        .join(" - ")}
                    </span>
                  </div>
                ))}
                {parsed.length > 50 && (
                  <p className="text-xs text-muted-foreground/70 px-3 py-2">
                    ...dan {parsed.length - 50} siswa lainnya
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
              {isProcessing ? "Mengimpor..." : `Impor CSV/XLSX (${parsed.length})`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
