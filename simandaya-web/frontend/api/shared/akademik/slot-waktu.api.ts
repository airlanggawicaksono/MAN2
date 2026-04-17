import type {
  CreateSlotWaktuRequest,
  SlotWaktuResponse,
} from "@/types/akademik/slot-waktu";
import { akademikBaseApi } from "./base";

export const slotWaktuApi = akademikBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSlotWaktu: builder.query<SlotWaktuResponse[], void>({
      query: () => "/slot-waktu",
      providesTags: ["Jadwal"],
    }),
    createSlotWaktu: builder.mutation<SlotWaktuResponse, CreateSlotWaktuRequest>({
      query: (body) => ({ url: "/slot-waktu", method: "POST", body }),
      invalidatesTags: ["Jadwal"],
    }),
  }),
});

export const { useListSlotWaktuQuery, useCreateSlotWaktuMutation } = slotWaktuApi;
