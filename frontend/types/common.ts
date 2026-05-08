export interface MessageResponse {
  message: string;
}

export type UUID = string;

export interface PaginationParams {
  skip: number;
  limit: number;
  search?: string;
}
