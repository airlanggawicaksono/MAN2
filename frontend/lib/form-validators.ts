import type { ContentType } from "@/types/cms";
import type { CreateStudentRequest, UpdateStudentRequest } from "@/types/students";
import type { CreateGuruRequest, UpdateGuruRequest } from "@/types/teachers";
import {
  isDigitsOnly,
  isGoogleMapsEmbedUrl,
  isBareDomain,
  isHttpUrlOrPath,
  isOptionalDigits,
  isValidYear,
  isYouTubeUrl,
  type ValidationRule,
} from "@/lib/io-guards";

const YEAR_MAX = new Date().getFullYear() + 10;
const YEAR_RANGE_MESSAGE = `Tahun masuk harus angka valid antara 1900-${YEAR_MAX}.`;

export type StudentImportIssue = {
  row: number;
  column:
    | "nisn"
    | "tahun_masuk"
    | "no_telephone_wali"
    | "kontak"
    | "jenis_kelamin"
    | "dob";
  value: string;
  message: string;
};

export type TeacherImportIssue = {
  row: number;
  column:
    | "nip"
    | "nik"
    | "tahun_masuk"
    | "kontak"
    | "jenis_kelamin"
    | "dob";
  value: string;
  message: string;
};

const COLUMN_EXPECTED: Record<string, string> = {
  tahun_masuk: "tahun (angka)",
  no_telephone_wali: "nomor telepon (angka, boleh diawali +)",
  kontak: "nomor telepon (angka, boleh diawali +)",
  jenis_kelamin: "Laki-Laki atau Perempuan",
  dob: "tanggal (YYYY-MM-DD atau DD/MM/YYYY)",
};

export function getYearRangeMessage(): string {
  return YEAR_RANGE_MESSAGE;
}

export function studentCreateValidationRules(payload: CreateStudentRequest): ValidationRule[] {
  const nisnValue = payload.nisn?.trim() ?? "";
  return [
    { isValid: nisnValue.length > 0, message: "NISN wajib diisi." },
    { isValid: isDigitsOnly(nisnValue), message: "NISN harus berupa angka saja." },
    { isValid: isValidYear(payload.tahun_masuk), message: YEAR_RANGE_MESSAGE },
  ];
}

export function studentEditValidationRules(payload: UpdateStudentRequest): ValidationRule[] {
  const nisnValue = payload.nisn?.trim();
  return [
    { isValid: !nisnValue || isDigitsOnly(nisnValue), message: "NISN harus berupa angka saja." },
    { isValid: isValidYear(payload.tahun_masuk), message: YEAR_RANGE_MESSAGE },
  ];
}

export function teacherCreateValidationRules(payload: CreateGuruRequest): ValidationRule[] {
  const nipValue = payload.nip?.trim();
  const nikValue = payload.nik?.trim();
  return [
    { isValid: isOptionalDigits(nipValue), message: "NIP harus berupa angka saja." },
    { isValid: isOptionalDigits(nikValue), message: "NIK harus berupa angka saja." },
    { isValid: isValidYear(payload.tahun_masuk), message: YEAR_RANGE_MESSAGE },
  ];
}

export function teacherEditValidationRules(payload: UpdateGuruRequest): ValidationRule[] {
  const nipValue = payload.nip?.trim();
  const nikValue = payload.nik?.trim();
  return [
    { isValid: isOptionalDigits(nipValue), message: "NIP harus berupa angka saja." },
    { isValid: isOptionalDigits(nikValue), message: "NIK harus berupa angka saja." },
    { isValid: isValidYear(payload.tahun_masuk), message: YEAR_RANGE_MESSAGE },
  ];
}

export function studentImportValidationRules(
  hasRows: boolean,
  hasBaseErrors: boolean,
): ValidationRule[] {
  return [
    { isValid: hasRows, message: "Tidak ada data siswa untuk diimport." },
    { isValid: !hasBaseErrors, message: "Perbaiki error parsing file sebelum import." },
  ];
}

export function teacherImportValidationRules(
  hasRows: boolean,
  hasBaseErrors: boolean,
): ValidationRule[] {
  return [
    { isValid: hasRows, message: "Tidak ada data civitas untuk diimport." },
    { isValid: !hasBaseErrors, message: "Perbaiki error parsing file sebelum import." },
  ];
}

export function slideLinkValidationRules(contentType: ContentType, linkUrl: string): ValidationRule[] {
  const trimmedLink = linkUrl.trim();
  if (contentType === "lokasi") {
    return [
      {
        isValid: isGoogleMapsEmbedUrl(trimmedLink),
        message: "URL lokasi harus berupa Google Maps embed URL yang valid.",
      },
    ];
  }
  if (contentType === "video") {
    return [
      {
        isValid: isYouTubeUrl(trimmedLink),
        message: "URL video harus berupa link YouTube yang valid.",
      },
    ];
  }
  return [
    {
      isValid: !trimmedLink || isHttpUrlOrPath(trimmedLink) || isBareDomain(trimmedLink),
      message: "Link CTA harus URL, path '/', atau domain (contoh: 'xxx.com').",
    },
  ];
}

export function imageUploadValidationRules(file: File | null | undefined): ValidationRule[] {
  return [
    { isValid: !!file, message: "File belum dipilih." },
    {
      isValid: !!file && file.type.startsWith("image/"),
      message: "File gambar tidak valid. Pilih file dengan tipe image/*.",
    },
  ];
}

export function buildStudentImportIssue(
  row: number,
  column: StudentImportIssue["column"],
  value: string,
): string {
  const expected = COLUMN_EXPECTED[column] ?? "angka";
  return `baris ${row}, kolom "${column}" bernilai "${value}" (harus ${expected}).`;
}

export function buildTeacherImportIssue(
  row: number,
  column: TeacherImportIssue["column"],
  value: string,
): string {
  const expected = COLUMN_EXPECTED[column] ?? "angka";
  return `baris ${row}, kolom "${column}" bernilai "${value}" (harus ${expected}).`;
}
