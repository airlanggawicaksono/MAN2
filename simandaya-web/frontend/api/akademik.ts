import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "./base";
import type {
  TahunAjaran, CreateTahunAjaranRequest,
  Semester, CreateSemesterRequest,
  MataPelajaran, CreateMapelRequest,
  Kelas, CreateKelasRequest,
  Jadwal, CreateJadwalRequest,
  SlotWaktu,
  KalenderAkademik,
} from "@/types/akademik";
import { MessageResponse } from "@/types/common";

export const akademikApi = createApi({
  reducerPath: "akademikApi",
  baseQuery: createBaseQuery("/akademik"),
  tagTypes: ["TahunAjaran", "Semester", "Mapel", "Kelas", "Jadwal", "SlotWaktu", "Kalender"],
  endpoints: (builder) => ({
    // ── Tahun Ajaran ─────────────────────────────────────────────────────────
    listTahunAjaran: builder.query<TahunAjaran[], void>({
      query: () => "/tahun-ajaran",
      providesTags: ["TahunAjaran"],
    }),
    getActiveTahunAjaran: builder.query<TahunAjaran | null, void>({
      query: () => "/tahun-ajaran/active",
      providesTags: ["TahunAjaran"],
    }),
    createTahunAjaran: builder.mutation<TahunAjaran, CreateTahunAjaranRequest>({
      query: (body) => ({
        url: "/tahun-ajaran",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TahunAjaran"],
    }),

    // ── Semester ─────────────────────────────────────────────────────────────
    listSemesters: builder.query<Semester[], void>({
      query: () => "/semester",
      providesTags: ["Semester"],
    }),
    getActiveSemester: builder.query<Semester | null, void>({
      query: () => "/semester/active",
      providesTags: ["Semester"],
    }),
    listSemestersByTahunAjaran: builder.query<Semester[], string>({
      query: (tahunAjaranId) => `/semester/tahun-ajaran/${tahunAjaranId}`,
      providesTags: ["Semester"],
    }),

    // ── Mata Pelajaran ───────────────────────────────────────────────────────
    listMapel: builder.query<MataPelajaran[], void>({
      query: () => "/mapel",
      providesTags: ["Mapel"],
    }),
    createMapel: builder.mutation<MataPelajaran, CreateMapelRequest>({
      query: (body) => ({
        url: "/mapel",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Mapel"],
    }),

    // ── Kelas ────────────────────────────────────────────────────────────────
    listKelas: builder.query<Kelas[], void>({
      query: () => "/kelas",
      providesTags: ["Kelas"],
    }),
    listKelasByTahunAjaran: builder.query<Kelas[], string>({
      query: (tahunAjaranId) => `/kelas/tahun-ajaran/${tahunAjaranId}`,
      providesTags: ["Kelas"],
    }),
    getMyKelas: builder.query<Kelas | null, void>({
      query: () => "/me/kelas",
      providesTags: ["Kelas"],
    }),

    // ── Slot Waktu ───────────────────────────────────────────────────────────
    listSlotWaktu: builder.query<SlotWaktu[], void>({
      query: () => "/slot-waktu",
      providesTags: ["SlotWaktu"],
    }),

    // ── Jadwal ───────────────────────────────────────────────────────────────
    listJadwalByKelas: builder.query<Jadwal[], string>({
      query: (kelasId) => `/jadwal/kelas/${kelasId}`,
      providesTags: ["Jadwal"],
    }),
    listJadwalByGuru: builder.query<Jadwal[], string>({
      query: (userId) => `/jadwal/guru/${userId}`,
      providesTags: ["Jadwal"],
    }),
  }),
});

export const {
  useListTahunAjaranQuery,
  useGetActiveTahunAjaranQuery,
  useCreateTahunAjaranMutation,
  useListSemestersQuery,
  useGetActiveSemesterQuery,
  useListSemestersByTahunAjaranQuery,
  useListMapelQuery,
  useCreateMapelMutation,
  useListKelasQuery,
  useListKelasByTahunAjaranQuery,
  useListSlotWaktuQuery,
  useListJadwalByKelasQuery,
  useListJadwalByGuruQuery,
} = akademikApi;
