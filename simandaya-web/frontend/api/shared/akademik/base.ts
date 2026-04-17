import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQuery } from "../base";

export const akademikBaseApi = createApi({
  reducerPath: "akademikApi",
  baseQuery: createBaseQuery("/akademik"),
  tagTypes: ["Mapel", "Kelas", "KategoriKelas", "Jadwal", "GuruMapel", "TahunAjaran", "Semester", "Kurikulum"],
  keepUnusedDataFor: 120,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: () => ({}),
});
