export type ContentType = "carousel" | "flyer" | "media" | "video" | "lokasi";
export type ImageFitMode = "cover" | "contain" | "fill";

export interface CarouselSlide {
  id: string;
  type: ContentType;
  title: string | null;
  description: string | null;
  bg: string;
  fg: string;
  image_url: string | null;
  image_version?: number | null;
  image_fit?: ImageFitMode | null;
  image_position_x?: number | null;
  image_position_y?: number | null;
  image_zoom?: number | null;
  link_url: string | null;
  link_label: string | null;
  order_index: number;
  is_active: boolean;
}

export interface CreateSlideRequest {
  type?: ContentType;
  title?: string | null;
  description?: string | null;
  bg: string;
  fg: string;
  image_url?: string | null;
  image_version?: number | null;
  image_fit?: ImageFitMode | null;
  image_position_x?: number | null;
  image_position_y?: number | null;
  image_zoom?: number | null;
  link_url?: string | null;
  link_label?: string | null;
  order_index?: number;
}

export type UpdateSlideRequest = Partial<CreateSlideRequest> & {
  is_active?: boolean;
};

export interface UploadImageResponse {
  url: string;
}
