import { UUID } from "../common";

export interface SlotWaktuResponse {
  slot_id: UUID;
  nama: string;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  is_piket: boolean;
}

export interface CreateSlotWaktuRequest {
  nama: string;
  jam_mulai: string;
  jam_selesai: string;
  urutan: number;
  is_piket?: boolean;
}
