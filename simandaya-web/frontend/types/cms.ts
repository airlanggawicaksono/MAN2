export type ContentType = "carousel" | "flyer" | "media" | "video" | "lokasi";

export interface CarouselSlide {
  id: string;
  type: ContentType;
  title: string | null;
  description: string | null;
  bg: string;
  fg: string;
  image_url: string | null;
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
