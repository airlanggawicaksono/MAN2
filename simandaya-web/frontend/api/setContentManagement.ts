import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  CarouselSlide,
  CreateSlideRequest,
  UpdateSlideRequest,
  UploadImageResponse,
} from "@/types/cms";

export const cmsApi = createApi({
  reducerPath: "cmsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/cms" }),
  tagTypes: ["Slide"],
  endpoints: (builder) => ({
    listSlides: builder.query<CarouselSlide[], string | void>({
      query: (type) => (type ? `/slides?type=${type}` : "/slides"),
      providesTags: (result, error, type) => [
        { type: "Slide", id: type ?? "LIST" },
      ],
    }),
    createSlide: builder.mutation<CarouselSlide, CreateSlideRequest>({
      query: (body) => ({ url: "/slides", method: "POST", body }),
      invalidatesTags: [{ type: "Slide" }],
    }),
    updateSlide: builder.mutation<
      CarouselSlide,
      { id: string; body: UpdateSlideRequest }
    >({
      query: ({ id, body }) => ({ url: `/slides/${id}`, method: "PUT", body }),
      invalidatesTags: [{ type: "Slide" }],
    }),
    deleteSlide: builder.mutation<void, string>({
      query: (id) => ({ url: `/slides/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Slide" }],
    }),
    uploadImage: builder.mutation<UploadImageResponse, FormData>({
      query: (formData) => ({ url: "/upload", method: "POST", body: formData }),
    }),
  }),
});

export const {
  useListSlidesQuery,
  useCreateSlideMutation,
  useUpdateSlideMutation,
  useDeleteSlideMutation,
  useUploadImageMutation,
} = cmsApi;
