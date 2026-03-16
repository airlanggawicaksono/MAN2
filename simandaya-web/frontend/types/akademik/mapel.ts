import { UUID } from "../common";

export interface MapelResponse {
  mapel_id: UUID;
  kode_mapel: string;
  nama_mapel: string;
  kelompok: string;
  jam_per_minggu: number;
  is_active: boolean;
}

export interface CreateMapelRequest {
  kode_mapel: string;
  nama_mapel: string;
  kelompok: string;
  jam_per_minggu: number;
  is_active?: boolean;
}

export interface UpdateMapelRequest {
  kode_mapel?: string;
  nama_mapel?: string;
  kelompok?: string;
  jam_per_minggu?: number;
  is_active?: boolean;
}
